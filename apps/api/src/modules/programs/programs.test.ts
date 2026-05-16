import { describe, it, expect, vi } from 'vitest'
import Fastify from 'fastify'
import cookie from '@fastify/cookie'
import jwt from '@fastify/jwt'
import sensible from '@fastify/sensible'
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod'
import type { PrismaClient } from '@prisma/client'
import programsModule from './index.js'

const JWT_SECRET = 'test-secret-at-least-32-chars-long!!'
const INDIVIDUAL_USER_ID = 'c0000000-0000-4000-8000-000000000001'
const INDIVIDUAL_ID = 'd0000000-0000-4000-8000-000000000001'
const PROGRAM_CYCLE_ID = 'e0000000-0000-4000-8000-000000000001'
const EMPLOYER_USER_ID = 'f0000000-0000-4000-8000-000000000002'

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
    programOptIn: { findFirst: vi.fn(), create: vi.fn(), findMany: vi.fn(), count: vi.fn() },
    programCycle: { findMany: vi.fn(), count: vi.fn(), findUnique: vi.fn() },
    sector: { findMany: vi.fn() },
    state: { findMany: vi.fn() },
    educationLevel: { findUnique: vi.fn() },
  } as unknown as PrismaClient)
  return app
}

function signIndividualToken(app: ReturnType<typeof buildApp>) {
  return app.jwt.sign({ sub: INDIVIDUAL_USER_ID, role: 'INDIVIDUAL', sessionId: 'session-ind-001' })
}

function signEmployerToken(app: ReturnType<typeof buildApp>) {
  return app.jwt.sign({ sub: EMPLOYER_USER_ID, role: 'EMPLOYER_ADMIN', sessionId: 'session-emp-001' })
}

const mockOptIn = {
  id: 'optin-001',
  individualId: INDIVIDUAL_ID,
  programCycleId: PROGRAM_CYCLE_ID,
  status: 'PENDING',
  preferredSectors: ['sector-001'],
  preferredCounties: [1],
  preferredEducationLevelId: 'edu-001',
  additionalNotes: null,
  matchedEmployerId: null,
  matchedAt: null,
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  programCycle: { id: PROGRAM_CYCLE_ID, name: 'Cycle 2024', year: 2024, status: 'OPEN' },
  matchedEmployer: null,
  preferredEducationLevel: { id: 'edu-001', name: 'Bachelor', iscedCode: 'ISCED6' },
}

describe('GET /api/v1/programs/opt-ins/by-program/:programCycleId', () => {
  it('authenticated INDIVIDUAL with existing opt-in → 200 with opt-in data', async () => {
    const app = buildApp()
    ;(app.prisma.individual.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ id: INDIVIDUAL_ID })
    ;(app.prisma.programOptIn.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(mockOptIn)
    ;(app.prisma.sector.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 'sector-001', name: 'Agriculture', isicCode: 'A' },
    ])
    ;(app.prisma.state.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 1, name: 'Montserrado', stateCode: 'MT' },
    ])

    await app.register(programsModule, { prefix: '/api/v1/programs' })
    await app.ready()
    const token = signIndividualToken(app)

    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/programs/opt-ins/by-program/${PROGRAM_CYCLE_ID}`,
      headers: { authorization: `Bearer ${token}` },
    })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.id).toBe('optin-001')
    expect(body.programCycleId).toBe(PROGRAM_CYCLE_ID)
    expect(body.status).toBe('PENDING')
    expect(body.preferredSectors).toEqual([{ id: 'sector-001', name: 'Agriculture', code: 'A' }])
    expect(body.preferredCounties).toEqual([{ id: 1, name: 'Montserrado', code: 'MT' }])
    expect(body.preferredEducationLevel).toEqual({ id: 'edu-001', name: 'Bachelor', code: 'ISCED6' })
    expect(body.programCycle).toEqual({ id: PROGRAM_CYCLE_ID, name: 'Cycle 2024', year: 2024, status: 'OPEN' })
    expect(body.matchedEmployer).toBeNull()
  })

  it('authenticated INDIVIDUAL with no opt-in → 404', async () => {
    const app = buildApp()
    ;(app.prisma.individual.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ id: INDIVIDUAL_ID })
    ;(app.prisma.programOptIn.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null)

    await app.register(programsModule, { prefix: '/api/v1/programs' })
    await app.ready()
    const token = signIndividualToken(app)

    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/programs/opt-ins/by-program/${PROGRAM_CYCLE_ID}`,
      headers: { authorization: `Bearer ${token}` },
    })

    expect(res.statusCode).toBe(404)
  })

  it('with EMPLOYER token → 403 forbidden', async () => {
    const app = buildApp()
    await app.register(programsModule, { prefix: '/api/v1/programs' })
    await app.ready()
    const token = signEmployerToken(app)

    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/programs/opt-ins/by-program/${PROGRAM_CYCLE_ID}`,
      headers: { authorization: `Bearer ${token}` },
    })

    expect(res.statusCode).toBe(403)
  })
})
