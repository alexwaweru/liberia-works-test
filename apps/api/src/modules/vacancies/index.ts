import type { FastifyPluginAsync } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import {
  CreateVacancySchema,
  UpdateVacancySchema,
  VacancyResponseSchema,
  VacancyListResponseSchema,
  VacancyFilterSchema,
  MessageResponseSchema,
  PublicVacancyListResponseSchema,
  PublicVacancyDetailSchema,
  VacancyBrowseFilterSchema,
  ApplicationListResponseSchema,
  ApplicationDetailSchema,
  ApplicationFilterSchema,
  CreateApplicationSchema,
} from '@liberia-works/shared-schemas'
import { EMPLOYER_ROLES } from '@liberia-works/shared-types'
import { requireRole } from '../../plugins/auth.js'
import { encodeCursor, decodeCursor } from '../../lib/cursor.js'
import { Prisma } from '@prisma/client'
import type { FastifyReply } from 'fastify'
import type { Vacancy } from '@prisma/client'

type VacancyWithCount = Vacancy & { _count: { applications: number } }
type VacancyWithEmployer = Vacancy & { employer: { companyName: string } }

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

function formatPublicVacancy(v: VacancyWithEmployer) {
  const deadline =
    v.deadline instanceof Date
      ? v.deadline.toISOString().split('T')[0]!
      : String(v.deadline)
  return {
    id: v.id,
    employerId: v.employerId,
    companyName: v.employer.companyName,
    title: v.title,
    vacancyType: v.vacancyType as string,
    stateId: v.stateId,
    sectorId: v.sectorId,
    slotsAvailable: v.slotsAvailable,
    deadline,
    postedAt: v.postedAt?.toISOString() ?? null,
  }
}

