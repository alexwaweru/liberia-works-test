import { describe, it, expect, vi } from 'vitest'

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
    programCycle: {
      findMany: vi.fn(),
      count: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
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
    programPlacement: { count: vi.fn() },
    sector: { findMany: vi.fn() },
    state: { findMany: vi.fn(), findFirst: vi.fn() },
    educationLevel: { findUnique: vi.fn() },
    $transaction: vi.fn(),
  } as unknown as PrismaClient)
  // stub audit so routes that call it don't explode
  app.decorate('audit', { record: vi.fn().mockResolvedValue(undefined) })
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
  name: 'Vacation Job Q1 2025',
  description: null,
  year: 2025,
  startDate: new Date('2025-01-01'),
  endDate: new Date('2025-06-30'),
  status: 'PLANNED',
  createdAt: new Date('2025-01-01T00:00:00.000Z'),
  updatedAt: new Date('2025-01-01T00:00:00.000Z'),
}

// ── POST /cycles ──────────────────────────────────────────────────────────────

describe('POST /api/v1/programs/cycles', () => {
  it('MOL_OFFICER creates a cycle → 201 with cycle payload', async () => {
    const app = buildApp()
    ;(app.prisma.programCycle.create as ReturnType<typeof vi.fn>).mockResolvedValue(mockCycle)

    await app.register(programsModule, { prefix: '/api/v1/programs' })
    await app.ready()
    const token = signMolToken(app)

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/programs/cycles',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        name: 'Vacation Job Q1 2025',
        year: 2025,
        startDate: '2025-01-01',
        endDate: '2025-06-30',
      },
    })

    expect(res.statusCode).toBe(201)
    const body = res.json()
    expect(body.id).toBe(CYCLE_ID)
    expect(body.name).toBe('Vacation Job Q1 2025')
    expect(body.status).toBe('PLANNED')
  })

  it('endDate <= startDate → 400', async () => {
    const app = buildApp()
    await app.register(programsModule, { prefix: '/api/v1/programs' })
    await app.ready()
    const token = signMolToken(app)

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/programs/cycles',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        name: 'Bad Dates',
        year: 2025,
        startDate: '2025-06-30',
        endDate: '2025-01-01',
      },
    })

    expect(res.statusCode).toBe(400)
  })

  it('endDate === startDate → 400', async () => {
    const app = buildApp()
    await app.register(programsModule, { prefix: '/api/v1/programs' })
    await app.ready()
    const token = signMolToken(app)

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/programs/cycles',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        name: 'Same Day',
        year: 2025,
        startDate: '2025-03-01',
        endDate: '2025-03-01',
      },
    })

    expect(res.statusCode).toBe(400)
  })

  it('INDIVIDUAL token → 403', async () => {
    const app = buildApp()
    await app.register(programsModule, { prefix: '/api/v1/programs' })
    await app.ready()
    const token = signIndividualToken(app)

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/programs/cycles',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        name: 'Forbidden',
        year: 2025,
        startDate: '2025-01-01',
        endDate: '2025-06-30',
      },
    })

    expect(res.statusCode).toBe(403)
  })
})

// ── PATCH /cycles/:id (expanded fields) ───────────────────────────────────────

describe('PATCH /api/v1/programs/cycles/:id (expanded fields)', () => {
  it('update name + year + status simultaneously → 200', async () => {
    const app = buildApp()
    const updated = { ...mockCycle, name: 'New Name', year: 2026, status: 'OPEN' }

    ;(app.prisma.programCycle.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockCycle)
    ;(app.prisma.programCycle.update as ReturnType<typeof vi.fn>).mockResolvedValue(updated)

    await app.register(programsModule, { prefix: '/api/v1/programs' })
    await app.ready()
    const token = signMolToken(app)

    const res = await app.inject({
      method: 'PATCH',
      url: `/api/v1/programs/cycles/${CYCLE_ID}`,
      headers: { authorization: `Bearer ${token}` },
      payload: { name: 'New Name', year: 2026, status: 'OPEN' },
    })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.name).toBe('New Name')
    expect(body.year).toBe(2026)
    expect(body.status).toBe('OPEN')
    // verify update was called with exactly those fields
    expect(app.prisma.programCycle.update).toHaveBeenCalledWith({
      where: { id: CYCLE_ID },
      data: { name: 'New Name', year: 2026, status: 'OPEN' },
    })
  })

  it('description-only patch still works → 200 (regression guard)', async () => {
    const app = buildApp()
    const updated = { ...mockCycle, description: '<p>hello</p>' }

    ;(app.prisma.programCycle.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockCycle)
    ;(app.prisma.programCycle.update as ReturnType<typeof vi.fn>).mockResolvedValue(updated)

    await app.register(programsModule, { prefix: '/api/v1/programs' })
    await app.ready()
    const token = signMolToken(app)

    const res = await app.inject({
      method: 'PATCH',
      url: `/api/v1/programs/cycles/${CYCLE_ID}`,
      headers: { authorization: `Bearer ${token}` },
      payload: { description: '<p>hello</p>' },
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().description).toBe('<p>hello</p>')
  })
})

