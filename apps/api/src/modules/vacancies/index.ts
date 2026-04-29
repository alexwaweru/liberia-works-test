import type { FastifyPluginAsync } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import {
  CreateVacancySchema,
  UpdateVacancySchema,
  VacancyResponseSchema,
  VacancyListResponseSchema,
  VacancyFilterSchema,
  MessageResponseSchema,
} from '@liberia-works/shared-schemas'
import { EMPLOYER_ROLES } from '@liberia-works/shared-types'
import { requireRole } from '../../plugins/auth.js'
import { Prisma } from '@prisma/client'
import type { FastifyReply } from 'fastify'
import type { Vacancy } from '@prisma/client'

type VacancyWithCount = Vacancy & { _count: { applications: number } }

function formatVacancy(v: VacancyWithCount) {
  const deadline =
    v.deadline instanceof Date
      ? v.deadline.toISOString().split('T')[0]!
      : String(v.deadline)
  return {
    id: v.id,
    employerId: v.employerId,
    title: v.title,
    description: v.description,
    vacancyType: v.vacancyType as string,
    stateId: v.stateId,
    sectorId: v.sectorId,
    occupationId: v.occupationId,
    minimumEducationLevelId: v.minimumEducationLevelId,
    slotsAvailable: v.slotsAvailable,
    deadline,
    isMandatoryAdvertised: v.isMandatoryAdvertised,
    status: v.status as string,
    applicationForm: (v.applicationForm as Record<string, unknown> | null) ?? null,
    postedAt: v.postedAt?.toISOString() ?? null,
    createdAt: v.createdAt.toISOString(),
    updatedAt: v.updatedAt.toISOString(),
    applicationsCount: v._count.applications,
  }
}

// Converts a nullable JSON value to what Prisma expects for JsonB fields
function toJsonInput(val: Record<string, unknown> | null | undefined): Prisma.InputJsonValue | typeof Prisma.JsonNull | undefined {
  if (val === undefined) return undefined
  if (val === null) return Prisma.JsonNull
  return val as Prisma.InputJsonValue
}

