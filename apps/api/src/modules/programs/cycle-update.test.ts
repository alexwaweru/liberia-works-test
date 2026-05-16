import { describe, it, expect, vi } from 'vitest'

// Stub env before any module under test loads it — prevents process.exit(1)
vi.mock('../../config/env.js', () => ({
  env: {
    NODE_ENV: 'test',
    REDIS_URL: 'redis://localhost:6379',
    JWT_SECRET: 'test-secret-at-least-32-chars-long!!',
    JWT_ACCESS_EXPIRES_IN: '15m',
    JWT_REFRESH_EXPIRES_IN: '30d',
  },
}))

import Fastify from 'fastify'
import cookie from '@fastify/cookie'
import jwt from '@fastify/jwt'
import sensible from '@fastify/sensible'
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod'
import type { PrismaClient } from '@prisma/client'
import programsModule from './index.js'

const JWT_SECRET = 'test-secret-at-least-32-chars-long!!'
const MOL_USER_ID = 'a1000000-0000-4000-8000-000000000001'
const INDIVIDUAL_USER_ID = 'c0000000-0000-4000-8000-000000000001'
const EMPLOYER_USER_ID = 'f0000000-0000-4000-8000-000000000002'
const CYCLE_ID = 'b0000000-0000-4000-8000-000000000001'
const NONEXISTENT_CYCLE_ID = '00000000-0000-4000-8000-000000000099'

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
    individual: { findUnique: vi.fn() },
    employer: { findUnique: vi.fn() },
    employerUser: { findFirst: vi.fn() },
    programOptIn: { findFirst: vi.fn(), create: vi.fn(), findMany: vi.fn(), count: vi.fn() },
    programCycle: { findMany: vi.fn(), count: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
    programHostingCapacity: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      deleteMany: vi.fn(),
      upsert: vi.fn(),
      update: vi.fn(),
    },
    sector: { findMany: vi.fn() },
    state: { findMany: vi.fn(), findFirst: vi.fn() },
    educationLevel: { findUnique: vi.fn() },
    $transaction: vi.fn(),
  } as unknown as PrismaClient)
  return app
}

function signMolToken(app: ReturnType<typeof buildApp>, role: 'MOL_OFFICER' | 'MOL_DIRECTOR' = 'MOL_OFFICER') {
  return app.jwt.sign({ sub: MOL_USER_ID, role, sessionId: 'session-mol-001' })
}

function signIndividualToken(app: ReturnType<typeof buildApp>) {
  return app.jwt.sign({ sub: INDIVIDUAL_USER_ID, role: 'INDIVIDUAL', sessionId: 'session-ind-001' })
}

function signEmployerToken(app: ReturnType<typeof buildApp>) {
  return app.jwt.sign({ sub: EMPLOYER_USER_ID, role: 'EMPLOYER_ADMIN', sessionId: 'session-emp-001' })
}

const mockCycle = {
  id: CYCLE_ID,
  type: 'VACATION_JOB',
  name: 'Vacation Job Programme Quarter 1 2024',
  description: '<p>Old description</p>',
  year: 2024,
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-06-30'),
  status: 'OPEN',
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-01T00:00:00.000Z'),
}

describe('PATCH /api/v1/programs/cycles/:id', () => {
  it('MoL officer updates description → 200 with updated cycle', async () => {
    const app = buildApp()
    const newDescription = '<h2><strong>About the programme</strong></h2><p>New rich text.</p>'
    const updatedCycle = { ...mockCycle, description: newDescription, updatedAt: new Date('2024-06-01T00:00:00.000Z') }

    ;(app.prisma.programCycle.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockCycle)
    ;(app.prisma.programCycle.update as ReturnType<typeof vi.fn>).mockResolvedValue(updatedCycle)

    await app.register(programsModule, { prefix: '/api/v1/programs' })
    await app.ready()
    const token = signMolToken(app)

    const res = await app.inject({
      method: 'PATCH',
      url: `/api/v1/programs/cycles/${CYCLE_ID}`,
      headers: { authorization: `Bearer ${token}` },
      payload: { description: newDescription },
    })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.id).toBe(CYCLE_ID)
    expect(body.description).toBe(newDescription)
    expect(app.prisma.programCycle.update).toHaveBeenCalledWith({
      where: { id: CYCLE_ID },
      data: { description: newDescription },
    })
  })

  it('MOL_DIRECTOR role also succeeds → 200', async () => {
    const app = buildApp()
    const updatedCycle = { ...mockCycle, description: '<p>Updated</p>' }

    ;(app.prisma.programCycle.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockCycle)
    ;(app.prisma.programCycle.update as ReturnType<typeof vi.fn>).mockResolvedValue(updatedCycle)

    await app.register(programsModule, { prefix: '/api/v1/programs' })
    await app.ready()
    const token = signMolToken(app, 'MOL_DIRECTOR')

    const res = await app.inject({
      method: 'PATCH',
      url: `/api/v1/programs/cycles/${CYCLE_ID}`,
      headers: { authorization: `Bearer ${token}` },
      payload: { description: '<p>Updated</p>' },
    })

    expect(res.statusCode).toBe(200)
  })

  it('INDIVIDUAL token → 403', async () => {
    const app = buildApp()
    await app.register(programsModule, { prefix: '/api/v1/programs' })
    await app.ready()
    const token = signIndividualToken(app)

    const res = await app.inject({
      method: 'PATCH',
      url: `/api/v1/programs/cycles/${CYCLE_ID}`,
      headers: { authorization: `Bearer ${token}` },
      payload: { description: '<p>Should not work</p>' },
    })

    expect(res.statusCode).toBe(403)
  })

  it('EMPLOYER_ADMIN token → 403', async () => {
    const app = buildApp()
    await app.register(programsModule, { prefix: '/api/v1/programs' })
    await app.ready()
    const token = signEmployerToken(app)

    const res = await app.inject({
      method: 'PATCH',
      url: `/api/v1/programs/cycles/${CYCLE_ID}`,
      headers: { authorization: `Bearer ${token}` },
      payload: { description: '<p>Should not work</p>' },
    })

    expect(res.statusCode).toBe(403)
  })

  it('nonexistent cycle id → 404', async () => {
    const app = buildApp()
    ;(app.prisma.programCycle.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null)

    await app.register(programsModule, { prefix: '/api/v1/programs' })
    await app.ready()
    const token = signMolToken(app)

    const res = await app.inject({
      method: 'PATCH',
      url: `/api/v1/programs/cycles/${NONEXISTENT_CYCLE_ID}`,
      headers: { authorization: `Bearer ${token}` },
      payload: { description: '<p>Nope</p>' },
    })

    expect(res.statusCode).toBe(404)
  })

  it('description is not a string → 400', async () => {
    const app = buildApp()
    await app.register(programsModule, { prefix: '/api/v1/programs' })
    await app.ready()
    const token = signMolToken(app)

    const res = await app.inject({
      method: 'PATCH',
      url: `/api/v1/programs/cycles/${CYCLE_ID}`,
      headers: { authorization: `Bearer ${token}` },
      payload: { description: 12345 },
    })

    expect(res.statusCode).toBe(400)
  })
})
