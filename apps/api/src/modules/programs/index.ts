import type { FastifyPluginAsync } from "fastify"
import { ZodTypeProvider } from "fastify-type-provider-zod"
import { z } from "zod"
import {
  ProgramCycleListResponseSchema,
  ProgramCycleFilterSchema,
  ProgramCycleResponseSchema,
  ProgramOptInSchema,
  ProgramPlacementListResponseSchema,
} from "@liberia-works/shared-schemas"
import { EMPLOYER_ROLES } from "@liberia-works/shared-types"
import { requireRole } from "../../plugins/auth.js"
import { encodeCursor, decodeCursor } from "../../lib/cursor.js"
import type { ProgramCycle } from "@prisma/client"
import { Queue } from "bullmq"
import { env } from "../../config/env.js"

function formatCycle(c: ProgramCycle) {
  return {
    id: c.id,
    type: c.type as string,
    name: c.name,
    description: c.description ?? null,
    year: c.year,
    startDate: c.startDate instanceof Date ? c.startDate.toISOString().split("T")[0]! : String(c.startDate),
    endDate: c.endDate instanceof Date ? c.endDate.toISOString().split("T")[0]! : String(c.endDate),
    status: c.status as string,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  }
}

const OptInRequestSchema = z.object({
  programCycleId: z.string(),
  preferredSectors: z.array(z.string()).optional(),
  preferredCounties: z.array(z.number()).optional(),
  preferredEducationLevelId: z.string().optional(),
  additionalNotes: z.string().optional(),
})

const OptInResponseSchema = z.object({
  id: z.string(),
  individualId: z.string(),
  programCycleId: z.string(),
  status: z.string(),
  preferredSectors: z.array(z.string()).nullable(),
  preferredCounties: z.array(z.number()).nullable(),
  preferredEducationLevelId: z.string().nullable(),
  additionalNotes: z.string().nullable(),
  matchedEmployerId: z.string().nullable(),
  matchedAt: z.string().nullable(),
  createdAt: z.string(),
})

const MyOptInsResponseSchema = z.object({
  data: z.array(z.object({
    id: z.string(),
    individualId: z.string(),
    programCycleId: z.string(),
    status: z.string(),
    preferredSectors: z.array(z.object({
      id: z.string(),
      name: z.string(),
      code: z.string().nullable(),
    })),
    preferredCounties: z.array(z.object({
      id: z.number(),
      name: z.string(),
      code: z.string().nullable(),
    })),
    preferredEducationLevel: z.object({
      id: z.string(),
      name: z.string(),
      code: z.string(),
    }).nullable(),
    additionalNotes: z.string().nullable(),
    matchedEmployerId: z.string().nullable(),
    matchedAt: z.string().nullable(),
    createdAt: z.string(),
    programCycle: z.object({
      id: z.string(),
      name: z.string(),
      year: z.number(),
      status: z.string(),
    }),
    matchedEmployer: z.object({
      id: z.string(),
      companyName: z.string(),
    }).nullable(),
  })),
  pagination: z.object({
    nextCursor: z.string().nullable(),
    hasMore: z.boolean(),
    total: z.number(),
  }),
})

const matchingQueue = new Queue("matching", { connection: { url: env.REDIS_URL } })