export const vacanciesModule: FastifyPluginAsync = async (app) => {
  const server = app.withTypeProvider<ZodTypeProvider>()

  async function getEmployerId(userId: string, reply: FastifyReply): Promise<string | null> {
    const eu = await app.prisma.employerUser.findFirst({
      where: { userId, isActive: true },
      select: { employerId: true },
    })
    if (!eu) { reply.notFound('No employer found for this user'); return null }
    return eu.employerId
  }

  // GET / — list current employer's vacancies (cursor-paginated)
  server.get('/', {
    schema: {
      tags: ['vacancies'],
      summary: "List the current employer's vacancies",
      querystring: VacancyFilterSchema,
      response: { 200: VacancyListResponseSchema },
    },
    preHandler: [requireRole(EMPLOYER_ROLES)],
  }, async (req, reply) => {
    const employerId = await getEmployerId(req.authUser!.id, reply)
    if (!employerId) return

    const { cursor, status, sortBy, sortDir } = req.query
    const PAGE_SIZE = 20
    const dir = sortDir ?? 'desc'

    const orderBy = sortBy === 'deadline'
      ? [{ deadline: dir }, { id: dir }]
      : sortBy === 'postedAt'
        ? [{ postedAt: dir }, { id: dir }]
        : [{ createdAt: 'desc' as const }, { id: 'desc' as const }]

    const where = { employerId, isActive: true, ...(status ? { status } : {}) }

    const [total, rows] = await Promise.all([
      app.prisma.vacancy.count({ where }),
      app.prisma.vacancy.findMany({
        where,
        orderBy,
        include: { _count: { select: { applications: true } } },
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        take: PAGE_SIZE + 1,
      }),
    ])

    const hasMore = rows.length > PAGE_SIZE
    const data = hasMore ? rows.slice(0, PAGE_SIZE) : rows
    const nextCursor = hasMore ? data[data.length - 1]!.id : null

    return { data: data.map(formatVacancy), pagination: { nextCursor, hasMore, total } }
  })

  // POST / — create vacancy
  server.post('/', {
    schema: {
      tags: ['vacancies'],
      summary: 'Create a new vacancy',
      body: CreateVacancySchema,
      response: { 201: VacancyResponseSchema },
    },
    preHandler: [requireRole(EMPLOYER_ROLES)],
  }, async (req, reply) => {
    const employerId = await getEmployerId(req.authUser!.id, reply)
    if (!employerId) return
    const b = req.body
    const appForm = toJsonInput(b.applicationForm)
    const created = await app.prisma.vacancy.create({
      data: {
        employerId,
        title: b.title,
        description: b.description,
        vacancyType: b.vacancyType,
        stateId: b.stateId,
        deadline: new Date(b.deadline),
        slotsAvailable: b.slotsAvailable,
        isMandatoryAdvertised: b.isMandatoryAdvertised ?? false,
        ...(b.sectorId !== undefined ? { sectorId: b.sectorId } : {}),
        ...(b.occupationId !== undefined ? { occupationId: b.occupationId } : {}),
        ...(b.minimumEducationLevelId !== undefined ? { minimumEducationLevelId: b.minimumEducationLevelId } : {}),
        ...(appForm !== undefined ? { applicationForm: appForm } : {}),
      },
    })
    const vacancy = await app.prisma.vacancy.findFirst({
      where: { id: created.id },
      include: { _count: { select: { applications: true } } },
    })
    return reply.status(201).send(formatVacancy(vacancy!))
  })

  // GET /:id — get single vacancy
  server.get('/:id', {
    schema: {
      tags: ['vacancies'],
      summary: 'Get a vacancy by ID',
      response: { 200: VacancyResponseSchema },
    },
    preHandler: [requireRole(EMPLOYER_ROLES)],
  }, async (req, reply) => {
    const employerId = await getEmployerId(req.authUser!.id, reply)
    if (!employerId) return
    const { id } = req.params as { id: string }
    const vacancy = await app.prisma.vacancy.findFirst({
      where: { id, employerId, isActive: true },
      include: { _count: { select: { applications: true } } },
    })
    if (!vacancy) return reply.notFound('Vacancy not found')
    return formatVacancy(vacancy)
  })

  // PATCH /:id — update vacancy
  server.patch('/:id', {
    schema: {
      tags: ['vacancies'],
      summary: 'Update a vacancy',
      body: UpdateVacancySchema,
      response: { 200: VacancyResponseSchema },
    },
    preHandler: [requireRole(EMPLOYER_ROLES)],
  }, async (req, reply) => {
    const employerId = await getEmployerId(req.authUser!.id, reply)
    if (!employerId) return
    const { id } = req.params as { id: string }
    const existing = await app.prisma.vacancy.findFirst({
      where: { id, employerId, isActive: true },
    })
    if (!existing) return reply.notFound('Vacancy not found')
    const b = req.body
    const appForm = toJsonInput(b.applicationForm)
    await app.prisma.vacancy.update({
      where: { id },
      data: {
        ...(b.title !== undefined ? { title: b.title } : {}),
        ...(b.description !== undefined ? { description: b.description } : {}),
        ...(b.vacancyType !== undefined ? { vacancyType: b.vacancyType } : {}),
        ...(b.stateId !== undefined ? { stateId: b.stateId } : {}),
        ...(b.slotsAvailable !== undefined ? { slotsAvailable: b.slotsAvailable } : {}),
        ...(b.isMandatoryAdvertised !== undefined ? { isMandatoryAdvertised: b.isMandatoryAdvertised } : {}),
        ...(b.deadline !== undefined ? { deadline: new Date(b.deadline) } : {}),
        ...(b.sectorId !== undefined ? { sectorId: b.sectorId } : {}),
        ...(b.occupationId !== undefined ? { occupationId: b.occupationId } : {}),
        ...(b.minimumEducationLevelId !== undefined ? { minimumEducationLevelId: b.minimumEducationLevelId } : {}),
        ...(appForm !== undefined ? { applicationForm: appForm } : {}),
      },
    })
    const updated = await app.prisma.vacancy.findFirst({
      where: { id },
      include: { _count: { select: { applications: true } } },
    })
    return formatVacancy(updated!)
  })

  // POST /:id/publish — publish vacancy
  server.post('/:id/publish', {
    schema: {
      tags: ['vacancies'],
      summary: 'Publish a draft vacancy',
      response: { 200: VacancyResponseSchema },
    },
    preHandler: [requireRole(EMPLOYER_ROLES)],
  }, async (req, reply) => {
    const employerId = await getEmployerId(req.authUser!.id, reply)
    if (!employerId) return
    const { id } = req.params as { id: string }
    const existing = await app.prisma.vacancy.findFirst({
      where: { id, employerId, isActive: true },
    })
    if (!existing) return reply.notFound('Vacancy not found')
    if (existing.status !== 'DRAFT') return reply.badRequest('Only DRAFT vacancies can be published')
    await app.prisma.vacancy.update({
      where: { id },
      data: { status: 'ACTIVE', postedAt: new Date() },
    })
    const updated = await app.prisma.vacancy.findFirst({
      where: { id },
      include: { _count: { select: { applications: true } } },
    })
    return formatVacancy(updated!)
  })

  // DELETE /:id — soft-delete (archive)
  server.delete('/:id', {
    schema: {
      tags: ['vacancies'],
      summary: 'Archive a vacancy',
      response: { 200: MessageResponseSchema },
    },
    preHandler: [requireRole(EMPLOYER_ROLES)],
  }, async (req, reply) => {
    const employerId = await getEmployerId(req.authUser!.id, reply)
    if (!employerId) return
    const { id } = req.params as { id: string }
    const existing = await app.prisma.vacancy.findFirst({
      where: { id, employerId, isActive: true },
    })
    if (!existing) return reply.notFound('Vacancy not found')
    await app.prisma.vacancy.update({
      where: { id },
      data: { status: 'ARCHIVED', isActive: false },
    })
    return { message: 'Vacancy archived' }
  })
}

export default vacanciesModule
