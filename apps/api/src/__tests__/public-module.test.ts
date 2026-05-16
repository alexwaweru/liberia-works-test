import { describe, it, expect, vi } from 'vitest'
import Fastify from 'fastify'
import sensible from '@fastify/sensible'
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod'
import type { PrismaClient } from '@prisma/client'
import publicModule from '../modules/public/index.js'

// ── Fixtures ──────────────────────────────────────────────────────────────────

const VACANCY_ID = 'a1000000-0000-4000-8000-000000000001'
const EMPLOYER_ID = 'b0000000-0000-4000-8000-000000000001'
const CYCLE_ID = 'c0000000-0000-4000-8000-000000000001'

function makeVacancyRow(overrides: Record<string, unknown> = {}) {
  return {
    id: VACANCY_ID,
    employerId: EMPLOYER_ID,
    title: 'Software Engineer',
    description: 'Full description of the role.',
    vacancyType: 'PERMANENT',
    stateId: 1,
    sectorId: null,
    occupationId: null,
    minimumEducationLevelId: null,
    slotsAvailable: 3,
    deadline: new Date('2030-06-01'),
    isMandatoryAdvertised: false,
    status: 'ACTIVE',
    applicationForm: null,
    postedAt: new Date('2024-01-01T00:00:00.000Z'),
    isActive: true,
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    employer: { companyName: 'Acme Corp' },
    _count: { applications: 5 },
    ...overrides,
  }
}

function makeCycleRow(overrides: Record<string, unknown> = {}) {
  return {
    id: CYCLE_ID,
    type: 'VACATION_JOB',
    name: 'Summer 2024',
    description: 'Summer vacation jobs cycle.',
    year: 2024,
    startDate: new Date('2024-06-01'),
    endDate: new Date('2024-08-31'),
    status: 'OPEN',
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    ...overrides,
  }
}

