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

vi.mock('bullmq', () => ({
  Queue: vi.fn().mockImplementation(() => ({
    add: vi.fn().mockResolvedValue(undefined),
  })),
}))

import Fastify from 'fastify'
import cookie from '@fastify/cookie'
import jwt from '@fastify/jwt'
import sensible from '@fastify/sensible'
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod'
import type { PrismaClient } from '@prisma/client'
import programsModule from './index.js'

const JWT_SECRET = 'test-secret-at-least-32-chars-long!!'
const EMPLOYER_USER_ID = 'f0000000-0000-4000-8000-000000000002'
const EMPLOYER_ID = 'a0000000-0000-4000-8000-000000000001'
const CYCLE_ID = 'b0000000-0000-4000-8000-000000000001'
const INDIVIDUAL_USER_ID = 'c0000000-0000-4000-8000-000000000001'

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
    programCycle: { findMany: vi.fn(), count: vi.fn(), findUnique: vi.fn() },
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
    sector: { findMany: vi.fn(), findUnique: vi.fn() },
    state: { findMany: vi.fn(), findFirst: vi.fn() },
    educationLevel: { findUnique: vi.fn() },
    $transaction: vi.fn(),
  } as unknown as PrismaClient)
  return app
}

function signEmployerToken(app: ReturnType<typeof buildApp>) {
  return app.jwt.sign({ sub: EMPLOYER_USER_ID, role: 'EMPLOYER_ADMIN', sessionId: 'session-emp-001' })
}

function signIndividualToken(app: ReturnType<typeof buildApp>) {
  return app.jwt.sign({ sub: INDIVIDUAL_USER_ID, role: 'INDIVIDUAL', sessionId: 'session-ind-001' })
}

// Shared mock rows for multi-county tests
const mockCapacityRowA = {
  id: 'cap-001',
  employerId: EMPLOYER_ID,
  cycleId: CYCLE_ID,
  slotsOffered: 5,
  stateId: 1,
  contactName: 'Jane Doe',
  contactPhone: '+231770000001',
  preferredSectors: [],
  preferredEducationLevelId: null,
  placementInstructions: null,
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-01T00:00:00.000Z'),
  cycle: { id: CYCLE_ID, name: 'Cycle 2024', year: 2024, status: 'OPEN' },
  state: { id: 1, name: 'Montserrado', stateCode: 'MO' },
}

const mockCapacityRowB = {
  id: 'cap-002',
  employerId: EMPLOYER_ID,
  cycleId: CYCLE_ID,
  slotsOffered: 3,
  stateId: 2,
  contactName: 'Jane Doe',
  contactPhone: '+231770000001',
  preferredSectors: [],
  preferredEducationLevelId: null,
  placementInstructions: null,
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-01T00:00:00.000Z'),
  cycle: { id: CYCLE_ID, name: 'Cycle 2024', year: 2024, status: 'OPEN' },
  state: { id: 2, name: 'Margibi', stateCode: 'MG' },
}

const mockOpenCycle = {
  id: CYCLE_ID,
  name: 'Cycle 2024',
  year: 2024,
  status: 'OPEN',
}

const mockClosedCycle = {
  id: CYCLE_ID,
  name: 'Cycle 2024',
  year: 2024,
  status: 'PLANNED',
}

// Helper: sets up $transaction to run the callback with the app.prisma mock
function setupTransaction(app: ReturnType<typeof buildApp>) {
  ;(app.prisma.$transaction as ReturnType<typeof vi.fn>).mockImplementation(
    async (fn: (tx: unknown) => Promise<unknown>) => fn(app.prisma)
  )
}

