import { describe, it, expect, vi } from 'vitest'
import Fastify from 'fastify'
import cookie from '@fastify/cookie'
import jwt from '@fastify/jwt'
import sensible from '@fastify/sensible'
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod'
import type { PrismaClient } from '@prisma/client'
import vacanciesModule from '../modules/vacancies/index.js'

const JWT_SECRET = 'test-secret-at-least-32-chars-long!!'
const EMPLOYER_ID = 'a0000000-0000-0000-0000-000000000001'

function makeId(n: number): string {
  const hex = n.toString(16).padStart(8, '0')
  return `${hex}-0000-4000-8000-000000000000`
}

const makeVacancy = (n: number, overrides: Record<string, unknown> = {}) => ({
  id: makeId(n),
  employerId: EMPLOYER_ID,
  title: `Vacancy ${n}`,
  description: 'A description long enough',
  vacancyType: 'PERMANENT',
  stateId: 1,
  sectorId: null,
  occupationId: null,
  minimumEducationLevelId: null,
  slotsAvailable: 1,
  deadline: new Date('2030-06-01'),
  isMandatoryAdvertised: false,
  status: 'DRAFT',
  applicationForm: null,
  postedAt: null,
  isActive: true,
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-01T00:00:00.000Z'),
  _count: { applications: 3 },
  ...overrides,
})

const FIVE_ITEMS = Array.from({ length: 5 }, (_, i) => makeVacancy(i + 1))

function buildApp() {
  const app = Fastify({ logger: false })
  app.setValidatorCompiler(validatorCompiler)
  app.setSerializerCompiler(serializerCompiler)
  app.register(cookie, { secret: JWT_SECRET })
  app.register(jwt, {
    secret: JWT_SECRET,
    cookie: { cookieName: 'access_token', signed: false },
    sign: { expiresIn: '15m' },
  })
  app.register(sensible)
  app.decorate('prisma', {
    employerUser: { findFirst: vi.fn() },
    vacancy: {
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  } as unknown as PrismaClient)
  return app
}

function signEmployerToken(app: ReturnType<typeof buildApp>) {
  return app.jwt.sign({ sub: 'user-employer-1', role: 'EMPLOYER_ADMIN', sessionId: 'session-001' })
}

describe('GET /api/v1/vacancies — list with filters and applicationsCount', () => {
  it('with ?status=DRAFT — calls findMany with where including status: DRAFT', async () => {
    const app = buildApp()
    ;(app.prisma.employerUser.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ employerId: EMPLOYER_ID })
    ;(app.prisma.vacancy.count as ReturnType<typeof vi.fn>).mockResolvedValue(3)
    ;(app.prisma.vacancy.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(
      Array.from({ length: 3 }, (_, i) => makeVacancy(i + 1, { status: 'DRAFT' }))
    )

    await app.register(vacanciesModule, { prefix: '/api/v1/vacancies' })
    await app.ready()
    const token = signEmployerToken(app)

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/vacancies?status=DRAFT',
      headers: { authorization: `Bearer ${token}` },
    })

    expect(res.statusCode).toBe(200)
    const calledWith = (app.prisma.vacancy.findMany as ReturnType<typeof vi.fn>).mock.calls[0]![0]
    expect(calledWith.where).toMatchObject({ status: 'DRAFT' })
  })

  it('with ?sortBy=deadline&sortDir=asc — calls findMany with orderBy containing { deadline: "asc" }', async () => {
    const app = buildApp()
    ;(app.prisma.employerUser.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ employerId: EMPLOYER_ID })
    ;(app.prisma.vacancy.count as ReturnType<typeof vi.fn>).mockResolvedValue(5)
    ;(app.prisma.vacancy.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(FIVE_ITEMS)

    await app.register(vacanciesModule, { prefix: '/api/v1/vacancies' })
    await app.ready()
    const token = signEmployerToken(app)

    await app.inject({
      method: 'GET',
      url: '/api/v1/vacancies?sortBy=deadline&sortDir=asc',
      headers: { authorization: `Bearer ${token}` },
    })

    const calledWith = (app.prisma.vacancy.findMany as ReturnType<typeof vi.fn>).mock.calls[0]![0]
    expect(calledWith.orderBy).toEqual(
      expect.arrayContaining([{ deadline: 'asc' }])
    )
  })

  it('response includes applicationsCount on each item', async () => {
    const app = buildApp()
    ;(app.prisma.employerUser.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ employerId: EMPLOYER_ID })
    ;(app.prisma.vacancy.count as ReturnType<typeof vi.fn>).mockResolvedValue(5)
    ;(app.prisma.vacancy.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(
      FIVE_ITEMS.map(v => ({ ...v, _count: { applications: 7 } }))
    )

    await app.register(vacanciesModule, { prefix: '/api/v1/vacancies' })
    await app.ready()
    const token = signEmployerToken(app)

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/vacancies',
      headers: { authorization: `Bearer ${token}` },
    })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.data).toHaveLength(5)
    for (const item of body.data) {
      expect(item).toHaveProperty('applicationsCount', 7)
    }
  })
})