function buildApp() {
  const app = Fastify({ logger: false })
  app.setValidatorCompiler(validatorCompiler)
  app.setSerializerCompiler(serializerCompiler)
  app.register(sensible)
  app.decorate('prisma', {
    employer: { count: vi.fn() },
    user: { count: vi.fn() },
    vacancy: {
      count: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
    programCycle: {
      count: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
  } as unknown as PrismaClient)
  return app
}

// ── Stats ─────────────────────────────────────────────────────────────────────

describe('GET /api/v1/public/stats', () => {
  it('returns 200 with correct shape and counts', async () => {
    const app = buildApp()
    ;(app.prisma.employer.count as ReturnType<typeof vi.fn>).mockResolvedValue(42)
    ;(app.prisma.user.count as ReturnType<typeof vi.fn>).mockResolvedValue(123)
    ;(app.prisma.vacancy.count as ReturnType<typeof vi.fn>).mockResolvedValue(17)

    await app.register(publicModule, { prefix: '/api/v1/public' })
    await app.ready()

    const res = await app.inject({ method: 'GET', url: '/api/v1/public/stats' })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body).toEqual({ employers: 42, individuals: 123, openPositions: 17 })
  })

  it('does not require an Authorization header', async () => {
    const app = buildApp()
    ;(app.prisma.employer.count as ReturnType<typeof vi.fn>).mockResolvedValue(0)
    ;(app.prisma.user.count as ReturnType<typeof vi.fn>).mockResolvedValue(0)
    ;(app.prisma.vacancy.count as ReturnType<typeof vi.fn>).mockResolvedValue(0)

    await app.register(publicModule, { prefix: '/api/v1/public' })
    await app.ready()

    const res = await app.inject({ method: 'GET', url: '/api/v1/public/stats' })
    expect(res.statusCode).toBe(200)
  })
})

// ── Public vacancies list ─────────────────────────────────────────────────────

describe('GET /api/v1/public/vacancies', () => {
  it('returns 200 with paginated data and correct fields', async () => {
    const app = buildApp()
    ;(app.prisma.vacancy.count as ReturnType<typeof vi.fn>).mockResolvedValue(1)
    ;(app.prisma.vacancy.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([makeVacancyRow()])

    await app.register(publicModule, { prefix: '/api/v1/public' })
    await app.ready()

    const res = await app.inject({ method: 'GET', url: '/api/v1/public/vacancies' })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.data).toHaveLength(1)
    expect(body.pagination).toMatchObject({ hasMore: false, total: 1, nextCursor: null })

    const item = body.data[0]
    expect(item.id).toBe(VACANCY_ID)
    expect(item.title).toBe('Software Engineer')
    expect(item.companyName).toBe('Acme Corp')
    expect(item.applicationsCount).toBe(5)
    expect(item).not.toHaveProperty('applicationForm')
    expect(item).not.toHaveProperty('description')
  })

  it('with ?keyword=eng — calls findMany with title ILIKE filter', async () => {
    const app = buildApp()
    ;(app.prisma.vacancy.count as ReturnType<typeof vi.fn>).mockResolvedValue(0)
    ;(app.prisma.vacancy.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([])

    await app.register(publicModule, { prefix: '/api/v1/public' })
    await app.ready()

    await app.inject({ method: 'GET', url: '/api/v1/public/vacancies?keyword=eng' })

    const calledWith = (app.prisma.vacancy.findMany as ReturnType<typeof vi.fn>).mock.calls[0]![0]
    expect(calledWith.where).toMatchObject({ title: { contains: 'eng', mode: 'insensitive' } })
  })

  it('with ?stateId=2 — calls findMany with stateId filter', async () => {
    const app = buildApp()
    ;(app.prisma.vacancy.count as ReturnType<typeof vi.fn>).mockResolvedValue(0)
    ;(app.prisma.vacancy.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([])

    await app.register(publicModule, { prefix: '/api/v1/public' })
    await app.ready()

    await app.inject({ method: 'GET', url: '/api/v1/public/vacancies?stateId=2' })

    const calledWith = (app.prisma.vacancy.findMany as ReturnType<typeof vi.fn>).mock.calls[0]![0]
    expect(calledWith.where).toMatchObject({ stateId: 2 })
  })

  it('always filters to status=ACTIVE and isActive=true', async () => {
    const app = buildApp()
    ;(app.prisma.vacancy.count as ReturnType<typeof vi.fn>).mockResolvedValue(0)
    ;(app.prisma.vacancy.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([])

    await app.register(publicModule, { prefix: '/api/v1/public' })
    await app.ready()

    await app.inject({ method: 'GET', url: '/api/v1/public/vacancies' })

    const calledWith = (app.prisma.vacancy.findMany as ReturnType<typeof vi.fn>).mock.calls[0]![0]
    expect(calledWith.where).toMatchObject({ status: 'ACTIVE', isActive: true })
  })
})

// ── Public vacancy detail ─────────────────────────────────────────────────────

describe('GET /api/v1/public/vacancies/:id', () => {
  it('active vacancy → 200 with description and companyName, without applicationForm', async () => {
    const app = buildApp()
    ;(app.prisma.vacancy.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(makeVacancyRow())

    await app.register(publicModule, { prefix: '/api/v1/public' })
    await app.ready()

    const res = await app.inject({ method: 'GET', url: `/api/v1/public/vacancies/${VACANCY_ID}` })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.id).toBe(VACANCY_ID)
    expect(body.description).toBe('Full description of the role.')
    expect(body.companyName).toBe('Acme Corp')
    expect(body).not.toHaveProperty('applicationForm')
  })

  it('non-existent vacancy → 404', async () => {
    const app = buildApp()
    ;(app.prisma.vacancy.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null)

    await app.register(publicModule, { prefix: '/api/v1/public' })
    await app.ready()

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/public/vacancies/00000000-0000-4000-8000-000000000099',
    })

    expect(res.statusCode).toBe(404)
  })
})

// ── Public program cycles list ────────────────────────────────────────────────

describe('GET /api/v1/public/programs/cycles', () => {
  it('returns 200 with paginated list of OPEN cycles', async () => {
    const app = buildApp()
    ;(app.prisma.programCycle.count as ReturnType<typeof vi.fn>).mockResolvedValue(1)
    ;(app.prisma.programCycle.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([makeCycleRow()])

    await app.register(publicModule, { prefix: '/api/v1/public' })
    await app.ready()

    const res = await app.inject({ method: 'GET', url: '/api/v1/public/programs/cycles' })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.data).toHaveLength(1)
    expect(body.pagination).toMatchObject({ hasMore: false, total: 1, nextCursor: null })

    const item = body.data[0]
    expect(item.id).toBe(CYCLE_ID)
    expect(item.name).toBe('Summer 2024')
    expect(item.status).toBe('OPEN')
    expect(item.openAt).toBeDefined()
    expect(item.closeAt).toBeDefined()
  })

  it('always filters to status=OPEN', async () => {
    const app = buildApp()
    ;(app.prisma.programCycle.count as ReturnType<typeof vi.fn>).mockResolvedValue(0)
    ;(app.prisma.programCycle.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([])

    await app.register(publicModule, { prefix: '/api/v1/public' })
    await app.ready()

    await app.inject({ method: 'GET', url: '/api/v1/public/programs/cycles' })

    const calledWith = (app.prisma.programCycle.findMany as ReturnType<typeof vi.fn>).mock.calls[0]![0]
    expect(calledWith.where).toMatchObject({ status: 'OPEN' })
  })
})

// ── Public program cycle detail ───────────────────────────────────────────────

describe('GET /api/v1/public/programs/cycles/:id', () => {
  it('OPEN cycle → 200 with full fields', async () => {
    const app = buildApp()
    ;(app.prisma.programCycle.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(makeCycleRow())

    await app.register(publicModule, { prefix: '/api/v1/public' })
    await app.ready()

    const res = await app.inject({ method: 'GET', url: `/api/v1/public/programs/cycles/${CYCLE_ID}` })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.id).toBe(CYCLE_ID)
    expect(body.name).toBe('Summer 2024')
    expect(body.description).toBe('Summer vacation jobs cycle.')
    expect(body.status).toBe('OPEN')
  })

  it('non-existent or non-OPEN cycle → 404', async () => {
    const app = buildApp()
    ;(app.prisma.programCycle.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null)

    await app.register(publicModule, { prefix: '/api/v1/public' })
    await app.ready()

    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/public/programs/cycles/00000000-0000-4000-8000-000000000099`,
    })

    expect(res.statusCode).toBe(404)
  })
})
