import type { FastifyPluginAsync } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
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
import type { DeliveryType } from '../../lib/notifications/index.js'
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
    accessToken,
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
    const { phone, fullName, countyId, dateOfBirth, gender, channel, email, password } = req.body

    const complexityErrors = complexityValidator.validate(password)
    if (complexityErrors.length > 0) {
      return reply.badRequest('Password must contain: ' + complexityErrors.join('; '))
    }

    const county = await app.prisma.state.findUnique({ where: { id: countyId }, select: { id: true, countryId: true } })
    if (!county) return reply.badRequest('Invalid county selected')

    const existing = await app.prisma.user.findUnique({ where: { phoneNumber: phone } })
    if (existing) return reply.conflict('Phone number already registered')

    const passwordHash = await bcrypt.hash(password, 12)

    const user = await app.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          phoneNumber: phone,
          email: email ?? null,
          passwordHash,
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
      await tx.address.create({
        data: {
          userId: newUser.id,
          countryId: county.countryId,
          stateId: county.id,
        },
      })
      return newUser
    })

    await app.prisma.passwordHistory.create({
      data: { userId: user.id, passwordHash },
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

    const destination = channel === 'EMAIL'
      ? (user.email ?? (() => { throw app.httpErrors.badRequest('No email address on this account') })())
      : phone
    await app.notify(channel as DeliveryType, {
      to: destination,
      body: `Your Quola verification code is ${otp}. It expires in 10 minutes.`,
      ...(channel === 'EMAIL' && { subject: 'Your Quola verification code' }),
    })
    return reply.status(201).send({ message: `OTP sent via ${channel.toLowerCase()}` })
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
    const { phone, channel, purpose } = req.body
    const user = await app.prisma.user.findUnique({ where: { phoneNumber: phone } })
    if (!user) return reply.notFound('No account found for this phone number')

    if (purpose === 'LOGIN' && !user.isPhoneVerified) {
      return reply.badRequest('Phone number not verified. Please complete registration first.')
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000))
    const codeHash = await bcrypt.hash(otp, 10)
    await app.prisma.otpCode.create({
      data: {
        userId: user.id,
        destination: phone,
        channel,
        purpose,
        codeHash,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    })

    const destination = channel === 'EMAIL'
      ? (user.email ?? (() => { throw app.httpErrors.badRequest('No email address on this account') })())
      : phone
    await app.notify(channel as DeliveryType, {
      to: destination,
      body: `Your Quola verification code is ${otp}. It expires in 10 minutes.`,
      ...(channel === 'EMAIL' && { subject: 'Your Quola verification code' }),
    })
    return { message: `OTP sent via ${channel.toLowerCase()}` }
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
    const { phone, otp, purpose } = req.body
    const user = await app.prisma.user.findUnique({ where: { phoneNumber: phone } })
    if (!user) return reply.notFound('No account found for this phone number')

    const record = await app.prisma.otpCode.findFirst({
      where: {
        destination: phone,
        purpose,
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
      data: {
        ...(purpose === 'REGISTRATION' && { isPhoneVerified: true }),
        lastLoginAt: new Date(),
      },
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

  // POST /change-password
  server.post('/change-password', {
    schema: {
      tags: ['auth'],
      summary: 'Change password for the currently authenticated user',
      body: z.object({
        currentPassword: z.string(),
        newPassword: z.string(),
      }),
      response: { 200: MessageResponseSchema },
    },
    preHandler: [authenticate],
  }, async (req, reply) => {
    const user = await app.prisma.user.findUnique({ where: { id: req.authUser!.id } })
    if (!user || !user.passwordHash) return reply.badRequest('No password set on this account')

    const valid = await bcrypt.compare(req.body.currentPassword, user.passwordHash)
    if (!valid) return reply.badRequest('Current password is incorrect')

    const complexityErrors = complexityValidator.validate(req.body.newPassword)
    if (complexityErrors.length > 0) {
      return reply.badRequest('Password must contain: ' + complexityErrors.join('; '))
    }

    const newHash = await bcrypt.hash(req.body.newPassword, 12)
    await app.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash },
    })
    await app.prisma.passwordHistory.create({
      data: { userId: user.id, passwordHash: newHash },
    })

    return { message: 'Password updated' }
  })

  // GET /sessions
  server.get('/sessions', {
    schema: {
      tags: ['auth'],
      summary: 'List active sessions for the current user',
      response: {
        200: z.array(z.object({
          id: z.string(),
          userAgent: z.string().nullable(),
          ipAddress: z.string().nullable(),
          issuedAt: z.string(),
          expiresAt: z.string(),
          isCurrent: z.boolean(),
        })),
      },
    },
    preHandler: [authenticate],
  }, async (req) => {
    const now = new Date()
    const sessions = await app.prisma.session.findMany({
      where: { userId: req.authUser!.id, revokedAt: null, expiresAt: { gt: now } },
      orderBy: { issuedAt: 'desc' },
    })
    return sessions.map((s) => ({
      id: s.id,
      userAgent: s.userAgent,
      ipAddress: s.ipAddress,
      issuedAt: s.issuedAt.toISOString(),
      expiresAt: s.expiresAt.toISOString(),
      isCurrent: s.id === req.authUser!.sessionId,
    }))
  })

  // DELETE /sessions/:id
  server.delete('/sessions/:id', {
    schema: {
      tags: ['auth'],
      summary: 'Revoke a session',
      params: z.object({ id: z.string() }),
      response: { 200: MessageResponseSchema },
    },
    preHandler: [authenticate],
  }, async (req, reply) => {
    const { id } = req.params
    if (id === req.authUser!.sessionId) return reply.badRequest('Cannot revoke your current session')
    const session = await app.prisma.session.findUnique({ where: { id } })
    if (!session || session.userId !== req.authUser!.id) return reply.notFound('Session not found')
    await app.prisma.session.update({ where: { id }, data: { revokedAt: new Date() } })
    return { message: 'Session revoked' }
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
