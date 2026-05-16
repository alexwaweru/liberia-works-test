/**
 * Tests for employer invite flow and team member management.
 *
 * Tests are designed to run without a real database — Prisma is mocked.
 * All happy-path and key error paths are covered.
 */
import { describe, it, expect, vi } from 'vitest'

// Stub env before any module under test loads it — prevents process.exit(1)
vi.mock('../config/env.js', () => ({
  env: {
    NODE_ENV: 'test',
    WEB_APP_URL: 'http://localhost:3000',
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
import employersModule, { inviteAcceptModule } from '../modules/employers/index.js'

const JWT_SECRET = 'test-secret-at-least-32-chars-long!!'
const EMPLOYER_ID = 'aaaaaaaa-0000-4000-8000-000000000001'
const USER_ID     = 'bbbbbbbb-0000-4000-8000-000000000001'
const INVITE_ID   = 'cccccccc-0000-4000-8000-000000000001'
const TARGET_USER_ID = 'dddddddd-0000-4000-8000-000000000002'

const makeEmployerUser = (overrides = {}) => ({
  id: 'ee000001-0000-4000-8000-000000000001',
  employerId: EMPLOYER_ID,
  userId: USER_ID,
  role: 'ADMIN',
  isActive: true,
  invitedAt: null,
  acceptedAt: null,
  createdAt: new Date('2024-01-01'),
  user: { email: 'admin@example.com', fullName: 'Admin User' },
  ...overrides,
})

const makeInvite = (overrides = {}) => ({
  id: INVITE_ID,
  employerId: EMPLOYER_ID,
  email: 'invited@example.com',
  role: 'HR',
  tokenHash: 'abc123hash',
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  acceptedAt: null,
  invitedByUserId: USER_ID,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
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

  // Mock notify (app.notify is decorated by the plugin; we mock it here)
  app.decorate('notify', vi.fn().mockResolvedValue(undefined))

  app.decorate('prisma', {
    employerUser: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
      count: vi.fn(),
    },
    employerInviteToken: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    employer: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    address: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    session: { create: vi.fn() },
    passwordHistory: { create: vi.fn() },
    $transaction: vi.fn(),
  } as unknown as PrismaClient)

  return app
}

function signAdminToken(app: ReturnType<typeof buildApp>) {
  return app.jwt.sign({ sub: USER_ID, role: 'EMPLOYER_ADMIN', sessionId: 'sess-001' })
}

function signHrToken(app: ReturnType<typeof buildApp>) {
  return app.jwt.sign({ sub: USER_ID, role: 'EMPLOYER_HR', sessionId: 'sess-002' })
}

// ── GET /employers/me/users ───────────────────────────────────────────────────

describe('GET /api/v1/employers/me/users', () => {
  it('returns combined members + pending invites', async () => {
    const app = buildApp()
    // getEmployerContext uses findFirst
    ;(app.prisma.employerUser.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ employerId: EMPLOYER_ID, role: 'ADMIN' })
    // the list endpoint uses findMany for members
    ;(app.prisma.employerUser.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([makeEmployerUser()])
    // and findMany for pending invites
    ;(app.prisma.employerInviteToken.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([makeInvite()])

    await app.register(employersModule, { prefix: '/api/v1/employers' })
    await app.ready()
    const token = signAdminToken(app)

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/employers/me/users',
      headers: { authorization: `Bearer ${token}` },
    })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.data).toHaveLength(2) // 1 member + 1 pending invite
    expect(body.data.find((d: { status: string }) => d.status === 'ACTIVE')).toBeDefined()
    expect(body.data.find((d: { status: string }) => d.status === 'PENDING')).toBeDefined()
  })

  it('returns 401 without token', async () => {
    const app = buildApp()
    await app.register(employersModule, { prefix: '/api/v1/employers' })
    await app.ready()

    const res = await app.inject({ method: 'GET', url: '/api/v1/employers/me/users' })
    expect(res.statusCode).toBe(401)
  })
})

// ── POST /employers/me/users/invite ──────────────────────────────────────────

describe('POST /api/v1/employers/me/users/invite', () => {
  it('sends invite and returns 201 when no conflicts', async () => {
    const app = buildApp()
    // getEmployerContext
    ;(app.prisma.employerUser.findFirst as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ employerId: EMPLOYER_ID, role: 'ADMIN' }) // getEmployerContext
      .mockResolvedValueOnce({ id: 'eu-admin-id' }) // requireEmployerAdmin
      .mockResolvedValueOnce(null) // existingMember check
    ;(app.prisma.employerInviteToken.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null) // no pending invite
    ;(app.prisma.employer.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ companyName: 'Acme Corp' })
    ;(app.prisma.employerInviteToken.create as ReturnType<typeof vi.fn>).mockResolvedValue({})

    await app.register(employersModule, { prefix: '/api/v1/employers' })
    await app.ready()
    const token = signAdminToken(app)

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/employers/me/users/invite',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      payload: JSON.stringify({ email: 'new@example.com', role: 'HR' }),
    })

    expect(res.statusCode).toBe(201)
    expect(res.json()).toEqual({ message: 'Invitation sent' })
    expect(app.notify).toHaveBeenCalledWith('EMAIL', expect.objectContaining({
      to: 'new@example.com',
    }))
  })

  it('returns 409 when pending invite already exists', async () => {
    const app = buildApp()
    ;(app.prisma.employerUser.findFirst as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ employerId: EMPLOYER_ID, role: 'ADMIN' })
      .mockResolvedValueOnce({ id: 'eu-admin-id' })
      .mockResolvedValueOnce(null) // no active member
    ;(app.prisma.employerInviteToken.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(makeInvite()) // pending invite exists

    await app.register(employersModule, { prefix: '/api/v1/employers' })
    await app.ready()
    const token = signAdminToken(app)

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/employers/me/users/invite',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      payload: JSON.stringify({ email: 'invited@example.com', role: 'HR' }),
    })

    expect(res.statusCode).toBe(409)
  })

  it('returns 403 when HR user tries to invite', async () => {
    const app = buildApp()
    ;(app.prisma.employerUser.findFirst as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ employerId: EMPLOYER_ID, role: 'HR' }) // getEmployerContext
      .mockResolvedValueOnce(null) // requireEmployerAdmin — no ADMIN row

    await app.register(employersModule, { prefix: '/api/v1/employers' })
    await app.ready()
    const token = signHrToken(app)

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/employers/me/users/invite',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      payload: JSON.stringify({ email: 'test@example.com', role: 'HR' }),
    })

    expect(res.statusCode).toBe(403)
  })
})