describe('POST /api/v1/programs/hosting-capacity', () => {
  it('creates capacity for two counties → 201 with grouped response', async () => {
    const app = buildApp()
    ;(app.prisma.employerUser.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ employerId: EMPLOYER_ID })
    ;(app.prisma.programCycle.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockOpenCycle)
    ;(app.prisma.state.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 1, name: 'Montserrado', stateCode: 'MO' },
      { id: 2, name: 'Margibi', stateCode: 'MG' },
    ])
    ;(app.prisma.sector.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 'sector-001' },
    ])
    setupTransaction(app)
    ;(app.prisma.programHostingCapacity.deleteMany as ReturnType<typeof vi.fn>).mockResolvedValue({ count: 0 })
    ;(app.prisma.programHostingCapacity.upsert as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(mockCapacityRowA)
      .mockResolvedValueOnce(mockCapacityRowB)
    ;(app.prisma.programHostingCapacity.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      mockCapacityRowA,
      mockCapacityRowB,
    ])

    await app.register(programsModule, { prefix: '/api/v1/programs' })
    await app.ready()
    const token = signEmployerToken(app)

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/programs/hosting-capacity',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        cycleId: CYCLE_ID,
        contactName: 'Jane Doe',
        contactPhone: '+231770000001',
        preferredSectors: ['sector-001'],
        capacities: [
          { stateId: 1, slotsOffered: 5 },
          { stateId: 2, slotsOffered: 3 },
        ],
      },
    })

    expect(res.statusCode).toBe(201)
    const body = res.json()
    expect(body.cycleId).toBe(CYCLE_ID)
    expect(body.capacities).toHaveLength(2)
    expect(body.totalSlots).toBe(8)
    expect(body.contactName).toBe('Jane Doe')
  })

  it('second POST with one county replaces two → only 1 row remains in response', async () => {
    const app = buildApp()
    ;(app.prisma.employerUser.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ employerId: EMPLOYER_ID })
    ;(app.prisma.programCycle.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockOpenCycle)
    ;(app.prisma.state.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 1, name: 'Montserrado', stateCode: 'MO' },
    ])
    ;(app.prisma.sector.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 'sector-001' },
    ])
    setupTransaction(app)
    ;(app.prisma.programHostingCapacity.deleteMany as ReturnType<typeof vi.fn>).mockResolvedValue({ count: 1 })
    ;(app.prisma.programHostingCapacity.upsert as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...mockCapacityRowA,
      slotsOffered: 10,
    })
    ;(app.prisma.programHostingCapacity.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { ...mockCapacityRowA, slotsOffered: 10 },
    ])

    await app.register(programsModule, { prefix: '/api/v1/programs' })
    await app.ready()
    const token = signEmployerToken(app)

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/programs/hosting-capacity',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        cycleId: CYCLE_ID,
        contactName: 'Jane Doe',
        contactPhone: '+231770000001',
        preferredSectors: ['sector-001'],
        capacities: [{ stateId: 1, slotsOffered: 10 }],
      },
    })

    expect(res.statusCode).toBe(201)
    const body = res.json()
    expect(body.capacities).toHaveLength(1)
    expect(body.capacities[0].slotsOffered).toBe(10)
    expect(body.totalSlots).toBe(10)
    // deleteMany must have been called to remove stateId 2
    expect(app.prisma.programHostingCapacity.deleteMany).toHaveBeenCalled()
  })

  it('duplicate stateId in payload returns 400', async () => {
    const app = buildApp()
    ;(app.prisma.employerUser.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ employerId: EMPLOYER_ID })
    ;(app.prisma.programCycle.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockOpenCycle)

    await app.register(programsModule, { prefix: '/api/v1/programs' })
    await app.ready()
    const token = signEmployerToken(app)

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/programs/hosting-capacity',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        cycleId: CYCLE_ID,
        contactName: 'Jane Doe',
        contactPhone: '+231770000001',
        preferredSectors: ['sector-001'],
        capacities: [
          { stateId: 1, slotsOffered: 5 },
          { stateId: 1, slotsOffered: 3 },
        ],
      },
    })

    expect(res.statusCode).toBe(400)
  })

  it('slotsOffered < 1 returns 400 (schema validation)', async () => {
    const app = buildApp()
    ;(app.prisma.employerUser.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ employerId: EMPLOYER_ID })

    await app.register(programsModule, { prefix: '/api/v1/programs' })
    await app.ready()
    const token = signEmployerToken(app)

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/programs/hosting-capacity',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        cycleId: CYCLE_ID,
        contactName: 'Jane Doe',
        contactPhone: '+231770000001',
        preferredSectors: ['sector-001'],
        capacities: [{ stateId: 1, slotsOffered: 0 }],
      },
    })

    expect(res.statusCode).toBe(400)
  })

  it('stateId not in Liberia returns 400', async () => {
    const app = buildApp()
    ;(app.prisma.employerUser.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ employerId: EMPLOYER_ID })
    ;(app.prisma.programCycle.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockOpenCycle)
    // Return empty array — none of the stateIds exist with countryCode=LR
    ;(app.prisma.state.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([])

    await app.register(programsModule, { prefix: '/api/v1/programs' })
    await app.ready()
    const token = signEmployerToken(app)

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/programs/hosting-capacity',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        cycleId: CYCLE_ID,
        contactName: 'Jane Doe',
        contactPhone: '+231770000001',
        preferredSectors: ['sector-001'],
        capacities: [{ stateId: 9999, slotsOffered: 5 }],
      },
    })

    expect(res.statusCode).toBe(400)
  })

  it('non-OPEN cycle returns 400', async () => {
    const app = buildApp()
    ;(app.prisma.employerUser.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ employerId: EMPLOYER_ID })
    ;(app.prisma.programCycle.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockClosedCycle)

    await app.register(programsModule, { prefix: '/api/v1/programs' })
    await app.ready()
    const token = signEmployerToken(app)

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/programs/hosting-capacity',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        cycleId: CYCLE_ID,
        contactName: 'Jane Doe',
        contactPhone: '+231770000001',
        preferredSectors: ['sector-001'],
        capacities: [{ stateId: 1, slotsOffered: 5 }],
      },
    })

    expect(res.statusCode).toBe(400)
  })

  it('unknown employer returns 404', async () => {
    const app = buildApp()
    ;(app.prisma.employerUser.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null)

    await app.register(programsModule, { prefix: '/api/v1/programs' })
    await app.ready()
    const token = signEmployerToken(app)

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/programs/hosting-capacity',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        cycleId: CYCLE_ID,
        contactName: 'Jane Doe',
        contactPhone: '+231770000001',
        preferredSectors: ['sector-001'],
        capacities: [{ stateId: 1, slotsOffered: 5 }],
      },
    })

    expect(res.statusCode).toBe(404)
  })

  it('unknown preferredEducationLevelId returns 400', async () => {
    const app = buildApp()
    ;(app.prisma.employerUser.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ employerId: EMPLOYER_ID })
    ;(app.prisma.programCycle.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockOpenCycle)
    ;(app.prisma.state.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 1, name: 'Montserrado', stateCode: 'MO' },
    ])
    ;(app.prisma.sector.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 'sector-001' },
    ])
    ;(app.prisma.educationLevel.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null)

    await app.register(programsModule, { prefix: '/api/v1/programs' })
    await app.ready()
    const token = signEmployerToken(app)

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/programs/hosting-capacity',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        cycleId: CYCLE_ID,
        contactName: 'Jane Doe',
        contactPhone: '+231770000001',
        preferredSectors: ['sector-001'],
        preferredEducationLevelId: 'nonexistent-edu-level-id',
        capacities: [{ stateId: 1, slotsOffered: 5 }],
      },
    })

    expect(res.statusCode).toBe(400)
    expect(app.prisma.programHostingCapacity.upsert).not.toHaveBeenCalled()
  })

  it('unknown id in preferredSectors returns 400', async () => {
    const app = buildApp()
    ;(app.prisma.employerUser.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ employerId: EMPLOYER_ID })
    ;(app.prisma.programCycle.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockOpenCycle)
    ;(app.prisma.state.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 1, name: 'Montserrado', stateCode: 'MO' },
    ])
    // Only one of the two requested sector IDs exists
    ;(app.prisma.sector.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 'sector-001' },
    ])

    await app.register(programsModule, { prefix: '/api/v1/programs' })
    await app.ready()
    const token = signEmployerToken(app)

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/programs/hosting-capacity',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        cycleId: CYCLE_ID,
        contactName: 'Jane Doe',
        contactPhone: '+231770000001',
        preferredSectors: ['sector-001', 'nonexistent-sector-id'],
        capacities: [{ stateId: 1, slotsOffered: 5 }],
      },
    })

    expect(res.statusCode).toBe(400)
    expect(app.prisma.programHostingCapacity.upsert).not.toHaveBeenCalled()
  })

  it('empty preferredSectors array returns 400', async () => {
    const app = buildApp()
    ;(app.prisma.employerUser.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ employerId: EMPLOYER_ID })
    ;(app.prisma.programCycle.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockOpenCycle)
    ;(app.prisma.state.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 1, name: 'Montserrado', stateCode: 'MO' },
    ])

    await app.register(programsModule, { prefix: '/api/v1/programs' })
    await app.ready()
    const token = signEmployerToken(app)

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/programs/hosting-capacity',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        cycleId: CYCLE_ID,
        contactName: 'Jane Doe',
        contactPhone: '+231770000001',
        preferredSectors: [],
        capacities: [{ stateId: 1, slotsOffered: 5 }],
      },
    })

    expect(res.statusCode).toBe(400)
    expect(app.prisma.programHostingCapacity.upsert).not.toHaveBeenCalled()
  })

  it('multiple valid preferredSectors → 201 with array echoed back', async () => {
    const app = buildApp()
    ;(app.prisma.employerUser.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ employerId: EMPLOYER_ID })
    ;(app.prisma.programCycle.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockOpenCycle)
    ;(app.prisma.state.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 1, name: 'Montserrado', stateCode: 'MO' },
    ])
    ;(app.prisma.sector.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 'sector-001' },
      { id: 'sector-002' },
    ])
    setupTransaction(app)
    ;(app.prisma.programHostingCapacity.deleteMany as ReturnType<typeof vi.fn>).mockResolvedValue({ count: 0 })
    ;(app.prisma.programHostingCapacity.upsert as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...mockCapacityRowA,
      preferredSectors: ['sector-001', 'sector-002'],
    })
    ;(app.prisma.programHostingCapacity.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { ...mockCapacityRowA, preferredSectors: ['sector-001', 'sector-002'] },
    ])

    await app.register(programsModule, { prefix: '/api/v1/programs' })
    await app.ready()
    const token = signEmployerToken(app)

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/programs/hosting-capacity',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        cycleId: CYCLE_ID,
        contactName: 'Jane Doe',
        contactPhone: '+231770000001',
        preferredSectors: ['sector-001', 'sector-002'],
        capacities: [{ stateId: 1, slotsOffered: 5 }],
      },
    })

    expect(res.statusCode).toBe(201)
    const body = res.json()
    expect(body.preferredSectors).toEqual(['sector-001', 'sector-002'])
  })

  it('INDIVIDUAL token → 403', async () => {
    const app = buildApp()
    await app.register(programsModule, { prefix: '/api/v1/programs' })
    await app.ready()
    const token = signIndividualToken(app)

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/programs/hosting-capacity',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        cycleId: CYCLE_ID,
        contactName: 'Jane Doe',
        contactPhone: '+231770000001',
        preferredSectors: ['sector-001'],
        capacities: [{ stateId: 1, slotsOffered: 5 }],
      },
    })

    expect(res.statusCode).toBe(403)
  })
})

