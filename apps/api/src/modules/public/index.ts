import type { FastifyPluginAsync } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import {
  PublicStatsResponseSchema,
  LandingPublicVacancyListItemSchema,
  LandingPublicVacancyListResponseSchema,
  LandingVacancyBrowseFilterSchema,
  LandingPublicVacancyDetailSchema,
  PublicProgramCycleListItemSchema,
  PublicProgramCycleListResponseSchema,
  PublicProgramCycleDetailSchema,
} from '@liberia-works/shared-schemas'
import { encodeCursor, decodeCursor } from '../../lib/cursor.js'
import type { Vacancy, ProgramCycle } from '@prisma/client'

type VacancyWithRelations = Vacancy & {
  employer: { companyName: string }
  _count: { applications: number }
}

type CycleRow = ProgramCycle

function formatDate(d: Date | string): string {
  return d instanceof Date ? d.toISOString().split('T')[0]! : String(d)
}

function formatPublicVacancyListItem(v: VacancyWithRelations) {
  return {
    id: v.id,
    employerId: v.employerId,
    companyName: v.employer.companyName,
    title: v.title,
    vacancyType: v.vacancyType as string,
    stateId: v.stateId,
    sectorId: v.sectorId ?? null,
    occupationId: v.occupationId ?? null,
    slotsAvailable: v.slotsAvailable,
    deadline: formatDate(v.deadline),
    postedAt: v.postedAt?.toISOString() ?? null,
    applicationsCount: v._count.applications,
  }
}

function formatPublicCycleListItem(c: CycleRow) {
  return {
    id: c.id,
    name: c.name,
    description: c.description ?? null,
    status: c.status as string,
    openAt: formatDate(c.startDate),
    closeAt: formatDate(c.endDate),
    createdAt: c.createdAt.toISOString(),
  }
}

function formatPublicCycleDetail(c: CycleRow) {
  return {
    ...formatPublicCycleListItem(c),
    type: c.type as string,
    year: c.year,
  }
}

export const publicModule: FastifyPluginAsync = async (app) => {
  const server = app.withTypeProvider<ZodTypeProvider>()

  // GET /stats — aggregate counts for the landing page hero section
  server.get('/stats', {
    schema: {
      tags: ['public'],
      summary: 'Landing page aggregate stats (unauthenticated)',
      response: { 200: PublicStatsResponseSchema },
    },
  }, async (_req, reply) => {
    const [employers, individuals, openPositions] = await Promise.all([
      app.prisma.employer.count({ where: { isActive: true } }),
      app.prisma.user.count({ where: { role: 'INDIVIDUAL', isActive: true } }),
      app.prisma.vacancy.count({ where: { status: 'ACTIVE', isActive: true } }),
    ])

    return reply
      .header('Cache-Control', 'public, max-age=60')
      .send({ employers, individuals, openPositions })
  })

  // GET /vacancies — public paginated list of active vacancies
  server.get('/vacancies', {
    schema: {
      tags: ['public'],
      summary: 'Browse active vacancies (unauthenticated)',
      querystring: LandingVacancyBrowseFilterSchema,
      response: { 200: LandingPublicVacancyListResponseSchema },
    },
  }, async (req) => {
    const { cursor, limit, keyword, vacancyType, stateId } = req.query
    const PAGE_SIZE = limit ?? 20

    const where = {
      status: 'ACTIVE' as const,
      isActive: true,
      ...(vacancyType ? { vacancyType } : {}),
      ...(stateId ? { stateId } : {}),
      ...(keyword ? { title: { contains: keyword, mode: 'insensitive' as const } } : {}),
    }
    const decodedCursor = cursor ? decodeCursor(cursor) : undefined

    const [total, rows] = await Promise.all([
      app.prisma.vacancy.count({ where }),
      app.prisma.vacancy.findMany({
        where,
        orderBy: [{ postedAt: 'desc' }, { id: 'desc' }],
        include: {
          employer: { select: { companyName: true } },
          _count: { select: { applications: true } },
        },
        ...(decodedCursor ? { cursor: { id: decodedCursor }, skip: 1 } : {}),
        take: PAGE_SIZE + 1,
      }),
    ])

    const hasMore = rows.length > PAGE_SIZE
    const data = hasMore ? rows.slice(0, PAGE_SIZE) : rows
    const nextCursor = hasMore ? encodeCursor(data[data.length - 1]!.id) : null

    return { data: data.map(formatPublicVacancyListItem), pagination: { nextCursor, hasMore, total } }
  })

  // GET /vacancies/:id — public single vacancy detail (active only)
  server.get('/vacancies/:id', {
    schema: {
      tags: ['public'],
      summary: 'Get public vacancy detail (unauthenticated)',
      params: z.object({ id: z.string().uuid() }),
      response: { 200: LandingPublicVacancyDetailSchema },
    },
  }, async (req, reply) => {
    const { id } = req.params
    const vacancy = await app.prisma.vacancy.findFirst({
      where: { id, status: 'ACTIVE', isActive: true },
      include: {
        employer: { select: { companyName: true } },
        _count: { select: { applications: true } },
      },
    })
    if (!vacancy) return reply.notFound('Vacancy not found')
    return { ...formatPublicVacancyListItem(vacancy), description: vacancy.description }
  })

  // GET /programs/cycles — public list of OPEN program cycles (paginated)
  server.get('/programs/cycles', {
    schema: {
      tags: ['public'],
      summary: 'List open program cycles (unauthenticated)',
      querystring: z.object({
        cursor: z.string().optional(),
        limit: z.coerce.number().int().min(1).max(50).default(20),
      }),
      response: { 200: PublicProgramCycleListResponseSchema },
    },
  }, async (req) => {
    const { cursor, limit } = req.query
    const PAGE_SIZE = limit ?? 20

    const where = { status: 'OPEN' as const }
    const decodedCursor = cursor ? decodeCursor(cursor) : undefined

    const [total, rows] = await Promise.all([
      app.prisma.programCycle.count({ where }),
      app.prisma.programCycle.findMany({
        where,
        orderBy: [{ startDate: 'desc' }, { id: 'desc' }],
        ...(decodedCursor ? { cursor: { id: decodedCursor }, skip: 1 } : {}),
        take: PAGE_SIZE + 1,
      }),
    ])

    const hasMore = rows.length > PAGE_SIZE
    const data = hasMore ? rows.slice(0, PAGE_SIZE) : rows
    const nextCursor = hasMore ? encodeCursor(data[data.length - 1]!.id) : null

    return { data: data.map(formatPublicCycleListItem), pagination: { nextCursor, hasMore, total } }
  })

  // GET /programs/cycles/:id — public single program cycle detail (OPEN only)
  server.get('/programs/cycles/:id', {
    schema: {
      tags: ['public'],
      summary: 'Get public program cycle detail (unauthenticated)',
      params: z.object({ id: z.string().uuid() }),
      response: { 200: PublicProgramCycleDetailSchema },
    },
  }, async (req, reply) => {
    const { id } = req.params
    const cycle = await app.prisma.programCycle.findFirst({
      where: { id, status: 'OPEN' },
    })
    if (!cycle) return reply.notFound('Program cycle not found')
    return formatPublicCycleDetail(cycle)
  })
}

export default publicModule