// ── DELETE /employers/me/users/:userId — last admin guard ─────────────────────

describe('DELETE /api/v1/employers/me/users/:userId', () => {
  it('returns 400 when removing the last admin (self)', async () => {
    const app = buildApp()
    ;(app.prisma.employerUser.findFirst as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ employerId: EMPLOYER_ID, role: 'ADMIN' }) // getEmployerContext
      .mockResolvedValueOnce({ id: 'eu-admin-id' }) // requireEmployerAdmin
      .mockResolvedValueOnce({ id: 'eu-admin-id', role: 'ADMIN', isActive: true }) // target
    ;(app.prisma.employerUser.count as ReturnType<typeof vi.fn>).mockResolvedValue(1) // only 1 admin

    await app.register(employersModule, { prefix: '/api/v1/employers' })
    await app.ready()
    const token = signAdminToken(app)

    const res = await app.inject({
      method: 'DELETE',
      url: `/api/v1/employers/me/users/${USER_ID}`,
      headers: { authorization: `Bearer ${token}` },
    })

    expect(res.statusCode).toBe(400)
    expect(res.json().message).toMatch(/last admin/i)
  })
})

// ── PATCH /employers/me/users/:userId/role — last admin guard ─────────────────

describe('PATCH /api/v1/employers/me/users/:userId/role', () => {
  it('returns 400 when downgrading the last admin', async () => {
    const app = buildApp()
    ;(app.prisma.employerUser.findFirst as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ employerId: EMPLOYER_ID, role: 'ADMIN' }) // getEmployerContext
      .mockResolvedValueOnce({ id: 'eu-admin-id' }) // requireEmployerAdmin
      .mockResolvedValueOnce({ id: 'eu-admin-id', role: 'ADMIN', isActive: true }) // target
    ;(app.prisma.employerUser.count as ReturnType<typeof vi.fn>).mockResolvedValue(1)

    await app.register(employersModule, { prefix: '/api/v1/employers' })
    await app.ready()
    const token = signAdminToken(app)

    const res = await app.inject({
      method: 'PATCH',
      url: `/api/v1/employers/me/users/${TARGET_USER_ID}/role`,
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      payload: JSON.stringify({ role: 'HR' }),
    })

    expect(res.statusCode).toBe(400)
    expect(res.json().message).toMatch(/last admin/i)
  })
})

