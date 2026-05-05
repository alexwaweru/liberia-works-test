import { describe, it, expect, vi } from 'vitest'
import Fastify from 'fastify'
import cookie from '@fastify/cookie'
import jwt from '@fastify/jwt'
import sensible from '@fastify/sensible'
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod'
import type { PrismaClient } from '@prisma/client'
import vacanciesModule from '../modules/vacancies/index.js'

const JWT_SECRET = 'test-secret-at-least-32-chars-long!!'
const VACANCY_ID = 'a1000000-0000-4000-8000-000000000001'

const makeActiveVacancy = (overrides: Record<string, unknown> = {}) => ({
  id: VACANCY_ID,
  employerId: 'b0000000-0000-4000-8000-000000000001',
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
  ...overrides,
})

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
    individual: { findUniqueOrThrow: vi.fn() },
    application: {
      findFirst: vi.fn(),
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
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

function signIndividualToken(app: ReturnType<typeof buildApp>) {
  return app.jwt.sign({ sub: 'user-individual-1', role: 'INDIVIDUAL', sessionId: 'session-ind-001' })
}

describe('GET /api/v1/vacancies/browse/:id', () => {
  it('with INDIVIDUAL token → 200 with title, description, applicationForm, companyName', async () => {
    const app = buildApp()
    ;(app.prisma.vacancy.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(makeActiveVacancy())

    await app.register(vacanciesModule, { prefix: '/api/v1/vacancies' })
    await app.ready()
    const token = signIndividualToken(app)

    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/vacancies/browse/${VACANCY_ID}`,
      headers: { authorization: `Bearer ${token}` },
    })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.title).toBe('Software Engineer')
    expect(body.description).toBe('Full description of the role.')
    expect(body.companyName).toBe('Acme Corp')
    expect(body).toHaveProperty('applicationForm')
    expect(body).toHaveProperty('id', VACANCY_ID)
  })

  it('for non-existent vacancy → 404', async () => {
    const app = buildApp()
    ;(app.prisma.vacancy.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null)

    await app.register(vacanciesModule, { prefix: '/api/v1/vacancies' })
    await app.ready()
    const token = signIndividualToken(app)

    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/vacancies/browse/00000000-0000-4000-8000-000000000099`,
      headers: { authorization: `Bearer ${token}` },
    })

    expect(res.statusCode).toBe(404)
  })
})
