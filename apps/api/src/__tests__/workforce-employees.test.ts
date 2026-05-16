/**
 * Tests for workforce employees CRUD endpoints.
 */
import { describe, it, expect, vi } from 'vitest'
import Fastify from 'fastify'
import cookie from '@fastify/cookie'
import jwt from '@fastify/jwt'
import sensible from '@fastify/sensible'
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod'
import type { PrismaClient } from '@prisma/client'
import type { UserRole } from '@liberia-works/shared-types'
import workforceEmployeesModule from '../modules/workforce-employees/index.js'

const JWT_SECRET = 'test-secret-at-least-32-chars-long!!'
const EMPLOYER_ID = 'aaaaaaaa-0000-4000-8000-000000000001'
const USER_ID     = 'bbbbbbbb-0000-4000-8000-000000000001'
const EMP_ID      = 'eeeeeeee-0000-4000-8000-000000000001'

const makeEmployee = (overrides = {}) => ({
  id: EMP_ID,
  employerId: EMPLOYER_ID,
  fullName: 'Jane Doe',
  gender: null,
  nationality: 'Liberian',
  position: 'Engineer',
  department: 'Engineering',
  employmentType: 'PERMANENT',
  hireDate: new Date('2023-01-15'),
  terminationDate: null,
  email: null,
  phone: null,
  salary: null,
  isActive: true,
  createdAt: new Date('2023-01-15'),
  updatedAt: new Date('2023-01-15'),
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
    workforceEmployee: {
      findMany: vi.fn(),
      count: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  } as unknown as PrismaClient)
  return app
}

function signToken(app: ReturnType<typeof buildApp>, role: UserRole = 'EMPLOYER_ADMIN') {
  return app.jwt.sign({ sub: USER_ID, role, sessionId: 'sess-001' })
}

// ── GET / — list ──────────────────────────────────────────────────────────────

describe('GET /api/v1/workforce-employees', () => {
  it('returns paginated list', async () => {
    const app = buildApp()
    ;(app.prisma.employerUser.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ employerId: EMPLOYER_ID })
    ;(app.prisma.workforceEmployee.count as ReturnType<typeof vi.fn>).mockResolvedValue(1)
    ;(app.prisma.workforceEmployee.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([makeEmployee()])

    await app.register(workforceEmployeesModule, { prefix: '/api/v1/workforce-employees' })
    await app.ready()
    const token = signToken(app)

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/workforce-employees',
      headers: { authorization: `Bearer ${token}` },
    })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.data).toHaveLength(1)
    expect(body.data[0]).toMatchObject({
      fullName: 'Jane Doe',
      nationality: 'Liberian',
      employmentType: 'PERMANENT',
    })
    expect(body.pagination.total).toBe(1)
  })

  it('returns 401 without token', async () => {
    const app = buildApp()
    await app.register(workforceEmployeesModule, { prefix: '/api/v1/workforce-employees' })
    await app.ready()

    const res = await app.inject({ method: 'GET', url: '/api/v1/workforce-employees' })
    expect(res.statusCode).toBe(401)
  })
})

// ── POST / — create ───────────────────────────────────────────────────────────

describe('POST /api/v1/workforce-employees', () => {
  it('creates and returns 201 with valid body', async () => {
    const app = buildApp()
    ;(app.prisma.employerUser.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ employerId: EMPLOYER_ID })
    ;(app.prisma.workforceEmployee.create as ReturnType<typeof vi.fn>).mockResolvedValue(makeEmployee())

    await app.register(workforceEmployeesModule, { prefix: '/api/v1/workforce-employees' })
    await app.ready()
    const token = signToken(app)

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/workforce-employees',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      payload: JSON.stringify({
        fullName: 'Jane Doe',
        nationality: 'Liberian',
        position: 'Engineer',
        department: 'Engineering',
        employmentType: 'PERMANENT',
        hireDate: '2023-01-15',
      }),
    })

    expect(res.statusCode).toBe(201)
    expect(res.json()).toMatchObject({ fullName: 'Jane Doe', employmentType: 'PERMANENT' })
  })

  it('returns 400 when required fields are missing', async () => {
    const app = buildApp()
    ;(app.prisma.employerUser.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ employerId: EMPLOYER_ID })

    await app.register(workforceEmployeesModule, { prefix: '/api/v1/workforce-employees' })
    await app.ready()
    const token = signToken(app)

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/workforce-employees',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      payload: JSON.stringify({ fullName: 'Jane Doe' }), // missing required fields
    })

    expect(res.statusCode).toBe(400)
  })

  it('returns 400 for invalid phone (not E.164)', async () => {
    const app = buildApp()
    ;(app.prisma.employerUser.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ employerId: EMPLOYER_ID })

    await app.register(workforceEmployeesModule, { prefix: '/api/v1/workforce-employees' })
    await app.ready()
    const token = signToken(app)

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/workforce-employees',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      payload: JSON.stringify({
        fullName: 'Jane Doe',
        nationality: 'Liberian',
        position: 'Engineer',
        department: 'Engineering',
        employmentType: 'PERMANENT',
        hireDate: '2023-01-15',
        phone: '0771234567', // not E.164
      }),
    })

    expect(res.statusCode).toBe(400)
  })
})

// ── DELETE /:id — soft delete ─────────────────────────────────────────────────

describe('DELETE /api/v1/workforce-employees/:id', () => {
  it('soft-deletes and returns 200', async () => {
    const app = buildApp()
    ;(app.prisma.employerUser.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ employerId: EMPLOYER_ID })
    ;(app.prisma.workforceEmployee.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(makeEmployee())
    ;(app.prisma.workforceEmployee.update as ReturnType<typeof vi.fn>).mockResolvedValue({})

    await app.register(workforceEmployeesModule, { prefix: '/api/v1/workforce-employees' })
    await app.ready()
    const token = signToken(app)

    const res = await app.inject({
      method: 'DELETE',
      url: `/api/v1/workforce-employees/${EMP_ID}`,
      headers: { authorization: `Bearer ${token}` },
    })

    expect(res.statusCode).toBe(200)
    expect(res.json()).toEqual({ message: 'Employee deactivated' })

    // Confirm isActive: false was passed
    const updateCall = (app.prisma.workforceEmployee.update as ReturnType<typeof vi.fn>).mock.calls[0]![0]
    expect(updateCall.data).toEqual({ isActive: false })
  })

  it('returns 404 for non-existent employee', async () => {
    const app = buildApp()
    ;(app.prisma.employerUser.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ employerId: EMPLOYER_ID })
    ;(app.prisma.workforceEmployee.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null)

    await app.register(workforceEmployeesModule, { prefix: '/api/v1/workforce-employees' })
    await app.ready()
    const token = signToken(app)

    const res = await app.inject({
      method: 'DELETE',
      url: `/api/v1/workforce-employees/${EMP_ID}`,
      headers: { authorization: `Bearer ${token}` },
    })

    expect(res.statusCode).toBe(404)
  })
})
