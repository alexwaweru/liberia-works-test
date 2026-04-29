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

// Generate UUID-shaped IDs deterministically
function makeId(n: number): string {
  const hex = n.toString(16).padStart(8, '0')
  return `${hex}-0000-4000-8000-000000000000`
}

const makeVacancy = (n: number) => ({
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
  deadline: new Date('2030-01-01'),
  isMandatoryAdvertised: false,
  status: 'DRAFT',
  applicationForm: null,
  postedAt: null,
  isActive: true,
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-01T00:00:00.000Z'),
  _count: { applications: 0 },
})

// Build 21 vacancy items (extra one to trigger hasMore on first-page test)
const TWENTY_ONE_ITEMS = Array.from({ length: 21 }, (_, i) => makeVacancy(i + 1))

// Build 7 vacancy items for last-page test
const SEVEN_ITEMS = Array.from({ length: 7 }, (_, i) => makeVacancy(i + 100))

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

describe('GET /api/v1/vacancies — pagination', () => {
  it('first page (no cursor): returns 20 items, hasMore true, nextCursor set, total 47', async () => {
    const app = buildApp()
    ;(app.prisma.employerUser.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ employerId: EMPLOYER_ID })
    ;(app.prisma.vacancy.count as ReturnType<typeof vi.fn>).mockResolvedValue(47)
    ;(app.prisma.vacancy.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(TWENTY_ONE_ITEMS)

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
    expect(body.data).toHaveLength(20)
    expect(body.pagination.hasMore).toBe(true)
    expect(body.pagination.nextCursor).toBe(TWENTY_ONE_ITEMS[19]!.id)
    expect(body.pagination.total).toBe(47)
  })

  it('last page: returns fewer than 20 items, hasMore false, nextCursor null, total 47', async () => {
    const app = buildApp()
    ;(app.prisma.employerUser.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ employerId: EMPLOYER_ID })
    ;(app.prisma.vacancy.count as ReturnType<typeof vi.fn>).mockResolvedValue(47)
    ;(app.prisma.vacancy.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(SEVEN_ITEMS)

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
    expect(body.data).toHaveLength(7)
    expect(body.pagination.hasMore).toBe(false)
    expect(body.pagination.nextCursor).toBeNull()
    expect(body.pagination.total).toBe(47)
  })

  it('with cursor param: calls findMany with cursor and skip:1', async () => {
    const CURSOR_ID = 'v-020'
    const app = buildApp()
    ;(app.prisma.employerUser.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ employerId: EMPLOYER_ID })
    ;(app.prisma.vacancy.count as ReturnType<typeof vi.fn>).mockResolvedValue(47)
    ;(app.prisma.vacancy.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(SEVEN_ITEMS)

    await app.register(vacanciesModule, { prefix: '/api/v1/vacancies' })
    await app.ready()
    const token = signEmployerToken(app)

    await app.inject({
      method: 'GET',
      url: `/api/v1/vacancies?cursor=${CURSOR_ID}`,
      headers: { authorization: `Bearer ${token}` },
    })

    const calledWith = (app.prisma.vacancy.findMany as ReturnType<typeof vi.fn>).mock.calls[0]![0]
    expect(calledWith.cursor).toEqual({ id: CURSOR_ID })
    expect(calledWith.skip).toBe(1)
  })
})
