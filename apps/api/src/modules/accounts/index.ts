import type { FastifyPluginAsync } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import bcrypt from 'bcryptjs'
import {
  RegisterIndividualSchema,
  RegisterEmployerSchema,
  RequestOtpSchema,
  VerifyOtpSchema,
  LoginSchema,
  AuthTokenResponseSchema,
  MessageResponseSchema,
  MeResponseSchema,
} from '@liberia-works/shared-schemas'
import type { UserRole } from '@liberia-works/shared-types'
import { authenticate } from '../../plugins/auth.js'
import { complexityValidator } from '../../lib/password-validation.js'

/**
 * Accounts module — users, OTP codes, sessions, RBAC.
 *
 * Endpoints:
 *   POST /api/v1/auth/register/individual
 *   POST /api/v1/auth/register/employer
 *   POST /api/v1/auth/otp/request
 *   POST /api/v1/auth/otp/verify
 *   POST /api/v1/auth/login
 *   POST /api/v1/auth/refresh
 *   POST /api/v1/auth/logout
 *   GET  /api/v1/auth/me
 */

// Helper: generate and store session, issue tokens, set cookies
async function issueTokens(
  app: Parameters<FastifyPluginAsync>[0],
  reply: import('fastify').FastifyReply,
  request: import('fastify').FastifyRequest,
  user: { id: string; role: UserRole },
) {
  const sessionId = crypto.randomUUID()
  const rawToken = crypto.randomUUID().replace(/-/g, '')
  const refreshTokenHash = await bcrypt.hash(rawToken, 10)
  const refreshExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

  await app.prisma.session.create({
    data: {
      id: sessionId,
      userId: user.id,
      refreshTokenHash,
      issuedAt: new Date(),
      expiresAt: refreshExpiresAt,
      userAgent: request.headers['user-agent'] ?? null,
      ipAddress: request.ip ?? null,
    },
  })

  const accessToken = app.jwt.sign({ sub: user.id, role: user.role, sessionId })
  const isProd = process.env.NODE_ENV === 'production'

  reply
    .setCookie('access_token', accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      maxAge: 15 * 60,
    })
    .setCookie('refresh_token', `${sessionId}.${rawToken}`, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/api/v1/auth/refresh',
      maxAge: 30 * 24 * 60 * 60,
    })

  return {
    userId: user.id,
    role: user.role,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
  }
}

function mapGender(gender: 'male' | 'female' | 'unspecified' | undefined): 'MALE' | 'FEMALE' | 'PREFER_NOT_TO_SAY' | null {
  if (!gender) return null
  if (gender === 'male') return 'MALE'
  if (gender === 'female') return 'FEMALE'
  return 'PREFER_NOT_TO_SAY'
}