function formatPublicVacancyDetail(v: VacancyWithEmployer) {
  return {
    ...formatPublicVacancy(v),
    description: v.description,
    applicationForm: (v.applicationForm as Record<string, unknown> | null) ?? null,
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
    if (!employerId) return undefined

    const { cursor, status, sortBy, sortDir } = req.query
    const PAGE_SIZE = 20
    const dir = sortDir ?? 'desc'

    const orderBy = sortBy === 'deadline'
      ? [{ deadline: dir }, { id: dir }]
      : sortBy === 'postedAt'
        ? [{ postedAt: dir }, { id: dir }]
        : [{ createdAt: 'desc' as const }, { id: 'desc' as const }]

    const where = { employerId, isActive: true, ...(status ? { status } : {}) }
    const decodedCursor = cursor ? decodeCursor(cursor) : undefined

    const [total, rows] = await Promise.all([
      app.prisma.vacancy.count({ where }),
      app.prisma.vacancy.findMany({
        where,
        orderBy,
        include: { _count: { select: { applications: true } } },
        ...(decodedCursor ? { cursor: { id: decodedCursor }, skip: 1 } : {}),
        take: PAGE_SIZE + 1,
      }),
    ])

    const hasMore = rows.length > PAGE_SIZE
    const data = hasMore ? rows.slice(0, PAGE_SIZE) : rows
    const nextCursor = hasMore ? encodeCursor(data[data.length - 1]!.id) : null

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
    if (!employerId) return undefined
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

  // GET /browse — public list of active vacancies for seekers (INDIVIDUAL role)
  server.get('/browse', {
    schema: {
      tags: ['vacancies'],
      summary: 'Browse active vacancies (seeker)',
      querystring: VacancyBrowseFilterSchema,
      response: { 200: PublicVacancyListResponseSchema },
    },
    preHandler: [requireRole(['INDIVIDUAL'])],
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
        include: { employer: { select: { companyName: true } } },
        ...(decodedCursor ? { cursor: { id: decodedCursor }, skip: 1 } : {}),
        take: PAGE_SIZE + 1,
      }),
    ])

    const hasMore = rows.length > PAGE_SIZE
    const data = hasMore ? rows.slice(0, PAGE_SIZE) : rows
    const nextCursor = hasMore ? encodeCursor(data[data.length - 1]!.id) : null

    return { data: data.map(formatPublicVacancy), pagination: { nextCursor, hasMore, total } }
  })

  // GET /browse/:id — public vacancy detail for seekers (INDIVIDUAL role)
  server.get('/browse/:id', {
    schema: {
      tags: ['vacancies'],
      summary: 'Get public vacancy detail (seeker)',
      response: { 200: PublicVacancyDetailSchema },
    },
    preHandler: [requireRole(['INDIVIDUAL'])],
  }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const vacancy = await app.prisma.vacancy.findFirst({
      where: { id, status: 'ACTIVE', isActive: true },
      include: { employer: { select: { companyName: true } } },
    })
    if (!vacancy) return reply.notFound('Vacancy not found')
    return formatPublicVacancyDetail(vacancy)
  })

  // POST /:vacancyId/applications — submit application (INDIVIDUAL role)
  server.post('/:vacancyId/applications', {
    schema: {
      tags: ['applications'],
      summary: 'Submit a job application',
      body: CreateApplicationSchema,
      response: { 201: MessageResponseSchema },
    },
    preHandler: [requireRole(['INDIVIDUAL'])],
  }, async (req, reply) => {
    const { vacancyId } = req.params as { vacancyId: string }
    const { responses } = req.body

    const individual = await app.prisma.individual.findUniqueOrThrow({
      where: { userId: req.authUser!.id },
    })

    const existing = await app.prisma.application.findFirst({
      where: { individualId: individual.id, vacancyId, isActive: true },
    })
    if (existing) return reply.conflict('Already applied')

    const vacancy = await app.prisma.vacancy.findFirst({
      where: { id: vacancyId, status: 'ACTIVE', isActive: true },
    })
    if (!vacancy) return reply.notFound('Vacancy not found')

    await app.prisma.application.create({
      data: {
        individualId: individual.id,
        vacancyId,
        channel: 'WEB',
        status: 'APPLIED',
        appliedAt: new Date(),
        responses: responses != null ? (responses as Prisma.InputJsonValue) : Prisma.JsonNull,
        statusChangedAt: new Date(),
      },
    })

    return reply.status(201).send({ message: 'Application submitted' })
  })

  // GET /:vacancyId/applications — list applications for a vacancy
  server.get('/:vacancyId/applications', {
    schema: {
      tags: ['applications'],
      summary: "List applications for a vacancy",
      querystring: ApplicationFilterSchema,
      response: { 200: ApplicationListResponseSchema },
    },
    preHandler: [requireRole(EMPLOYER_ROLES)],
  }, async (req, reply) => {
    const employerId = await getEmployerId(req.authUser!.id, reply)
    if (!employerId) return undefined

    const { vacancyId } = req.params as { vacancyId: string }
    const vacancy = await app.prisma.vacancy.findFirst({
      where: { id: vacancyId, employerId, isActive: true },
      select: { id: true },
    })
    if (!vacancy) return reply.notFound('Vacancy not found')

    const { cursor, status } = req.query
    const PAGE_SIZE = 20
    const where = {
      vacancyId,
      isActive: true,
      ...(status ? { status } : {}),
    }
    const decodedCursor = cursor ? decodeCursor(cursor) : undefined

    const [total, rows] = await Promise.all([
      app.prisma.application.count({ where }),
      app.prisma.application.findMany({
        where,
        orderBy: [{ appliedAt: 'desc' }, { id: 'desc' }],
        include: {
          individual: {
            include: { user: { select: { fullName: true, email: true } } },
          },
        },
        ...(decodedCursor ? { cursor: { id: decodedCursor }, skip: 1 } : {}),
        take: PAGE_SIZE + 1,
      }),
    ])

    const hasMore = rows.length > PAGE_SIZE
    const data = hasMore ? rows.slice(0, PAGE_SIZE) : rows
    const nextCursor = hasMore ? encodeCursor(data[data.length - 1]!.id) : null

    type AppStatus = 'APPLIED' | 'SHORTLISTED' | 'REJECTED' | 'WITHDRAWN' | 'HIRED'
    return {
      data: data.map((a) => ({
        id: a.id,
        applicantName: a.individual.user.fullName ?? null,
        applicantEmail: a.individual.user.email ?? null,
        appliedAt: a.appliedAt.toISOString(),
        status: a.status as AppStatus,
        statusChangedAt: a.statusChangedAt.toISOString(),
      })),
      pagination: { nextCursor, hasMore, total },
    }
  })

  // GET /:vacancyId/applications/:applicationId — get single application detail
  server.get('/:vacancyId/applications/:applicationId', {
    schema: {
      tags: ['applications'],
      summary: 'Get application detail',
      response: { 200: ApplicationDetailSchema },
    },
    preHandler: [requireRole(EMPLOYER_ROLES)],
  }, async (req, reply) => {
    const employerId = await getEmployerId(req.authUser!.id, reply)
    if (!employerId) return undefined

    const { vacancyId, applicationId } = req.params as { vacancyId: string; applicationId: string }
    const vacancy = await app.prisma.vacancy.findFirst({
      where: { id: vacancyId, employerId, isActive: true },
      select: { id: true },
    })
    if (!vacancy) return reply.notFound('Vacancy not found')

    const application = await app.prisma.application.findFirst({
      where: { id: applicationId, vacancyId, isActive: true },
      include: {
        individual: {
          include: {
            user: {
              select: {
                fullName: true,
                email: true,
                phoneNumber: true,
                dateOfBirth: true,
                gender: true,
              },
            },
            education: {
              orderBy: { startDate: 'desc' },
            },
            workHistory: {
              orderBy: { startDate: 'desc' },
            },
            skills: true,
          },
        },
      },
    })
    if (!application) return reply.notFound('Application not found')

    const u = application.individual.user

    function formatDate(d: Date | null | undefined): string | null {
      if (!d) return null
      return d instanceof Date ? d.toISOString().split('T')[0]! : String(d)
    }

    type AppStatus = 'APPLIED' | 'SHORTLISTED' | 'REJECTED' | 'WITHDRAWN' | 'HIRED'
    return {
      id: application.id,
      vacancyId: application.vacancyId,
      status: application.status as AppStatus,
      statusChangedAt: application.statusChangedAt.toISOString(),
      statusNote: application.statusNote ?? null,
      appliedAt: application.appliedAt.toISOString(),
      responses: (application.responses as Record<string, unknown> | null) ?? null,
      applicant: {
        fullName: u.fullName ?? null,
        email: u.email ?? null,
        phoneNumber: u.phoneNumber ?? null,
        dateOfBirth: formatDate(u.dateOfBirth),
        gender: u.gender ?? null,
        education: application.individual.education.map((e) => ({
          id: e.id,
          institutionName: e.institutionName,
          qualification: e.qualification ?? null,
          fieldOfStudy: e.fieldOfStudy ?? null,
          startDate: formatDate(e.startDate),
          endDate: formatDate(e.endDate),
          isCurrent: e.isCurrent,
        })),
        workHistory: application.individual.workHistory.map((w) => ({
          id: w.id,
          employerName: w.employerName,
          title: w.title ?? null,
          startDate: formatDate(w.startDate),
          endDate: formatDate(w.endDate),
          isCurrent: w.isCurrent,
          description: w.description ?? null,
        })),
        skills: application.individual.skills.map((s) => ({
          id: s.id,
          skillName: s.skillName,
          proficiency: s.proficiency ?? null,
          yearsExperience: s.yearsExperience ?? null,
        })),
      },
    }
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
    if (!employerId) return undefined
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
    if (!employerId) return undefined
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
    if (!employerId) return undefined
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
    if (!employerId) return undefined
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
