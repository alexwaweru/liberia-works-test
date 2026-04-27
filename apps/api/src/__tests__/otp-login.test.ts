import { describe, it, expect, vi, beforeEach } from 'vitest'
import Fastify from 'fastify'
import cookie from '@fastify/cookie'
import jwt from '@fastify/jwt'
import sensible from '@fastify/sensible'
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod'
import type { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'
import accountsModule from '../modules/accounts/index.js'

// ── Stable test fixtures ──────────────────────────────────────────────────────

const VERIFIED_USER = {
  id: 'a0000000-0000-0000-0000-000000000001',
  phoneNumber: '+231771234567',
  role: 'INDIVIDUAL',
  isPhoneVerified: true,
  isActive: true,
  passwordHash: null,
}

const UNVERIFIED_USER = {
  id: 'a0000000-0000-0000-0000-000000000002',
  phoneNumber: '+231771234568',
  role: 'INDIVIDUAL',
  isPhoneVerified: false,
  isActive: true,
  passwordHash: null,
}

// ── App factory ───────────────────────────────────────────────────────────────

function buildApp() {
  const app = Fastify({ logger: false })
  app.setValidatorCompiler(validatorCompiler)
  app.setSerializerCompiler(serializerCompiler)

  // Plugins that accountsModule depends on
  app.register(cookie, { secret: 'test-secret-at-least-32-chars-long!!' })
  app.register(jwt, {
    secret: 'test-secret-at-least-32-chars-long!!',
    cookie: { cookieName: 'access_token', signed: false },
    sign: { expiresIn: '15m' },
  })
  app.register(sensible)

  // Decorate authUser on request (auth plugin normally does this)
  app.decorateRequest('authUser', null)

  // Mock prisma
  app.decorate('prisma', {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    otpCode: {
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    session: {
      create: vi.fn(),
    },
  } as unknown as PrismaClient)

  // Mock notify (accounts module calls app.notify() for OTP delivery)
  app.decorate('notify', vi.fn().mockResolvedValue(undefined))

  return app
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('POST /api/v1/auth/otp/request — LOGIN purpose', () => {
  it('returns 404 when user does not exist', async () => {
    const app = buildApp()
    ;(app.prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null)
    await app.register(accountsModule, { prefix: '/api/v1/auth' })

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/otp/request',
      payload: { phone: '+231771234567', purpose: 'LOGIN' },
    })

    expect(res.statusCode).toBe(404)
  })

  it('returns 400 when user exists but phone is not verified', async () => {
    const app = buildApp()
    ;(app.prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(UNVERIFIED_USER)
    await app.register(accountsModule, { prefix: '/api/v1/auth' })

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/otp/request',
      payload: { phone: '+231771234568', purpose: 'LOGIN' },
    })

    expect(res.statusCode).toBe(400)
    expect(res.json().message).toMatch(/not verified/i)
  })

  it('returns 200 and creates OTP with LOGIN purpose for a verified user', async () => {
    const app = buildApp()
    ;(app.prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(VERIFIED_USER)
    ;(app.prisma.otpCode.create as ReturnType<typeof vi.fn>).mockResolvedValue({})
    await app.register(accountsModule, { prefix: '/api/v1/auth' })

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/otp/request',
      payload: { phone: '+231771234567', purpose: 'LOGIN' },
    })

    expect(res.statusCode).toBe(200)
    const createCall = (app.prisma.otpCode.create as ReturnType<typeof vi.fn>).mock.calls[0]![0]
    expect(createCall.data.purpose).toBe('LOGIN')
  })
})

describe('POST /api/v1/auth/otp/verify — LOGIN purpose', () => {
  it('returns 200 and issues tokens for a correct LOGIN OTP', async () => {
    const app = buildApp()
    const rawOtp = '123456'
    const codeHash = await bcrypt.hash(rawOtp, 10)

    ;(app.prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(VERIFIED_USER)
    ;(app.prisma.otpCode.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'otp-id-001',
      codeHash,
      attempts: 0,
      purpose: 'LOGIN',
    })
    ;(app.prisma.otpCode.update as ReturnType<typeof vi.fn>).mockResolvedValue({})
    ;(app.prisma.user.update as ReturnType<typeof vi.fn>).mockResolvedValue({})
    ;(app.prisma.session.create as ReturnType<typeof vi.fn>).mockResolvedValue({})
    await app.register(accountsModule, { prefix: '/api/v1/auth' })

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/otp/verify',
      payload: { phone: '+231771234567', otp: rawOtp, purpose: 'LOGIN' },
    })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body).toHaveProperty('userId', VERIFIED_USER.id)
    expect(body).toHaveProperty('role', VERIFIED_USER.role)

    // Must NOT update isPhoneVerified (already true for LOGIN flow)
    const userUpdateCall = (app.prisma.user.update as ReturnType<typeof vi.fn>).mock.calls[0]![0]
    expect(userUpdateCall.data).not.toHaveProperty('isPhoneVerified')
    // Must update lastLoginAt
    expect(userUpdateCall.data).toHaveProperty('lastLoginAt')
  })

  it('returns 400 when OTP purpose mismatches (created REGISTRATION, verified with LOGIN)', async () => {
    const app = buildApp()
    ;(app.prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(VERIFIED_USER)
    // findFirst returns null because purpose filter won't match a REGISTRATION record
    ;(app.prisma.otpCode.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null)
    await app.register(accountsModule, { prefix: '/api/v1/auth' })

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/otp/verify',
      payload: { phone: '+231771234567', otp: '123456', purpose: 'LOGIN' },
    })

    expect(res.statusCode).toBe(400)
  })
})

describe('POST /api/v1/auth/otp/request — default purpose (REGISTRATION)', () => {
  it('returns 200 and creates OTP with REGISTRATION purpose when purpose is omitted', async () => {
    const app = buildApp()
    ;(app.prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(VERIFIED_USER)
    ;(app.prisma.otpCode.create as ReturnType<typeof vi.fn>).mockResolvedValue({})
    await app.register(accountsModule, { prefix: '/api/v1/auth' })

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/otp/request',
      payload: { phone: '+231771234567' },
    })

    expect(res.statusCode).toBe(200)
    const createCall = (app.prisma.otpCode.create as ReturnType<typeof vi.fn>).mock.calls[0]![0]
    expect(createCall.data.purpose).toBe('REGISTRATION')
  })
})