export const programsModule: FastifyPluginAsync = async (app) => {
  const server = app.withTypeProvider<ZodTypeProvider>()

  // GET /cycles — list all program cycles (paginated)
  server.get("/cycles", {
    schema: {
      tags: ["programs"],
      summary: "List program cycles",
      querystring: ProgramCycleFilterSchema,
      response: { 200: ProgramCycleListResponseSchema },
    },
    preHandler: [requireRole([...EMPLOYER_ROLES, "INDIVIDUAL"])],
  }, async (req) => {
    const { cursor, status, type, year } = req.query
    const PAGE_SIZE = 20

    const where = {
      ...(status ? { status } : {}),
      ...(type ? { type } : {}),
      ...(year ? { year } : {}),
    }

    const decodedCursor = cursor ? decodeCursor(cursor) : undefined

    const [total, rows] = await Promise.all([
      app.prisma.programCycle.count({ where }),
      app.prisma.programCycle.findMany({
        where,
        orderBy: [{ year: "desc" }, { startDate: "desc" }, { id: "desc" }],
        ...(decodedCursor ? { cursor: { id: decodedCursor }, skip: 1 } : {}),
        take: PAGE_SIZE + 1,
      }),
    ])

    const hasMore = rows.length > PAGE_SIZE
    const data = hasMore ? rows.slice(0, PAGE_SIZE) : rows
    const nextCursor = hasMore ? encodeCursor(data[data.length - 1]!.id) : null

    return { data: data.map(formatCycle), pagination: { nextCursor, hasMore, total } }
  })

  // POST /opt-in — opt into a program
  server.post('/opt-in', {
    schema: {
      tags: ['programs'],
      summary: 'Opt into a program cycle',
      body: OptInRequestSchema,
      response: { 201: OptInResponseSchema },
    },
    preHandler: [requireRole(['INDIVIDUAL'])],
  }, async (req, reply) => {
    const { programCycleId, preferredSectors, preferredCounties, preferredEducationLevelId, additionalNotes } = req.body

    const individual = await app.prisma.individual.findUnique({
      where: { userId: req.authUser!.id },
    })
    if (!individual) return reply.notFound('Individual profile not found')

    const program = await app.prisma.programCycle.findUnique({
      where: { id: programCycleId },
    })
    if (!program) return reply.notFound('Program not found')
    if (program.status !== 'OPEN') {
      return reply.badRequest('This program is not open for opt-ins')
    }

    if (preferredCounties && preferredCounties.length > 0) {
      const validCounties = await app.prisma.state.findMany({
        where: { 
          countryCode: 'LR',
          id: { in: preferredCounties }
        },
        select: { id: true }
      })
    
      if (validCounties.length !== preferredCounties.length) {
        const invalidCount = preferredCounties.length - validCounties.length
        const message = preferredCounties.length === 1 
          ? 'Invalid county ID provided' 
          : `${invalidCount} invalid county ID${invalidCount > 1 ? 's' : ''} provided`
        return reply.badRequest(message)
      }
    }

    if (preferredSectors && preferredSectors.length > 0) {
      const validSectors = await app.prisma.sector.findMany({
        where: { id: { in: preferredSectors } },
        select: { id: true }
      })
    
      if (validSectors.length !== preferredSectors.length) {
        const invalidCount = preferredSectors.length - validSectors.length
        const message = preferredSectors.length === 1 
          ? 'Invalid sector ID provided' 
          : `${invalidCount} invalid sector ID${invalidCount > 1 ? 's' : ''} provided`
        return reply.badRequest(message)
      }
    }

    if (preferredEducationLevelId) {
      const educationLevel = await app.prisma.educationLevel.findUnique({
        where: { id: preferredEducationLevelId },
      })
  
      if (!educationLevel) {
        return reply.badRequest('Invalid education level ID provided')
      }
    }

    const existing = await app.prisma.programOptIn.findFirst({
      where: {
        individualId: individual.id,
        programCycleId,
      },
    })
    if (existing) return reply.conflict('Already opted into this program')

    const optIn = await app.prisma.programOptIn.create({
      data: {
        individualId: individual.id,
        programCycleId,
        status: 'PENDING',
        preferredSectors: preferredSectors ?? [],
        preferredCounties: preferredCounties ?? [],
        preferredEducationLevelId: preferredEducationLevelId ?? null,
        additionalNotes: additionalNotes ?? null,
      },
    })

    return reply.status(201).send({
      id: optIn.id,
      individualId: optIn.individualId,
      programCycleId: optIn.programCycleId,
      status: optIn.status as string,
      preferredSectors: optIn.preferredSectors as string[] | [],
      preferredCounties: optIn.preferredCounties as number[] | [],
      preferredEducationLevelId: optIn.preferredEducationLevelId,
      additionalNotes: optIn.additionalNotes,
      matchedEmployerId: optIn.matchedEmployerId,
      matchedAt: optIn.matchedAt?.toISOString() ?? null,
      createdAt: optIn.createdAt.toISOString(),
    })
  })

  // GET /my-opt-ins — list current user's opt-ins
  server.get('/my-opt-ins', {
    schema: {
      tags: ['programs'],
      summary: 'Get my program opt-ins',
      querystring: z.object({
        cursor: z.string().optional(),
      }),
      response: { 200: MyOptInsResponseSchema },
    },
    preHandler: [requireRole(['INDIVIDUAL'])],
  }, async (req, reply) => {
    const individual = await app.prisma.individual.findUnique({
      where: { userId: req.authUser!.id },
    })
    if (!individual) return reply.notFound('Individual profile not found')
  
    const { cursor } = req.query
    const PAGE_SIZE = 20
    const decodedCursor = cursor ? decodeCursor(cursor) : undefined
  
    const [total, rows] = await Promise.all([
      app.prisma.programOptIn.count({
        where: { individualId: individual.id },
      }),
      app.prisma.programOptIn.findMany({
        where: { individualId: individual.id },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        include: {
          programCycle: {
            select: {
              id: true,
              name: true,
              year: true,
              status: true,
            },
          },
          matchedEmployer: {
            select: {
              id: true,
              companyName: true,
            },
          },
          preferredEducationLevel: {
            select: {
              id: true,
              name: true,
              iscedCode: true,
            },
          },
        },
        ...(decodedCursor ? { cursor: { id: decodedCursor }, skip: 1 } : {}),
        take: PAGE_SIZE + 1,
      }),
    ])
  
    const hasMore = rows.length > PAGE_SIZE
    const data: typeof rows = hasMore ? rows.slice(0, PAGE_SIZE) : rows
    const nextCursor = hasMore ? encodeCursor(data[data.length - 1]!.id) : null

    // Collect all unique sector and county IDs to fetch in batch
    const allSectorIds = [...new Set(data.flatMap((opt: any) => opt.preferredSectors as string[]))] as string[]
    const allCountyIds = [...new Set(data.flatMap((opt: any) => opt.preferredCounties as number[]))] as number[]
  
    const [sectors, counties] = await Promise.all([
      app.prisma.sector.findMany({
        where: { id: { in: allSectorIds } },
        select: { id: true, name: true, isicCode: true },
      }),
      app.prisma.state.findMany({
        where: { id: { in: allCountyIds } },
        select: { id: true, name: true, stateCode: true },
      }),
    ])
  
    const sectorMap = new Map(sectors.map(s => [s.id, s]))
    const countyMap = new Map(counties.map(c => [c.id, c]))
  
    return {
      data: data.map((optIn: any) => ({
        id: optIn.id,
        individualId: optIn.individualId,
        programCycleId: optIn.programCycleId,
        status: optIn.status as string,
        
        preferredSectors: (optIn.preferredSectors as string[]).map(id => ({
          id,
          name: sectorMap.get(id)?.name ?? 'Unknown',
          code: sectorMap.get(id)?.isicCode ?? null,
        })),
        
        preferredCounties: (optIn.preferredCounties as number[]).map(id => ({
          id,
          name: countyMap.get(id)?.name ?? 'Unknown',
          code: countyMap.get(id)?.stateCode ?? null,
        })),
        
        preferredEducationLevel: optIn.preferredEducationLevel ? {
          id: optIn.preferredEducationLevel.id,
          name: optIn.preferredEducationLevel.name,
          code: optIn.preferredEducationLevel.iscedCode,
        } : null,
        
        additionalNotes: optIn.additionalNotes,
        matchedEmployerId: optIn.matchedEmployerId,
        matchedAt: optIn.matchedAt?.toISOString() ?? null,
        createdAt: optIn.createdAt.toISOString(),
        
        programCycle: {
          id: optIn.programCycle.id,
          name: optIn.programCycle.name,
          year: optIn.programCycle.year,
          status: optIn.programCycle.status as string,
        },
        
        matchedEmployer: optIn.matchedEmployer ? {
          id: optIn.matchedEmployer.id,
          companyName: optIn.matchedEmployer.companyName,
        } : null,
      })),
      pagination: { nextCursor, hasMore, total },
    }
  })
  
  // GET COUNTIES
  server.get('/counties', {
    schema: {
      tags: ['programs'],
      summary: 'List Liberian counties',
      response: {
        200: z.object({
          data: z.array(z.object({
            id: z.number(),
            name: z.string(),
            code: z.string(),
          }))
        })
      },
    },
    preHandler: [requireRole([...EMPLOYER_ROLES, 'INDIVIDUAL'])],
  }, async () => {
    const counties = await app.prisma.state.findMany({
      where: { countryCode: 'LR' },
      orderBy: { name: 'asc' },
    })
    
    return {
      data: counties.map(c => ({
        id: c.id,
        name: c.name,
        code: c.stateCode,
      }))
    }
  })

  server.get('/sectors', {
    schema: {
      tags: ['programs'],
      summary: 'List sectors',
      response: {
        200: z.object({
          data: z.array(z.object({
            id: z.string(),
            name: z.string(),
            code: z.string(),
          }))
        })
      },
    },
    preHandler: [requireRole([...EMPLOYER_ROLES, 'INDIVIDUAL'])],
  }, async () => {
    const sectors = await app.prisma.sector.findMany({
      where: { level: 1 },
      orderBy: { isicCode: 'asc' },
    })
    
    return {
      data: sectors.map(s => ({
        id: s.id,
        name: s.name,
        code: s.isicCode,
      }))
    }
  })

  // GET /cycles/:id — get specific program cycle details
  server.get("/cycles/:id", {
    schema: {
      tags: ["programs"],
      summary: "Get program cycle details",
      params: z.object({ id: z.string().uuid() }),
      response: { 200: ProgramCycleResponseSchema },
    },
    preHandler: [requireRole([...EMPLOYER_ROLES, "INDIVIDUAL"])],
  }, async (req, reply) => {
    const cycle = await app.prisma.programCycle.findUnique({ where: { id: req.params.id } })
    if (!cycle) return reply.notFound("Program cycle not found")
    return formatCycle(cycle)
  })

  // POST /cycles/:id/opt-in — employer opt-in to a cycle
  server.post("/cycles/:id/opt-in", {
    schema: {
      tags: ["programs"],
      summary: "Opt-in to a program cycle (Employers only)",
      params: z.object({ id: z.string().uuid() }),
      body: ProgramOptInSchema,
    },
    preHandler: [requireRole(EMPLOYER_ROLES)],
  }, async (req, reply) => {
    const { id } = req.params
    const { id: userId } = req.authUser!

    const cycle = await app.prisma.programCycle.findUnique({ where: { id } })
    if (!cycle) return reply.notFound("Program cycle not found")
    if (cycle.status !== "OPEN") return reply.badRequest("Registration is not open for this program cycle")

    const employerUser = await app.prisma.employerUser.findFirst({
        where: { userId },
        select: { employerId: true }
    })
    if (!employerUser) return reply.forbidden("User is not associated with an employer")

    const hosting = await app.prisma.programHostingCapacity.upsert({
      where: {
        employerId_cycleId: {
          employerId: employerUser.employerId,
          cycleId: id,
        }
      },
      update: {
        slotsOffered: req.body.slotsOffered,
        preferredEducationLevelId: req.body.preferredEducationLevelId || null,
        stateId: req.body.stateId || 1,
        contactName: req.body.contactName,
        contactPhone: req.body.contactPhone,
        placementInstructions: req.body.placementInstructions || null,
      },
      create: {
        employerId: employerUser.employerId,
        cycleId: id,
        slotsOffered: req.body.slotsOffered,
        preferredEducationLevelId: req.body.preferredEducationLevelId || null,
        stateId: req.body.stateId || 1,
        contactName: req.body.contactName,
        contactPhone: req.body.contactPhone,
        placementInstructions: req.body.placementInstructions || null,
      }
    })

    // AUDIT
    await app.audit.record({
      actorUserId: userId,
      actorRole: req.authUser!.role,
      action: "EMPLOYER_PROGRAM_OPT_IN",
      targetTable: "program_hosting_capacity",
      targetId: hosting.id,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"] || "",
      requestId: req.id as string,
    })

    await matchingQueue.add("trigger-matching", { cycleId: id, requestId: req.id as string })
    return { success: true, message: "Opt-in successful" }
  })

  // GET /cycles/:id/matches — list matches for the employer
  server.get("/cycles/:id/matches", {
    schema: {
      tags: ["programs"],
      summary: "List matched job seekers for this cycle",
      params: z.object({ id: z.string().uuid() }),
      response: { 200: ProgramPlacementListResponseSchema },
    },
    preHandler: [requireRole(EMPLOYER_ROLES)],
  }, async (req, reply) => {
    const { id } = req.params
    const { id: userId } = req.authUser!

    const employerUser = await app.prisma.employerUser.findFirst({
        where: { userId },
        select: { employerId: true }
    })
    if (!employerUser) return reply.forbidden("User is not associated with an employer")

    const placements = await app.prisma.programPlacement.findMany({
      where: {
        cycleId: id,
        employerId: employerUser.employerId,
      },
      include: {
        individual: {
          include: {
            user: true,
            education: true,
            workHistory: true,
          }
        }
      }
    })

    return placements.map(p => ({
      id: p.id,
      matchDate: p.matchDate.toISOString(),
      status: p.status,
      individual: {
        id: p.individual.id,
        fullName: p.individual.user.fullName,
        email: p.individual.user.email,
        phoneNumber: p.individual.user.phoneNumber,
        dateOfBirth: p.individual.user.dateOfBirth?.toISOString() ?? null,
        gender: p.individual.user.gender,
        education: p.individual.education.map(e => ({
            institutionName: e.institutionName,
            qualification: e.qualification,
            fieldOfStudy: e.fieldOfStudy,
        })),
        experience: p.individual.workHistory.map(w => ({
            employerName: w.employerName,
            title: w.title,
        }))
      }
    }))

  })
}

export default programsModule
