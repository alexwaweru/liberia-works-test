import { describe, it, expect, vi } from 'vitest'
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
    programHostingCapacity: { findUnique: vi.fn(), findFirst: vi.fn(), create: vi.fn(), findMany: vi.fn(), count: vi.fn() },
    sector: { findMany: vi.fn() },
    state: { findMany: vi.fn(), findFirst: vi.fn() },
    educationLevel: { findUnique: vi.fn() },
  } as unknown as PrismaClient)
  return app
}

function signEmployerToken(app: ReturnType<typeof buildApp>) {
  return app.jwt.sign({ sub: EMPLOYER_USER_ID, role: 'EMPLOYER_ADMIN', sessionId: 'session-emp-001' })
}

function signIndividualToken(app: ReturnType<typeof buildApp>) {
  return app.jwt.sign({ sub: INDIVIDUAL_USER_ID, role: 'INDIVIDUAL', sessionId: 'session-ind-001' })
}

const mockCapacity = {
  id: 'cap-001',
  employerId: EMPLOYER_ID,
  cycleId: CYCLE_ID,
  slotsOffered: 5,
  stateId: 1,
  contactName: 'Jane Doe',
  contactPhone: '+231770000001',
  preferredSectorId: null,
  preferredEducationLevelId: null,
  placementInstructions: null,
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-01T00:00:00.000Z'),
  cycle: { id: CYCLE_ID, name: 'Cycle 2024', year: 2024, status: 'OPEN' },
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

describe('POST /api/v1/programs/hosting-capacity', () => {
  it('employer creates hosting capacity → 201', async () => {
    const app = buildApp()
    ;(app.prisma.employerUser.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ employerId: EMPLOYER_ID })
    ;(app.prisma.programCycle.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockOpenCycle)
    ;(app.prisma.state.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 1, name: 'Montserrado' })
    ;(app.prisma.programHostingCapacity.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null)
    ;(app.prisma.programHostingCapacity.create as ReturnType<typeof vi.fn>).mockResolvedValue(mockCapacity)

    await app.register(programsModule, { prefix: '/api/v1/programs' })
    await app.ready()
    const token = signEmployerToken(app)

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/programs/hosting-capacity',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        cycleId: CYCLE_ID,
        slotsOffered: 5,
        stateId: 1,
        contactName: 'Jane Doe',
        contactPhone: '+231770000001',
      },
    })

    expect(res.statusCode).toBe(201)
    const body = res.json()
    expect(body.employerId).toBe(EMPLOYER_ID)
    expect(body.cycleId).toBe(CYCLE_ID)
    expect(body.slotsOffered).toBe(5)
    expect(body.contactName).toBe('Jane Doe')
  })

  it('duplicate submission returns 409', async () => {
    const app = buildApp()
    ;(app.prisma.employerUser.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ employerId: EMPLOYER_ID })
    ;(app.prisma.programCycle.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockOpenCycle)
    ;(app.prisma.state.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 1, name: 'Montserrado' })
    ;(app.prisma.programHostingCapacity.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockCapacity)

    await app.register(programsModule, { prefix: '/api/v1/programs' })
    await app.ready()
    const token = signEmployerToken(app)

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/programs/hosting-capacity',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        cycleId: CYCLE_ID,
        slotsOffered: 5,
        stateId: 1,
        contactName: 'Jane Doe',
        contactPhone: '+231770000001',
      },
    })

    expect(res.statusCode).toBe(409)
  })

  it('non-open program returns 400', async () => {
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
        slotsOffered: 5,
        stateId: 1,
        contactName: 'Jane Doe',
        contactPhone: '+231770000001',
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
        slotsOffered: 5,
        stateId: 1,
        contactName: 'Jane Doe',
        contactPhone: '+231770000001',
      },
    })

    expect(res.statusCode).toBe(404)
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
        slotsOffered: 5,
        stateId: 1,
        contactName: 'Jane Doe',
        contactPhone: '+231770000001',
      },
    })

    expect(res.statusCode).toBe(403)
  })
})

describe('GET /api/v1/programs/hosting-capacity/by-cycle/:cycleId', () => {
  it('returns existing capacity for employer → 200', async () => {
    const app = buildApp()
    ;(app.prisma.employerUser.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ employerId: EMPLOYER_ID })
    ;(app.prisma.programHostingCapacity.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockCapacity)

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
    expect(body.slotsOffered).toBe(5)
  })

  it('returns 404 when no capacity for that cycle', async () => {
    const app = buildApp()
    ;(app.prisma.employerUser.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ employerId: EMPLOYER_ID })
    ;(app.prisma.programHostingCapacity.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null)

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
  it('returns paginated list for employer → 200', async () => {
    const app = buildApp()
    ;(app.prisma.employerUser.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ employerId: EMPLOYER_ID })
    ;(app.prisma.programHostingCapacity.count as ReturnType<typeof vi.fn>).mockResolvedValue(1)
    ;(app.prisma.programHostingCapacity.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([mockCapacity])

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
    expect(body.data).toHaveLength(1)
    expect(body.data[0].cycleId).toBe(CYCLE_ID)
    expect(body.pagination.total).toBe(1)
    expect(body.pagination.hasMore).toBe(false)
    expect(body.pagination.nextCursor).toBeNull()
  })
})