// ── DELETE /cycles/:id ────────────────────────────────────────────────────────

describe('DELETE /api/v1/programs/cycles/:id', () => {
  it('cycle with no dependents → 204', async () => {
    const app = buildApp()

    ;(app.prisma.programCycle.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockCycle)
    ;(app.prisma.programOptIn.count as ReturnType<typeof vi.fn>).mockResolvedValue(0)
    ;(app.prisma.programHostingCapacity.count as ReturnType<typeof vi.fn>).mockResolvedValue(0)
    ;(app.prisma.programPlacement.count as ReturnType<typeof vi.fn>).mockResolvedValue(0)
    ;(app.prisma.programCycle.delete as ReturnType<typeof vi.fn>).mockResolvedValue(mockCycle)

    await app.register(programsModule, { prefix: '/api/v1/programs' })
    await app.ready()
    const token = signMolToken(app)

    const res = await app.inject({
      method: 'DELETE',
      url: `/api/v1/programs/cycles/${CYCLE_ID}`,
      headers: { authorization: `Bearer ${token}` },
    })

    expect(res.statusCode).toBe(204)
    expect(app.prisma.programCycle.delete).toHaveBeenCalledWith({ where: { id: CYCLE_ID } })
  })

  it('cycle with an opt-in → 409 with details', async () => {
    const app = buildApp()

    ;(app.prisma.programCycle.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockCycle)
    ;(app.prisma.programOptIn.count as ReturnType<typeof vi.fn>).mockResolvedValue(3)
    ;(app.prisma.programHostingCapacity.count as ReturnType<typeof vi.fn>).mockResolvedValue(0)
    ;(app.prisma.programPlacement.count as ReturnType<typeof vi.fn>).mockResolvedValue(0)

    await app.register(programsModule, { prefix: '/api/v1/programs' })
    await app.ready()
    const token = signMolToken(app)

    const res = await app.inject({
      method: 'DELETE',
      url: `/api/v1/programs/cycles/${CYCLE_ID}`,
      headers: { authorization: `Bearer ${token}` },
    })

    expect(res.statusCode).toBe(409)
    const body = res.json()
    expect(body.error).toBe('CONFLICT')
    expect(body.details.optIns).toBe(3)
    expect(body.details.hostingCapacities).toBe(0)
    expect(body.details.placements).toBe(0)
  })

  it('cycle with hosting capacities and placements → 409', async () => {
    const app = buildApp()

    ;(app.prisma.programCycle.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockCycle)
    ;(app.prisma.programOptIn.count as ReturnType<typeof vi.fn>).mockResolvedValue(0)
    ;(app.prisma.programHostingCapacity.count as ReturnType<typeof vi.fn>).mockResolvedValue(2)
    ;(app.prisma.programPlacement.count as ReturnType<typeof vi.fn>).mockResolvedValue(1)

    await app.register(programsModule, { prefix: '/api/v1/programs' })
    await app.ready()
    const token = signMolToken(app)

    const res = await app.inject({
      method: 'DELETE',
      url: `/api/v1/programs/cycles/${CYCLE_ID}`,
      headers: { authorization: `Bearer ${token}` },
    })

    expect(res.statusCode).toBe(409)
    const body = res.json()
    expect(body.details.hostingCapacities).toBe(2)
    expect(body.details.placements).toBe(1)
  })

  it('EMPLOYER_ADMIN token → 403', async () => {
    const app = buildApp()
    await app.register(programsModule, { prefix: '/api/v1/programs' })
    await app.ready()
    const token = signEmployerToken(app)

    const res = await app.inject({
      method: 'DELETE',
      url: `/api/v1/programs/cycles/${CYCLE_ID}`,
      headers: { authorization: `Bearer ${token}` },
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
      method: 'DELETE',
      url: `/api/v1/programs/cycles/${NONEXISTENT_CYCLE_ID}`,
      headers: { authorization: `Bearer ${token}` },
    })

    expect(res.statusCode).toBe(404)
  })
})
