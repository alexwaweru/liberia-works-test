import { describe, it, expect, vi, beforeEach } from 'vitest'
import Fastify from 'fastify'
import cookie from '@fastify/cookie'
import jwt from '@fastify/jwt'
import sensible from '@fastify/sensible'
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod'
import type { PrismaClient } from '@prisma/client'
import accountsModule from '../modules/accounts/index.js'

// ── Fixtures ──────────────────────────────────────────────────────────────────

const MOCK_USER = {
  id: 'a0000000-0000-0000-0000-000000000099',
  phoneNumber: '+231771234599',
  email: null,
  role: 'INDIVIDUAL',
  isPhoneVerified: false,
  isActive: true,
  passwordHash: '$2a$12$hashedpassword',
}

const MOCK_COUNTY = { id: 3041, countryId: 123 }

// A valid password that satisfies both Zod min(8) and the complexity validator
// (minLength=12, uppercase, lowercase, number, special)
const VALID_PASSWORD = 'Str0ng!Pass#1'

const VALID_PAYLOAD = {
  phone: '+231771234599',
  fullName: 'Test User',
  password: VALID_PASSWORD,
  countyId: 3041,
}

// ── App factory ───────────────────────────────────────────────────────────────

function buildApp() {
  const app = Fastify({ logger: false })
  app.setValidatorCompiler(validatorCompiler)
  app.setSerializerCompiler(serializerCompiler)

  app.register(cookie, { secret: 'test-secret-at-least-32-chars-long!!' })
  app.register(jwt, {
    secret: 'test-secret-at-least-32-chars-long!!',
    cookie: { cookieName: 'access_token', signed: false },
    sign: { expiresIn: '15m' },
  })
  app.register(sensible)

  app.decorateRequest('authUser', null)

  const userCreate = vi.fn().mockResolvedValue(MOCK_USER)
  const individualCreate = vi.fn().mockResolvedValue({})
  const addressCreate = vi.fn().mockResolvedValue({})
  const passwordHistoryCreate = vi.fn().mockResolvedValue({})
  const otpCodeCreate = vi.fn().mockResolvedValue({})
  const userFindUnique = vi.fn().mockResolvedValue(null)
  const stateFindUnique = vi.fn().mockResolvedValue(MOCK_COUNTY)
  const sessionCreate = vi.fn().mockResolvedValue({})

  // $transaction calls the callback with a tx object containing the mocked methods
  const txMock = {
    user: { create: userCreate },
    individual: { create: individualCreate },
    address: { create: addressCreate },
    passwordHistory: { create: passwordHistoryCreate },
  }
  const $transaction = vi.fn().mockImplementation((cb: (tx: typeof txMock) => Promise<unknown>) => cb(txMock))

  app.decorate('prisma', {
    user: { findUnique: userFindUnique, create: userCreate },
    individual: { create: individualCreate },
    address: { create: addressCreate },
    passwordHistory: { create: passwordHistoryCreate },
    otpCode: { create: otpCodeCreate },
    state: { findUnique: stateFindUnique },
    session: { create: sessionCreate },
    $transaction,
  } as unknown as PrismaClient)

  app.decorate('notify', vi.fn().mockResolvedValue(undefined))

  return app
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('POST /api/v1/auth/register/individual', () => {
  it('returns 400 when password is missing', async () => {
    const app = buildApp()
    await app.register(accountsModule, { prefix: '/api/v1/auth' })

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register/individual',
      payload: {
        phone: '+231771234599',
        fullName: 'Test User',
        countyId: 3041,
        // password intentionally omitted
      },
    })

    expect(res.statusCode).toBe(400)
  })

  it('returns 400 when password is shorter than 8 characters (Zod validation)', async () => {
    const app = buildApp()
    await app.register(accountsModule, { prefix: '/api/v1/auth' })

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register/individual',
      payload: {
        phone: '+231771234599',
        fullName: 'Test User',
        countyId: 3041,
        password: 'Ab1!xyz', // 7 chars
      },
    })

    expect(res.statusCode).toBe(400)
  })

  it('returns 400 when password fails complexity validator (all lowercase, no uppercase/number/special)', async () => {
    const app = buildApp()
    await app.register(accountsModule, { prefix: '/api/v1/auth' })

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register/individual',
      payload: {
        phone: '+231771234599',
        fullName: 'Test User',
        countyId: 3041,
        password: 'alllowercaseonly', // passes min(8), fails complexity
      },
    })

    expect(res.statusCode).toBe(400)
    expect(res.json().message).toMatch(/Password must contain/i)
  })

  it('returns 409 when phone is already registered', async () => {
    const app = buildApp()
    ;(app.prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'existing-user-id',
      phoneNumber: '+231771234599',
    })
    await app.register(accountsModule, { prefix: '/api/v1/auth' })

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register/individual',
      payload: VALID_PAYLOAD,
    })

    expect(res.statusCode).toBe(409)
    expect(res.json().message).toMatch(/already registered/i)
  })

  it('returns 201 and stores passwordHash when valid payload with email is provided', async () => {
    const app = buildApp()
    await app.register(accountsModule, { prefix: '/api/v1/auth' })

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register/individual',
      payload: {
        ...VALID_PAYLOAD,
        email: 'test@example.com',
      },
    })

    expect(res.statusCode).toBe(201)
    expect(res.json().message).toMatch(/OTP sent/i)

    // Verify user.create was called with passwordHash and email
    const $transaction = app.prisma.$transaction as ReturnType<typeof vi.fn>
    expect($transaction).toHaveBeenCalledOnce()

    const userCreate = (app.prisma as unknown as { user: { create: ReturnType<typeof vi.fn> } }).user.create
    const createCall = userCreate.mock.calls[0]![0]
    expect(createCall.data).toHaveProperty('passwordHash')
    expect(typeof createCall.data.passwordHash).toBe('string')
    expect(createCall.data.passwordHash).not.toBe(VALID_PASSWORD) // must be hashed
    expect(createCall.data.email).toBe('test@example.com')

    // Verify passwordHistory.create was called after the transaction
    const passwordHistoryCreate = (
      app.prisma as unknown as { passwordHistory: { create: ReturnType<typeof vi.fn> } }
    ).passwordHistory.create
    expect(passwordHistoryCreate).toHaveBeenCalledOnce()
    const historyCall = passwordHistoryCreate.mock.calls[0]![0]
    expect(historyCall.data).toHaveProperty('userId', MOCK_USER.id)
    expect(historyCall.data).toHaveProperty('passwordHash')
  })

  it('returns 201 when valid payload without email is provided (email is optional)', async () => {
    const app = buildApp()
    await app.register(accountsModule, { prefix: '/api/v1/auth' })

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register/individual',
      payload: VALID_PAYLOAD, // no email
    })

    expect(res.statusCode).toBe(201)
    expect(res.json().message).toMatch(/OTP sent/i)

    const userCreate = (app.prisma as unknown as { user: { create: ReturnType<typeof vi.fn> } }).user.create
    const createCall = userCreate.mock.calls[0]![0]
    expect(createCall.data.email).toBeNull()
  })
})
