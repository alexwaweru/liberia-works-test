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
import molModule from './index.js'

const JWT_SECRET = 'test-secret-at-least-32-chars-long!!'
const MOL_OFFICER_ID = 'a1000000-0000-4000-8000-000000000001'
const MOL_DIRECTOR_ID = 'a2000000-0000-4000-8000-000000000002'
const INDIVIDUAL_USER_ID = 'c0000000-0000-4000-8000-000000000001'
const EMPLOYER_USER_ID = 'f0000000-0000-4000-8000-000000000002'

const EMPLOYER_ID_1 = 'e1000000-0000-4000-8000-000000000001'
const EMPLOYER_ID_2 = 'e2000000-0000-4000-8000-000000000002'

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
    employer: { findMany: vi.fn(), count: vi.fn() },
  } as unknown as PrismaClient)
  return app
}

function signMolOfficerToken(app: ReturnType<typeof buildApp>) {
  return app.jwt.sign({ sub: MOL_OFFICER_ID, role: 'MOL_OFFICER', sessionId: 'session-001' })
}

function signMolDirectorToken(app: ReturnType<typeof buildApp>) {
  return app.jwt.sign({ sub: MOL_DIRECTOR_ID, role: 'MOL_DIRECTOR', sessionId: 'session-002' })
}

function signIndividualToken(app: ReturnType<typeof buildApp>) {
  return app.jwt.sign({ sub: INDIVIDUAL_USER_ID, role: 'INDIVIDUAL', sessionId: 'session-003' })
}

function signEmployerToken(app: ReturnType<typeof buildApp>) {
  return app.jwt.sign({ sub: EMPLOYER_USER_ID, role: 'EMPLOYER_ADMIN', sessionId: 'session-004' })
}

function makeEmployer(id: string, overrides: Record<string, unknown> = {}) {
  return {
    id,
    companyName: `Acme Corp ${id.slice(0, 4)}`,
    lraRegistrationNumber: `LRA-${id.slice(0, 4)}`,
    primaryContactName: 'Jane Doe',
    primaryContactEmail: 'jane@acme.com',
    primaryContactPhone: '+231555000',
    stateId: 1,
    createdAt: new Date('2025-01-01T00:00:00.000Z'),
    state: { id: 1, name: 'Montserrado' },
    _count: {
      vacancies: 10,
      workforceEmployees: 50,
      workPermitApplications: 3,
      disputes: 1,
      placements: 2,
    },
    vacancies: [{ id: 'v1' }, { id: 'v2' }], // 2 active
    ...overrides,
  }
}

describe('GET /api/v1/mol/employers', () => {
  it('MOL_OFFICER can list employers — gets metrics filled in', async () => {
    const app = buildApp()
    const mockEmployers = [makeEmployer(EMPLOYER_ID_1)]
    ;(app.prisma.employer.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(mockEmployers)

    await app.register(molModule, { prefix: '/api/v1/mol' })
    await app.ready()
    const token = signMolOfficerToken(app)

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/mol/employers',
      headers: { authorization: `Bearer ${token}` },
    })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.items).toHaveLength(1)
    const item = body.items[0]
    expect(item.id).toBe(EMPLOYER_ID_1)
    expect(item.companyName).toMatch(/Acme/)
    expect(item.stateName).toBe('Montserrado')
    expect(item.metrics.vacanciesTotal).toBe(10)
    expect(item.metrics.vacanciesActive).toBe(2)
    expect(item.metrics.employees).toBe(50)
    expect(item.metrics.workPermits).toBe(3)
    expect(item.metrics.disputes).toBe(1)
    expect(item.metrics.placements).toBe(2)
    expect(body.nextCursor).toBeNull()
  })

  it('MOL_DIRECTOR can list employers → 200', async () => {
    const app = buildApp()
    ;(app.prisma.employer.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([makeEmployer(EMPLOYER_ID_1)])

    await app.register(molModule, { prefix: '/api/v1/mol' })
    await app.ready()
    const token = signMolDirectorToken(app)

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/mol/employers',
      headers: { authorization: `Bearer ${token}` },
    })

    expect(res.statusCode).toBe(200)
  })

  it('EMPLOYER_ADMIN token → 403', async () => {
    const app = buildApp()
    await app.register(molModule, { prefix: '/api/v1/mol' })
    await app.ready()
    const token = signEmployerToken(app)

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/mol/employers',
      headers: { authorization: `Bearer ${token}` },
    })

    expect(res.statusCode).toBe(403)
  })

  it('INDIVIDUAL token → 403', async () => {
    const app = buildApp()
    await app.register(molModule, { prefix: '/api/v1/mol' })
    await app.ready()
    const token = signIndividualToken(app)

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/mol/employers',
      headers: { authorization: `Bearer ${token}` },
    })

    expect(res.statusCode).toBe(403)
  })

  it('pagination: limit=1 with two employers returns nextCursor', async () => {
    const app = buildApp()
    // findMany returns limit+1 rows to signal hasMore
    const mockEmployers = [makeEmployer(EMPLOYER_ID_1), makeEmployer(EMPLOYER_ID_2)]
    ;(app.prisma.employer.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(mockEmployers)

    await app.register(molModule, { prefix: '/api/v1/mol' })
    await app.ready()
    const token = signMolOfficerToken(app)

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/mol/employers?limit=1',
      headers: { authorization: `Bearer ${token}` },
    })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.items).toHaveLength(1)
    expect(body.nextCursor).not.toBeNull()
    // nextCursor should be base64 of the last item's id
    expect(atob(body.nextCursor!)).toBe(EMPLOYER_ID_1)
  })

  it('cursor pagination: cursor param is forwarded to prisma query', async () => {
    const app = buildApp()
    ;(app.prisma.employer.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([makeEmployer(EMPLOYER_ID_2)])

    await app.register(molModule, { prefix: '/api/v1/mol' })
    await app.ready()
    const token = signMolOfficerToken(app)

    const cursor = btoa(EMPLOYER_ID_1)

    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/mol/employers?cursor=${cursor}&limit=25`,
      headers: { authorization: `Bearer ${token}` },
    })

    expect(res.statusCode).toBe(200)
    const findManyCall = (app.prisma.employer.findMany as ReturnType<typeof vi.fn>).mock.calls[0]![0]
    expect(findManyCall.cursor).toEqual({ id: EMPLOYER_ID_1 })
    expect(findManyCall.skip).toBe(1)
  })

  it('employer with no state returns stateName null', async () => {
    const app = buildApp()
    const noState = makeEmployer(EMPLOYER_ID_1, { stateId: null, state: null })
    ;(app.prisma.employer.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([noState])

    await app.register(molModule, { prefix: '/api/v1/mol' })
    await app.ready()
    const token = signMolOfficerToken(app)

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/mol/employers',
      headers: { authorization: `Bearer ${token}` },
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().items[0].stateName).toBeNull()
  })
})
