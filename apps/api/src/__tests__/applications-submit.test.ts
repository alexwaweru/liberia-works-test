import { describe, it, expect, vi } from 'vitest'
import Fastify from 'fastify'
import cookie from '@fastify/cookie'
import jwt from '@fastify/jwt'
import sensible from '@fastify/sensible'
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod'
import type { PrismaClient } from '@prisma/client'
import vacanciesModule from '../modules/vacancies/index.js'

const JWT_SECRET = 'test-secret-at-least-32-chars-long!!'
const INDIVIDUAL_USER_ID = 'c0000000-0000-4000-8000-000000000001'
const INDIVIDUAL_ID = 'd0000000-0000-4000-8000-000000000001'
const VACANCY_ID = 'e0000000-0000-4000-8000-000000000001'
const EMPLOYER_USER_ID = 'f0000000-0000-4000-8000-000000000001'
const EMPLOYER_ID = 'a0000000-0000-0000-0000-000000000001'

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
  return app.jwt.sign({ sub: INDIVIDUAL_USER_ID, role: 'INDIVIDUAL', sessionId: 'session-ind-001' })
}

function signEmployerToken(app: ReturnType<typeof buildApp>) {
  return app.jwt.sign({ sub: EMPLOYER_USER_ID, role: 'EMPLOYER_ADMIN', sessionId: 'session-emp-001' })
}

describe('POST /api/v1/vacancies/:vacancyId/applications', () => {
  it('with INDIVIDUAL token → 201 with { message: "Application submitted" }', async () => {
    const app = buildApp()
    ;(app.prisma.individual.findUniqueOrThrow as ReturnType<typeof vi.fn>).mockResolvedValue({ id: INDIVIDUAL_ID })
    ;(app.prisma.application.findFirst as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null) // no duplicate
    ;(app.prisma.vacancy.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: VACANCY_ID, status: 'ACTIVE', isActive: true })
    ;(app.prisma.application.create as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'new-app-id' })

    await app.register(vacanciesModule, { prefix: '/api/v1/vacancies' })
    await app.ready()
    const token = signIndividualToken(app)

    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/vacancies/${VACANCY_ID}/applications`,
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      payload: JSON.stringify({ responses: { q1: 'answer1' } }),
    })

    expect(res.statusCode).toBe(201)
    expect(res.json()).toEqual({ message: 'Application submitted' })
  })

  it('with same vacancyId twice → 409 conflict', async () => {
    const app = buildApp()
    ;(app.prisma.individual.findUniqueOrThrow as ReturnType<typeof vi.fn>).mockResolvedValue({ id: INDIVIDUAL_ID })
    ;(app.prisma.application.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'existing-app-id' }) // duplicate found

    await app.register(vacanciesModule, { prefix: '/api/v1/vacancies' })
    await app.ready()
    const token = signIndividualToken(app)

    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/vacancies/${VACANCY_ID}/applications`,
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      payload: JSON.stringify({}),
    })

    expect(res.statusCode).toBe(409)
  })

  it('with EMPLOYER token → 403 forbidden', async () => {
    const app = buildApp()
    await app.register(vacanciesModule, { prefix: '/api/v1/vacancies' })
    await app.ready()
    const token = signEmployerToken(app)

    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/vacancies/${VACANCY_ID}/applications`,
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      payload: JSON.stringify({}),
    })

    expect(res.statusCode).toBe(403)
  })
})
