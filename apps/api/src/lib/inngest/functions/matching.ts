import { ProgramPlacementStatus } from '@prisma/client'
import { inngest } from '../client.js'
import { getPrisma } from '../../prisma.js'

const sendSms = async (params: unknown) => {
  console.log('TODO: SMS integration', params)
}

function generateConfirmationCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export const matchingFn = inngest.createFunction(
  { id: 'matching', name: 'Vacation job matching' },
  { event: 'matching/trigger' },
  async ({ event, logger }) => {
    const prisma = getPrisma()
    const { cycleId } = event.data

    logger.info({ cycleId }, 'Running vacation job matching')

    const cycle = await prisma.programCycle.findUnique({ where: { id: cycleId } })

    if (!cycle || (cycle.status !== 'OPEN' && cycle.status !== 'MATCHING')) {
      logger.info('Cycle not found or not in OPEN/MATCHING state')
      return { success: false, message: 'Invalid cycle status' }
    }

    if (cycle.status === 'OPEN') {
      await prisma.programCycle.update({
        where: { id: cycleId },
        data: { status: 'MATCHING' },
      })
    }

    const edLevels = await prisma.educationLevel.findMany()
    const edLevelOrderMap = new Map(edLevels.map((e) => [e.id, e.levelOrder]))

    const capacities = await prisma.programHostingCapacity.findMany({
      where: { cycleId },
      include: {
        employer: { include: { address: true } },
        cycle: true,
      },
    })

    for (const capacity of capacities) {
      const currentPlacements = await prisma.programPlacement.count({
        where: {
          cycleId,
          employerId: capacity.employerId,
          status: { in: ['MATCHED', 'CONFIRMED'] },
        },
      })

      const availableSlots = capacity.slotsOffered - currentPlacements
      if (availableSlots <= 0) continue

      const candidates = await prisma.individual.findMany({
        where: {
          vacationJobOptIn: true,
          placements: { none: { cycleId } },
          user: {
            address: { stateId: capacity.stateId },
            isActive: true,
          },
        },
        include: { user: true, sectorInterests: true },
        orderBy: { vacationJobOptInAt: 'asc' },
      })

      let placedThisCapacity = 0

      for (const candidate of candidates) {
        if (placedThisCapacity >= availableSlots) break

        if (capacity.preferredEducationLevelId && candidate.educationLevelId) {
          const prefLevel = edLevelOrderMap.get(capacity.preferredEducationLevelId)
          const candLevel = edLevelOrderMap.get(candidate.educationLevelId)
          if (prefLevel !== undefined && candLevel !== undefined) {
            if (Math.abs(prefLevel - candLevel) > 1) continue
          }
        }

        if (capacity.preferredSectors.length > 0) {
          const hasSectorInterest = candidate.sectorInterests.some((s) =>
            capacity.preferredSectors.includes(s.sectorId),
          )
          if (!hasSectorInterest) continue
        }

        const code = generateConfirmationCode()
        const placement = await prisma.programPlacement.create({
          data: {
            individualId: candidate.id,
            employerId: capacity.employerId,
            cycleId,
            matchDate: new Date(),
            reportDate: new Date(cycle.startDate),
            contactName: capacity.contactName,
            contactPhone: capacity.contactPhone,
            confirmationCode: code,
            status: ProgramPlacementStatus.MATCHED,
            confirmationDeadline: new Date(Date.now() + 48 * 60 * 60 * 1000),
          },
        })

        if (candidate.user.phoneNumber) {
          const message = `LiberiaWorks Vacation Job: You have been matched with ${capacity.employer.companyName}! Report date: ${cycle.startDate.toISOString().split('T')[0]}. Contact: ${capacity.contactName} (${capacity.contactPhone}). Reply with confirmation code: ${code} to confirm within 48h.`
          await sendSms({
            to: candidate.user.phoneNumber,
            body: message,
            userId: candidate.user.id,
            prisma,
          })
        }

        await prisma.auditLog.create({
          data: {
            actorUserId: null,
            actorRole: 'SYSTEM',
            action: 'PROGRAM_MATCH_CREATED',
            targetTable: 'program_placements',
            targetId: placement.id,
            afterData: JSON.parse(JSON.stringify(placement)),
          },
        })

        placedThisCapacity++
      }
    }

    return { success: true }
  },
)