export const accountsModule: FastifyPluginAsync = async (app) => {
  const server = app.withTypeProvider<ZodTypeProvider>()

  // POST /register/individual
  server.post('/register/individual', {
    schema: {
      tags: ['auth'],
      summary: 'Register a new individual account and send OTP',
      body: RegisterIndividualSchema,
      response: { 201: MessageResponseSchema },
    },
  }, async (req, reply) => {
    const { phone, fullName, dateOfBirth, gender, channel } = req.body

    const existing = await app.prisma.user.findUnique({ where: { phoneNumber: phone } })
    if (existing) return reply.conflict('Phone number already registered')

    const user = await app.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          phoneNumber: phone,
          role: 'INDIVIDUAL',
          isPhoneVerified: false,
          fullName: fullName ?? null,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
          gender: mapGender(gender),
        },
      })
      await tx.individual.create({
        data: { userId: newUser.id },
      })
      return newUser
    })

    const otp = String(Math.floor(100000 + Math.random() * 900000))
    const codeHash = await bcrypt.hash(otp, 10)
    await app.prisma.otpCode.create({
      data: {
        userId: user.id,
        destination: phone,
        channel,
        purpose: 'REGISTRATION',
        codeHash,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    })

    app.log.info({ phone, otp }, 'OTP generated (dev only)')
    return reply.status(201).send({ message: `OTP sent to ${phone}` })
  })

  // POST /register/employer
  server.post('/register/employer', {
    schema: {
      tags: ['auth'],
      summary: 'Register a new employer account',
      body: RegisterEmployerSchema,
      response: { 201: AuthTokenResponseSchema },
    },
  }, async (req, reply) => {
    const { email, password, fullName, companyName, lraRegistrationNumber, primaryContactPhone } = req.body

    const complexityErrors = complexityValidator.validate(password)
    if (complexityErrors.length > 0) {
      return reply.badRequest(`Password must contain: ${complexityErrors.join('; ')}`)
    }

    const existing = await app.prisma.user.findUnique({ where: { email } })
    if (existing) return reply.conflict('Email address already registered')
  
    const existingLra = await app.prisma.employer.findUnique({ where: { lraRegistrationNumber } })
    if (existingLra) return reply.conflict('LRA registration number already registered')

    const passwordHash = await bcrypt.hash(password, 12)

    const user = await app.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: { email, passwordHash, role: 'EMPLOYER_ADMIN', isEmailVerified: false, fullName: fullName ?? null, phoneNumber: primaryContactPhone ?? null },
      })
      const employer = await tx.employer.create({
        data: {
          companyName,
          lraRegistrationNumber,
          primaryContactName: fullName,
          primaryContactEmail: email,
          primaryContactPhone: primaryContactPhone ?? '',
        },
      })
      await tx.employerUser.create({
        data: {
          employerId: employer.id,
          userId: newUser.id,
          role: 'ADMIN',
        },
      })
      await tx.passwordHistory.create({
        data: { userId: newUser.id, passwordHash },
      })
      return newUser
    })

    const tokens = await issueTokens(app, reply, req, user)
    return reply.status(201).send(tokens)
  })

  // POST /otp/request
  server.post('/otp/request', {
    schema: {
      tags: ['auth'],
      summary: 'Request or resend an OTP',
      body: RequestOtpSchema,
      response: { 200: MessageResponseSchema },
    },
  }, async (req, reply) => {
    const { phone, channel } = req.body
    const user = await app.prisma.user.findUnique({ where: { phoneNumber: phone } })
    if (!user) return reply.notFound('No account found for this phone number')

    const otp = String(Math.floor(100000 + Math.random() * 900000))
    const codeHash = await bcrypt.hash(otp, 10)
    await app.prisma.otpCode.create({
      data: {
        userId: user.id,
        destination: phone,
        channel,
        purpose: 'REGISTRATION',
        codeHash,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    })

    app.log.info({ phone, otp }, 'OTP resent (dev only)')
    return { message: `OTP sent to ${phone}` }
  })

  // POST /otp/verify
  server.post('/otp/verify', {
    schema: {
      tags: ['auth'],
      summary: 'Verify OTP and issue tokens',
      body: VerifyOtpSchema,
      response: { 200: AuthTokenResponseSchema },
    },
  }, async (req, reply) => {
    const { phone, otp } = req.body
    const user = await app.prisma.user.findUnique({ where: { phoneNumber: phone } })
    if (!user) return reply.notFound('No account found for this phone number')

    const record = await app.prisma.otpCode.findFirst({
      where: {
        destination: phone,
        purpose: 'REGISTRATION',
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    })

    if (!record) return reply.badRequest('OTP expired or not found')
    if (record.attempts >= 3) return reply.tooManyRequests('Too many incorrect attempts')

    const valid = await bcrypt.compare(otp, record.codeHash)
    if (!valid) {
      await app.prisma.otpCode.update({
        where: { id: record.id },
        data: { attempts: { increment: 1 } },
      })
      return reply.badRequest('Incorrect OTP')
    }

    await app.prisma.otpCode.update({
      where: { id: record.id },
      data: { consumedAt: new Date() },
    })
    await app.prisma.user.update({
      where: { id: user.id },
      data: { isPhoneVerified: true, lastLoginAt: new Date() },
    })

    return issueTokens(app, reply, req, user)
  })

  // POST /login
  server.post('/login', {
    schema: {
      tags: ['auth'],
      summary: 'Login with email+password or phone+password',
      body: LoginSchema,
      response: { 200: AuthTokenResponseSchema },
    },
  }, async (req, reply) => {
    const { email, phoneNumber, password } = req.body as { email?: string; phoneNumber?: string; password: string }

    const user = email
      ? await app.prisma.user.findUnique({ where: { email } })
      : await app.prisma.user.findUnique({ where: { phoneNumber: phoneNumber! } })

    if (!user || !user.passwordHash) return reply.unauthorized('Invalid credentials')
    if (!user.isActive) return reply.forbidden('Account is disabled')

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) return reply.unauthorized('Invalid credentials')

    await app.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    })

    return issueTokens(app, reply, req, user)
  })

  // POST /refresh
  server.post('/refresh', {
    schema: {
      tags: ['auth'],
      summary: 'Refresh access token',
      response: { 200: AuthTokenResponseSchema },
    },
  }, async (req, reply) => {
    const cookie = req.cookies.refresh_token
    if (!cookie) return reply.unauthorized('Missing refresh token')

    const dotIndex = cookie.indexOf('.')
    if (dotIndex === -1) return reply.unauthorized('Malformed refresh token')

    const sessionId = cookie.slice(0, dotIndex)
    const rawToken = cookie.slice(dotIndex + 1)

    const session = await app.prisma.session.findUnique({ where: { id: sessionId } })
    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      return reply.unauthorized('Session expired or revoked')
    }

    const valid = await bcrypt.compare(rawToken, session.refreshTokenHash)
    if (!valid) return reply.unauthorized('Invalid refresh token')

    const user = await app.prisma.user.findUnique({ where: { id: session.userId } })
    if (!user || !user.isActive) return reply.unauthorized('User not found or disabled')

    // Rotate: revoke old session, issue new one
    await app.prisma.session.update({
      where: { id: sessionId },
      data: { revokedAt: new Date() },
    })

    return issueTokens(app, reply, req, user)
  })

  // POST /logout
  server.post('/logout', {
    schema: {
      tags: ['auth'],
      summary: 'Logout and revoke session',
      response: { 200: MessageResponseSchema },
    },
    preHandler: [authenticate],
  }, async (req, reply) => {
    const { sessionId } = req.authUser!
    await app.prisma.session.update({
      where: { id: sessionId },
      data: { revokedAt: new Date() },
    })
    reply.clearCookie('access_token', { path: '/' })
    reply.clearCookie('refresh_token', { path: '/api/v1/auth/refresh' })
    return { message: 'Logged out successfully' }
  })

  // GET /me
  server.get('/me', {
    schema: {
      tags: ['auth'],
      summary: 'Get current authenticated user',
      response: { 200: MeResponseSchema },
    },
    preHandler: [authenticate],
  }, async (req, reply) => {
    const user = await app.prisma.user.findUnique({
      where: { id: req.authUser!.id },
      select: {
        id: true,
        role: true,
        email: true,
        phoneNumber: true,
        isPhoneVerified: true,
        isEmailVerified: true,
        fullName: true,
        gender: true,
      },
    })
    if (!user) return reply.notFound('User not found')
    return user
  })
}

export default accountsModule
