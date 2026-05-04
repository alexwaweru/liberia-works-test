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
 */

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
      await tx.individual.create({ data: { userId: newUser.id } })
      await tx.address.create({
        data: { userId: newUser.id, countryId: county.countryId, stateId: county.id },
      })
      return newUser
    })

    await app.prisma.passwordHistory.create({
      data: { userId: user.id, passwordHash },
    })

    // AUDIT: Registration
    await app.audit.record({
      actorUserId: user.id, actorRole: 'INDIVIDUAL', action: 'USER_REGISTER',
      targetTable: 'users', targetId: user.id, ipAddress: req.ip, userAgent: req.headers['user-agent'], requestId: req.id as string
    })

    const otp = String(Math.floor(100000 + Math.random() * 900000))
    const codeHash = await bcrypt.hash(otp, 10)
    await app.prisma.otpCode.create({
      data: {
        userId: user.id, destination: phone, channel, purpose: 'REGISTRATION',
        codeHash, expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    })

    await app.notify(channel as DeliveryType, {
      to: channel === 'EMAIL' ? user.email! : phone,
      body: `Your Liberia Works verification code is ${otp}. It expires in 10 minutes.`,
      ...(channel === 'EMAIL' && { subject: 'Your Liberia Works verification code' }),
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

    const passwordHash = await bcrypt.hash(password, 12)

    const user = await app.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: { email, passwordHash, role: 'EMPLOYER_ADMIN', isEmailVerified: false, fullName: fullName ?? null, phoneNumber: primaryContactPhone ?? null },
      })
      const employer = await tx.employer.create({
        data: { companyName, lraRegistrationNumber, primaryContactName: fullName, primaryContactEmail: email, primaryContactPhone: primaryContactPhone ?? '' },
      })
      await tx.employerUser.create({ data: { employerId: employer.id, userId: newUser.id, role: 'ADMIN' } })
      await tx.passwordHistory.create({ data: { userId: newUser.id, passwordHash } })
      return newUser
    })

    // AUDIT: Employer Registration
    await app.audit.record({
      actorUserId: user.id, actorRole: 'EMPLOYER_ADMIN', action: 'USER_REGISTER_EMPLOYER',
      targetTable: 'users', targetId: user.id, ipAddress: req.ip, userAgent: req.headers['user-agent'], requestId: req.id as string
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

    // AUDIT: Job Seeker Registration
    await app.audit.record({
      actorUserId: user.id, actorRole: 'INDIVIDUAL', action: 'INDIVIDUAL_REQUEST_OTP',
      targetTable: 'users', targetId: user.id, ipAddress: req.ip, userAgent: req.headers['user-agent'], requestId: req.id as string
    })

    const destination = channel === 'EMAIL'
      ? (user.email ?? (() => { throw app.httpErrors.badRequest('No email address on this account') })())
      : phone

    await app.notify(channel as DeliveryType, {
      to: destination,
      body: `Your Liberia Works verification code is ${otp}. It expires in 10 minutes.`,
      ...(channel === 'EMAIL' && { subject: 'Your Liberia Works verification code' }),
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
    
    if (!user) {
        // AUDIT: Failed OTP (Unknown user)
        await app.audit.record({
            actorUserId: null, actorRole: 'SYSTEM', action: 'AUTH_OTP_FAILURE_UNKNOWN_USER',
            ipAddress: req.ip, userAgent: req.headers['user-agent'], requestId: req.id as string
        })
        return reply.notFound('No account found for this phone number')
    }

    const record = await app.prisma.otpCode.findFirst({
      where: { destination: phone, purpose, consumedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    })

    if (!record) {
        // AUDIT: Failed OTP (Expired/Missing)
        await app.audit.record({
            actorUserId: user.id, actorRole: user.role, action: 'AUTH_OTP_EXPIRED',
            ipAddress: req.ip, userAgent: req.headers['user-agent'], requestId: req.id as string
        })
        return reply.badRequest('OTP expired or not found')
    }
    
    const valid = await bcrypt.compare(otp, record.codeHash)
    if (!valid) {
      await app.prisma.otpCode.update({ where: { id: record.id }, data: { attempts: { increment: 1 } } })
      
      // AUDIT: Failed OTP (Wrong code)
      await app.audit.record({
        actorUserId: user.id, actorRole: user.role, action: 'AUTH_OTP_FAILURE',
        ipAddress: req.ip, userAgent: req.headers['user-agent'], requestId: req.id as string
      })
      
      return reply.badRequest('Incorrect OTP')
    }

    await app.prisma.otpCode.update({ where: { id: record.id }, data: { consumedAt: new Date() } })
    await app.prisma.user.update({
      where: { id: user.id },
      data: { ...(purpose === 'REGISTRATION' && { isPhoneVerified: true }), lastLoginAt: new Date() },
    })

    // AUDIT: Login via OTP
    await app.audit.record({
      actorUserId: user.id, actorRole: user.role, action: 'USER_LOGIN_OTP',
      ipAddress: req.ip, userAgent: req.headers['user-agent'], requestId: req.id as string
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
    const user = email ? await app.prisma.user.findUnique({ where: { email } }) : await app.prisma.user.findUnique({ where: { phoneNumber: phoneNumber! } })

    if (!user || !user.passwordHash) {
      // AUDIT: Failed Login (User not found)
      await app.audit.record({
        actorUserId: null, actorRole: 'SYSTEM', action: 'AUTH_FAILURE_UNKNOWN_USER',
        ipAddress: req.ip, userAgent: req.headers['user-agent'], requestId: req.id as string
      })
      return reply.unauthorized('Invalid credentials')
    }
    
    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) {
      // AUDIT: Failed Login (Wrong password)
      await app.audit.record({
        actorUserId: user.id, actorRole: user.role, action: 'AUTH_PASSWORD_FAILURE',
        ipAddress: req.ip, userAgent: req.headers['user-agent'], requestId: req.id as string
      })
      return reply.unauthorized('Invalid credentials')
    }

    await app.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })

    // AUDIT: Login Success
    await app.audit.record({
      actorUserId: user.id, actorRole: user.role, action: 'USER_LOGIN_PASSWORD',
      ipAddress: req.ip, userAgent: req.headers['user-agent'], requestId: req.id as string
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
    const { sessionId, id, role } = req.authUser!
    await app.prisma.session.update({ where: { id: sessionId }, data: { revokedAt: new Date() } })

    // AUDIT: Logout
    await app.audit.record({
      actorUserId: id, actorRole: role, action: 'USER_LOGOUT',
      ipAddress: req.ip, userAgent: req.headers['user-agent'], requestId: req.id as string
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
      body: z.object({ currentPassword: z.string(), newPassword: z.string() }),
      response: { 200: MessageResponseSchema },
    },
    preHandler: [authenticate],
  }, async (req, reply) => {
    const user = await app.prisma.user.findUnique({ where: { id: req.authUser!.id } })
    if (!user || !user.passwordHash) return reply.badRequest('No password set on this account')

    const valid = await bcrypt.compare(req.body.currentPassword, user.passwordHash)
    if (!valid) return reply.badRequest('Current password is incorrect')

    const newHash = await bcrypt.hash(req.body.newPassword, 12)
    await app.prisma.user.update({ where: { id: user.id }, data: { passwordHash: newHash } })
    await app.prisma.passwordHistory.create({ data: { userId: user.id, passwordHash: newHash } })

    // AUDIT: Password Change
    await app.audit.record({
      actorUserId: user.id, actorRole: user.role, action: 'USER_CHANGE_PASSWORD',
      ipAddress: req.ip, userAgent: req.headers['user-agent'], requestId: req.id as string
    })

    return { message: 'Password updated' }
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
      select: { id: true, role: true, email: true, phoneNumber: true, isPhoneVerified: true, isEmailVerified: true, fullName: true, gender: true },
    })
    if (!user) return reply.notFound('User not found')
    return user
  })
}

export default accountsModule
