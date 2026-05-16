import { Worker } from "bullmq"
import { Redis } from "ioredis"
import { PrismaClient, ProgramPlacementStatus } from "@prisma/client"
import { env } from "../config/env.js"
const sendSms = async (params: any) => { console.log("TODO: SMS integration", params) }

const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
})

import { PrismaPg } from "@prisma/adapter-pg"
import pg from "pg"
const pool = new pg.Pool({ connectionString: env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

export interface MatchingJobData {
  cycleId: string
  requestId?: string
}

function generateConfirmationCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

const worker = new Worker<MatchingJobData>(
  "matching",
  async (job) => {
    const { cycleId } = job.data
    console.log({ cycleId }, "Running vacation job matching")

    // 1. Fetch cycle
    const cycle = await prisma.programCycle.findUnique({
      where: { id: cycleId },
    })

    if (!cycle || (cycle.status !== "OPEN" && cycle.status !== "MATCHING")) {
      console.log("Cycle not found or not in OPEN/MATCHING state")
      return { success: false, message: "Invalid cycle status" }
    }

    // Update cycle status to MATCHING if it was OPEN
    if (cycle.status === "OPEN") {
      await prisma.programCycle.update({
        where: { id: cycleId },
        data: { status: "MATCHING" }
      })
    }

    // Fetch education levels for easy level distance calculation
    const edLevels = await prisma.educationLevel.findMany()
    const edLevelOrderMap = new Map(edLevels.map(e => [e.id, e.levelOrder]))

    // 2. Fetch all active hosting capacities for this cycle with available slots
    const capacities = await prisma.programHostingCapacity.findMany({
      where: { cycleId },
      include: {
        employer: {
          include: {
            address: true
          }
        },
        cycle: true,
      }
    })

    // 3. Process each capacity
    for (const capacity of capacities) {
      // Count current placements for this capacity
      const currentPlacements = await prisma.programPlacement.count({
        where: {
          cycleId,
          employerId: capacity.employerId,
          status: { in: ["MATCHED", "CONFIRMED"] }
        }
      })

      const availableSlots = capacity.slotsOffered - currentPlacements
      if (availableSlots <= 0) continue

      // Find potential candidates
      // Criteria: 
      // - vacationJobOptIn = true
      // - No existing placement for this cycle
      // - County match (user.address.stateId === capacity.stateId)
      const candidates = await prisma.individual.findMany({
        where: {
          vacationJobOptIn: true,
          placements: {
            none: { cycleId }
          },
          user: {
            address: {
              stateId: capacity.stateId
            },
            isActive: true
          }
        },
        include: {
          user: true,
          sectorInterests: true,
        },
        orderBy: {
          vacationJobOptInAt: "asc" // First come first served
        }
      })

      let placedThisCapacity = 0

      for (const candidate of candidates) {
        if (placedThisCapacity >= availableSlots) break

        // Check Education Level (within 1 ISCED level)
        if (capacity.preferredEducationLevelId && candidate.educationLevelId) {
          const prefLevel = edLevelOrderMap.get(capacity.preferredEducationLevelId)
          const candLevel = edLevelOrderMap.get(candidate.educationLevelId)
          
          if (prefLevel !== undefined && candLevel !== undefined) {
            if (Math.abs(prefLevel - candLevel) > 1) {
              continue // Too far apart
            }
          }
        }

        // Check Sector Interest (if employer preferred any sectors, candidate must overlap with at least one)
        if (capacity.preferredSectors.length > 0) {
          const hasSectorInterest = candidate.sectorInterests.some(s => capacity.preferredSectors.includes(s.sectorId))
          if (!hasSectorInterest) {
            continue
          }
        }

        // Match found!
        const code = generateConfirmationCode()
        
        const placement = await prisma.programPlacement.create({
          data: {
            individualId: candidate.id,
            employerId: capacity.employerId,
            cycleId: cycleId,
            matchDate: new Date(),
            reportDate: new Date(cycle.startDate), // Approximate report date as cycle start
            contactName: capacity.contactName,
            contactPhone: capacity.contactPhone,
            confirmationCode: code,
            status: ProgramPlacementStatus.MATCHED,
            confirmationDeadline: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48h deadline
          }
        })

        // Send Notification
        if (candidate.user.phoneNumber) {
          const message = `LiberiaWorks Vacation Job: You have been matched with ${capacity.employer.companyName}! Report date: ${cycle.startDate.toISOString().split("T")[0]}. Contact: ${capacity.contactName} (${capacity.contactPhone}). Reply with confirmation code: ${code} to confirm within 48h.`
          
          await sendSms({
            to: candidate.user.phoneNumber,
            body: message,
            userId: candidate.user.id,
            prisma
          })
        }

        // Audit Log
        await prisma.auditLog.create({
          data: {
            actorUserId: null, // System action
            actorRole: "SYSTEM",
            action: "PROGRAM_MATCH_CREATED",
            targetTable: "program_placements",
            targetId: placement.id,
            afterData: JSON.parse(JSON.stringify(placement)),
          }
        })

        placedThisCapacity++
      }
    }

    return { success: true }
  },
  { connection: redis, concurrency: 1 },
)

worker.on("failed", (job, err) => {
  console.error({ jobId: job?.id, err }, "Matching job failed")
})

process.on("SIGTERM", async () => {
  await worker.close()
  await prisma.$disconnect()
  await redis.quit()
})