// ── POST /invites/accept — happy path (existing user) ─────────────────────────

describe('POST /api/v1/invites/accept', () => {
  it('accepts invite for existing user and issues tokens', async () => {
    const app = buildApp()
    ;(app.prisma.employerInviteToken.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeInvite({ role: 'HR' })
    )
    ;(app.prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: TARGET_USER_ID,
      email: 'invited@example.com',
      role: 'EMPLOYER_HR',
    })
    ;(app.prisma.employerUser.upsert as ReturnType<typeof vi.fn>).mockResolvedValue({})
    ;(app.prisma.employerInviteToken.update as ReturnType<typeof vi.fn>).mockResolvedValue({})
    ;(app.prisma.session.create as ReturnType<typeof vi.fn>).mockResolvedValue({})

    await app.register(inviteAcceptModule, { prefix: '/api/v1/invites' })
    await app.ready()

    // We need a real token hash that matches. The endpoint hashes the raw token with sha256.
    // For the test, we mock findUnique to return regardless of hash — so any token works.
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/invites/accept',
      headers: { 'content-type': 'application/json' },
      payload: JSON.stringify({ token: 'any-raw-token-value' }),
    })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body).toHaveProperty('userId', TARGET_USER_ID)
    expect(body).toHaveProperty('accessToken')
  })

  it('returns 400 for expired invite', async () => {
    const app = buildApp()
    ;(app.prisma.employerInviteToken.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeInvite({ expiresAt: new Date(Date.now() - 1000) }) // expired
    )

    await app.register(inviteAcceptModule, { prefix: '/api/v1/invites' })
    await app.ready()

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/invites/accept',
      headers: { 'content-type': 'application/json' },
      payload: JSON.stringify({ token: 'some-token' }),
    })

    expect(res.statusCode).toBe(400)
    expect(res.json().message).toMatch(/expired/i)
  })

  it('returns 400 for already-accepted invite', async () => {
    const app = buildApp()
    ;(app.prisma.employerInviteToken.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeInvite({ acceptedAt: new Date('2024-01-01') }) // already accepted
    )

    await app.register(inviteAcceptModule, { prefix: '/api/v1/invites' })
    await app.ready()

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/invites/accept',
      headers: { 'content-type': 'application/json' },
      payload: JSON.stringify({ token: 'some-token' }),
    })

    expect(res.statusCode).toBe(400)
    expect(res.json().message).toMatch(/already been accepted/i)
  })

  it('returns 400 for new user without fullName+password', async () => {
    const app = buildApp()
    ;(app.prisma.employerInviteToken.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(makeInvite())
    ;(app.prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null) // no existing user

    await app.register(inviteAcceptModule, { prefix: '/api/v1/invites' })
    await app.ready()

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/invites/accept',
      headers: { 'content-type': 'application/json' },
      payload: JSON.stringify({ token: 'some-token' }), // no fullName/password
    })

    expect(res.statusCode).toBe(400)
    expect(res.json().message).toMatch(/fullName and password are required/i)
  })
})