describe('GET /api/v1/programs/hosting-capacity/by-cycle/:cycleId', () => {
  it('returns grouped shape with capacities array → 200', async () => {
    const app = buildApp()
    ;(app.prisma.employerUser.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ employerId: EMPLOYER_ID })
    ;(app.prisma.programHostingCapacity.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      mockCapacityRowA,
      mockCapacityRowB,
    ])

    await app.register(programsModule, { prefix: '/api/v1/programs' })
    await app.ready()
    const token = signEmployerToken(app)

    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/programs/hosting-capacity/by-cycle/${CYCLE_ID}`,
      headers: { authorization: `Bearer ${token}` },
    })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.cycleId).toBe(CYCLE_ID)
    expect(body.capacities).toHaveLength(2)
    expect(body.totalSlots).toBe(8)
    expect(body.capacities[0]).toHaveProperty('state')
    expect(body.capacities[0].state).toHaveProperty('name')
  })

  it('returns 404 when no capacity for that cycle', async () => {
    const app = buildApp()
    ;(app.prisma.employerUser.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ employerId: EMPLOYER_ID })
    ;(app.prisma.programHostingCapacity.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([])

    await app.register(programsModule, { prefix: '/api/v1/programs' })
    await app.ready()
    const token = signEmployerToken(app)

    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/programs/hosting-capacity/by-cycle/${CYCLE_ID}`,
      headers: { authorization: `Bearer ${token}` },
    })

    expect(res.statusCode).toBe(404)
  })
})

describe('GET /api/v1/programs/my-hosting-capacity', () => {
  it('returns paginated list grouped by cycle → 200', async () => {
    const app = buildApp()
    ;(app.prisma.employerUser.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ employerId: EMPLOYER_ID })
    ;(app.prisma.programHostingCapacity.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      mockCapacityRowA,
      mockCapacityRowB,
    ])

    await app.register(programsModule, { prefix: '/api/v1/programs' })
    await app.ready()
    const token = signEmployerToken(app)

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/programs/my-hosting-capacity',
      headers: { authorization: `Bearer ${token}` },
    })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    // Both rows belong to the same cycle — should be grouped into 1 item
    expect(body.data).toHaveLength(1)
    expect(body.data[0].cycleId).toBe(CYCLE_ID)
    expect(body.data[0].capacities).toHaveLength(2)
    expect(body.data[0].totalSlots).toBe(8)
    expect(body.pagination.total).toBe(1)
    expect(body.pagination.hasMore).toBe(false)
    expect(body.pagination.nextCursor).toBeNull()
  })
})
