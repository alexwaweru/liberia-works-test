import type { FastifyPluginAsync, FastifyReply } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { createHash, randomBytes } from 'node:crypto'
import bcrypt from 'bcryptjs'
import {
  EmployerMeResponseSchema,
  UpdateEmployerSchema,
  EmployerSettingsResponseSchema,
  InviteEmployerUserSchema,
  AcceptInviteSchema,
  UpdateEmployerUserRoleSchema,
  EmployerUserListResponseSchema,
  MessageResponseSchema,
  AuthTokenResponseSchema,
} from '@liberia-works/shared-schemas'
import { EMPLOYER_ROLES } from '@liberia-works/shared-types'
import type { UserRole } from '@liberia-works/shared-types'
import { requireRole } from '../../plugins/auth.js'
import { env } from '../../config/env.js'
import type { DeliveryType } from '../../lib/notifications/index.js'
import { complexityValidator } from '../../lib/password-validation.js'

// Placeholder constant — swap for real Postmark template alias once template is created
export const EMPLOYER_INVITE_TEMPLATE_ALIAS = 'employer-invite'

function sha256(raw: string): string {
  return createHash('sha256').update(raw).digest('hex')
}

function formatDate(d: Date | null | undefined): string | null {
  if (!d) return null
  return d instanceof Date ? d.toISOString().split('T')[0]! : String(d)
}
// formatDate kept for future use (workforce employee dates)
void formatDate

/**
 * Look up the active EmployerUser row and return employerId + role.
 * Sends 404 and returns null when not found.
 */
async function getEmployerContext(
  app: Parameters<FastifyPluginAsync>[0],
  userId: string,
  reply: FastifyReply,
): Promise<{ employerId: string; employerUserRole: string } | null> {
  const eu = await app.prisma.employerUser.findFirst({
    where: { userId, isActive: true },
    select: { employerId: true, role: true },
  })
  if (!eu) {
    reply.notFound('No employer found for this user')
    return null
  }
  return { employerId: eu.employerId, employerUserRole: eu.role }
}

/**
 * Verifies the authed user holds the ADMIN EmployerUserRole within the employer.
 * Sends 403 and returns false if not.
 */
async function requireEmployerAdmin(
  app: Parameters<FastifyPluginAsync>[0],
  userId: string,
  employerId: string,
  reply: FastifyReply,
): Promise<boolean> {
  const eu = await app.prisma.employerUser.findFirst({
    where: { userId, employerId, isActive: true, role: 'ADMIN' },
    select: { id: true },
  })
  if (!eu) {
    reply.forbidden('Requires ADMIN role within this employer')
    return false
  }
  return true
}

/**
 * Issue auth session tokens — mirrors accounts module logic.
 */
async function issueTokens(
  app: Parameters<FastifyPluginAsync>[0],
  reply: FastifyReply,
  request: import('fastify').FastifyRequest,
  user: { id: string; role: UserRole },
) {
  const sessionId = crypto.randomUUID()
  const rawRefreshToken = crypto.randomUUID().replace(/-/g, '')
  const refreshTokenHash = await bcrypt.hash(rawRefreshToken, 10)
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
    .setCookie('refresh_token', `${sessionId}.${rawRefreshToken}`, {
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

/**
 * Fetch and format full employer settings (used by GET /me/settings and PATCH /me).
 */
async function getEmployerSettings(
  app: Parameters<FastifyPluginAsync>[0],
  employerId: string,
  reply: FastifyReply,
) {
  const employer = await app.prisma.employer.findUnique({
    where: { id: employerId },
    include: { address: true },
  })
  if (!employer) return reply.notFound('Employer not found')

  return {
    id: employer.id,
    companyName: employer.companyName,
    lraRegistrationNumber: employer.lraRegistrationNumber,
    sectorId: employer.sectorId,
    stateId: employer.stateId,
    primaryContactName: employer.primaryContactName,
    primaryContactEmail: employer.primaryContactEmail,
    primaryContactPhone: employer.primaryContactPhone,
    complianceStatus: employer.complianceStatus as 'COMPLIANT' | 'PENDING' | 'OVERDUE' | 'EXEMPT',
    vacationJobHosting: employer.vacationJobHosting,
    vacationJobDonating: employer.vacationJobDonating,
    isActive: employer.isActive,
    address: employer.address
      ? {
          id: employer.address.id,
          countryId: employer.address.countryId,
          stateId: employer.address.stateId ?? null,
          cityId: employer.address.cityId ?? null,
          addressLine1: employer.address.addressLine1 ?? null,
          addressLine2: employer.address.addressLine2 ?? null,
        }
      : null,
    createdAt: employer.createdAt.toISOString(),
    updatedAt: employer.updatedAt.toISOString(),
  }
}

// ── Employer module (authenticated) ──────────────────────────────────────────
export const employersModule: FastifyPluginAsync = async (app) => {
  const server = app.withTypeProvider<ZodTypeProvider>()

  // GET /employers/me — lightweight (id + companyName)
  server.get('/me', {
    schema: {
      tags: ['employers'],
      summary: 'Get current employer context (lightweight)',
      response: { 200: EmployerMeResponseSchema },
    },
    preHandler: [requireRole(EMPLOYER_ROLES)],
  }, async (req, reply) => {
    const ctx = await getEmployerContext(app, req.authUser!.id, reply)
    if (!ctx) return undefined
    const employer = await app.prisma.employer.findUnique({
      where: { id: ctx.employerId },
      select: { id: true, companyName: true },
    })
    if (!employer) return reply.notFound('Employer not found')
    return employer
  })

  // GET /employers/me/settings — full record + address
  server.get('/me/settings', {
    schema: {
      tags: ['employers'],
      summary: 'Get full employer settings including address',
      response: { 200: EmployerSettingsResponseSchema },
    },
    preHandler: [requireRole(EMPLOYER_ROLES)],
  }, async (req, reply) => {
    const ctx = await getEmployerContext(app, req.authUser!.id, reply)
    if (!ctx) return undefined
    return getEmployerSettings(app, ctx.employerId, reply)
  })

  // PATCH /employers/me — update settings + optional address upsert
  server.patch('/me', {
    schema: {
      tags: ['employers'],
      summary: 'Update employer settings',
      body: UpdateEmployerSchema,
      response: { 200: EmployerSettingsResponseSchema },
    },
    preHandler: [requireRole(EMPLOYER_ROLES)],
  }, async (req, reply) => {
    const ctx = await getEmployerContext(app, req.authUser!.id, reply)
    if (!ctx) return undefined
    const isAdmin = await requireEmployerAdmin(app, req.authUser!.id, ctx.employerId, reply)
    if (!isAdmin) return undefined

    const { address, ...rest } = req.body

    await app.prisma.employer.update({
      where: { id: ctx.employerId },
      data: {
        ...(rest.companyName !== undefined ? { companyName: rest.companyName } : {}),
        ...(rest.lraRegistrationNumber !== undefined ? { lraRegistrationNumber: rest.lraRegistrationNumber } : {}),
        ...(rest.sectorId !== undefined ? { sectorId: rest.sectorId } : {}),
        ...(rest.stateId !== undefined ? { stateId: Number(rest.stateId) } : {}),
        ...(rest.primaryContactName !== undefined ? { primaryContactName: rest.primaryContactName } : {}),
        ...(rest.primaryContactEmail !== undefined ? { primaryContactEmail: rest.primaryContactEmail } : {}),
        ...(rest.primaryContactPhone !== undefined ? { primaryContactPhone: rest.primaryContactPhone } : {}),
        ...(rest.vacationJobHosting !== undefined ? { vacationJobHosting: rest.vacationJobHosting } : {}),
        ...(rest.vacationJobDonating !== undefined ? { vacationJobDonating: rest.vacationJobDonating } : {}),
      },
    })

    if (address) {
      const existing = await app.prisma.address.findUnique({
        where: { employerId: ctx.employerId },
      })
      if (existing) {
        await app.prisma.address.update({
          where: { employerId: ctx.employerId },
          data: {
            countryId: address.countryId,
            ...(address.stateId !== undefined ? { stateId: address.stateId } : {}),
            ...(address.cityId !== undefined ? { cityId: address.cityId } : {}),
            ...(address.addressLine1 !== undefined ? { addressLine1: address.addressLine1 } : {}),
            ...(address.addressLine2 !== undefined ? { addressLine2: address.addressLine2 } : {}),
          },
        })
      } else {
        await app.prisma.address.create({
          data: {
            employerId: ctx.employerId,
            countryId: address.countryId,
            stateId: address.stateId ?? null,
            cityId: address.cityId ?? null,
            addressLine1: address.addressLine1 ?? null,
            addressLine2: address.addressLine2 ?? null,
          },
        })
      }
    }

    return getEmployerSettings(app, ctx.employerId, reply)
  })

  // GET /employers/me/users — list members + pending invites
  server.get('/me/users', {
    schema: {
      tags: ['employers'],
      summary: 'List team members including pending invites',
      response: { 200: EmployerUserListResponseSchema },
    },
    preHandler: [requireRole(EMPLOYER_ROLES)],
  }, async (req, reply) => {
    const ctx = await getEmployerContext(app, req.authUser!.id, reply)
    if (!ctx) return undefined

    const [members, pendingInvites] = await Promise.all([
      app.prisma.employerUser.findMany({
        where: { employerId: ctx.employerId },
        include: { user: { select: { email: true, fullName: true } } },
        orderBy: { createdAt: 'asc' },
      }),
      app.prisma.employerInviteToken.findMany({
        where: {
          employerId: ctx.employerId,
          acceptedAt: null,
          expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: 'asc' },
      }),
    ])

    type EURole = 'ADMIN' | 'HR'

    const memberItems = members.map((m) => ({
      id: m.id,
      userId: m.userId,
      email: m.user.email ?? '',
      fullName: m.user.fullName ?? null,
      role: m.role as EURole,
      status: (m.isActive ? 'ACTIVE' : 'INACTIVE') as 'ACTIVE' | 'INACTIVE',
      invitedAt: m.invitedAt?.toISOString() ?? null,
      acceptedAt: m.acceptedAt?.toISOString() ?? null,
      createdAt: m.createdAt.toISOString(),
    }))

    const inviteItems = pendingInvites.map((t) => ({
      id: t.id,
      userId: null as string | null,
      email: t.email,
      fullName: null as string | null,
      role: t.role as EURole,
      status: 'PENDING' as const,
      invitedAt: t.createdAt.toISOString(),
      acceptedAt: null as string | null,
      createdAt: t.createdAt.toISOString(),
    }))

    const data = [...memberItems, ...inviteItems]
    return {
      data,
      pagination: { nextCursor: null, hasMore: false, total: data.length },
    }
  })

  // POST /employers/me/users/invite
  server.post('/me/users/invite', {
    schema: {
      tags: ['employers'],
      summary: 'Invite a new team member by email',
      body: InviteEmployerUserSchema,
      response: { 201: MessageResponseSchema },
    },
    preHandler: [requireRole(EMPLOYER_ROLES)],
  }, async (req, reply) => {
    const ctx = await getEmployerContext(app, req.authUser!.id, reply)
    if (!ctx) return undefined
    const isAdmin = await requireEmployerAdmin(app, req.authUser!.id, ctx.employerId, reply)
    if (!isAdmin) return undefined

    const { email, role } = req.body

    const existingMember = await app.prisma.employerUser.findFirst({
      where: { employerId: ctx.employerId, isActive: true, user: { email } },
    })
    if (existingMember) return reply.conflict('This email is already an active team member')

    const existingInvite = await app.prisma.employerInviteToken.findFirst({
      where: { employerId: ctx.employerId, email, acceptedAt: null, expiresAt: { gt: new Date() } },
    })
    if (existingInvite) return reply.conflict('A pending invite already exists for this email')

    const employer = await app.prisma.employer.findUnique({
      where: { id: ctx.employerId },
      select: { companyName: true },
    })

    const rawToken = randomBytes(32).toString('hex')
    const tokenHash = sha256(rawToken)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    await app.prisma.employerInviteToken.create({
      data: { employerId: ctx.employerId, email, role, tokenHash, expiresAt, invitedByUserId: req.authUser!.id },
    })

    const acceptLink = `${env.WEB_APP_URL}/accept-invite?token=${rawToken}`
    await app.notify('EMAIL' as DeliveryType, {
      to: email,
      subject: `You're invited to join ${employer!.companyName} on Quola`,
      body: `You have been invited to join ${employer!.companyName} on Quola as ${role === 'ADMIN' ? 'an Admin' : 'HR'}.\n\nAccept your invitation: ${acceptLink}\n\nThis link expires in 7 days.`,
    })

    return reply.status(201).send({ message: 'Invitation sent' })
  })

  // POST /employers/me/invites/:inviteId/resend
  server.post('/me/invites/:inviteId/resend', {
    schema: {
      tags: ['employers'],
      summary: 'Resend a pending invite (rotates token + bumps expiry)',
      response: { 200: MessageResponseSchema },
    },
    preHandler: [requireRole(EMPLOYER_ROLES)],
  }, async (req, reply) => {
    const ctx = await getEmployerContext(app, req.authUser!.id, reply)
    if (!ctx) return undefined
    const isAdmin = await requireEmployerAdmin(app, req.authUser!.id, ctx.employerId, reply)
    if (!isAdmin) return undefined

    const { inviteId } = req.params as { inviteId: string }
    const invite = await app.prisma.employerInviteToken.findFirst({
      where: { id: inviteId, employerId: ctx.employerId, acceptedAt: null },
    })
    if (!invite) return reply.notFound('Pending invite not found')

    const employer = await app.prisma.employer.findUnique({
      where: { id: ctx.employerId },
      select: { companyName: true },
    })

    const rawToken = randomBytes(32).toString('hex')
    const tokenHash = sha256(rawToken)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    await app.prisma.employerInviteToken.update({
      where: { id: inviteId },
      data: { tokenHash, expiresAt },
    })

    const acceptLink = `${env.WEB_APP_URL}/accept-invite?token=${rawToken}`
    await app.notify('EMAIL' as DeliveryType, {
      to: invite.email,
      subject: `You're invited to join ${employer!.companyName} on Quola`,
      body: `You have been invited to join ${employer!.companyName} on Quola as ${invite.role === 'ADMIN' ? 'an Admin' : 'HR'}.\n\nAccept your invitation: ${acceptLink}\n\nThis link expires in 7 days.`,
    })

    return { message: 'Invitation resent' }
  })

  // DELETE /employers/me/invites/:inviteId — revoke
  server.delete('/me/invites/:inviteId', {
    schema: {
      tags: ['employers'],
      summary: 'Revoke a pending invite',
      response: { 200: MessageResponseSchema },
    },
    preHandler: [requireRole(EMPLOYER_ROLES)],
  }, async (req, reply) => {
    const ctx = await getEmployerContext(app, req.authUser!.id, reply)
    if (!ctx) return undefined
    const isAdmin = await requireEmployerAdmin(app, req.authUser!.id, ctx.employerId, reply)
    if (!isAdmin) return undefined

    const { inviteId } = req.params as { inviteId: string }
    const invite = await app.prisma.employerInviteToken.findFirst({
      where: { id: inviteId, employerId: ctx.employerId, acceptedAt: null },
    })
    if (!invite) return reply.notFound('Pending invite not found')

    await app.prisma.employerInviteToken.delete({ where: { id: inviteId } })
    return { message: 'Invite revoked' }
  })

  // PATCH /employers/me/users/:userId/role
  server.patch('/me/users/:userId/role', {
    schema: {
      tags: ['employers'],
      summary: 'Update a team member role',
      body: UpdateEmployerUserRoleSchema,
      response: { 200: MessageResponseSchema },
    },
    preHandler: [requireRole(EMPLOYER_ROLES)],
  }, async (req, reply) => {
    const ctx = await getEmployerContext(app, req.authUser!.id, reply)
    if (!ctx) return undefined
    const isAdmin = await requireEmployerAdmin(app, req.authUser!.id, ctx.employerId, reply)
    if (!isAdmin) return undefined

    const { userId } = req.params as { userId: string }
    const { role } = req.body

    const target = await app.prisma.employerUser.findFirst({
      where: { userId, employerId: ctx.employerId, isActive: true },
    })
    if (!target) return reply.notFound('Team member not found')

    // Block downgrading the last ADMIN
    if (target.role === 'ADMIN' && role !== 'ADMIN') {
      const adminCount = await app.prisma.employerUser.count({
        where: { employerId: ctx.employerId, isActive: true, role: 'ADMIN' },
      })
      if (adminCount <= 1) return reply.badRequest('Cannot remove the last admin from this employer')
    }

    await app.prisma.employerUser.update({ where: { id: target.id }, data: { role } })
    return { message: 'Role updated' }
  })

  // DELETE /employers/me/users/:userId — soft delete
  server.delete('/me/users/:userId', {
    schema: {
      tags: ['employers'],
      summary: 'Remove a team member (soft delete)',
      response: { 200: MessageResponseSchema },
    },
    preHandler: [requireRole(EMPLOYER_ROLES)],
  }, async (req, reply) => {
    const ctx = await getEmployerContext(app, req.authUser!.id, reply)
    if (!ctx) return undefined
    const isAdmin = await requireEmployerAdmin(app, req.authUser!.id, ctx.employerId, reply)
    if (!isAdmin) return undefined

    const { userId } = req.params as { userId: string }
    const target = await app.prisma.employerUser.findFirst({
      where: { userId, employerId: ctx.employerId, isActive: true },
    })
    if (!target) return reply.notFound('Team member not found')

    // Block self-removal if last admin
    if (userId === req.authUser!.id && target.role === 'ADMIN') {
      const adminCount = await app.prisma.employerUser.count({
        where: { employerId: ctx.employerId, isActive: true, role: 'ADMIN' },
      })
      if (adminCount <= 1) return reply.badRequest('Cannot remove yourself — you are the last admin')
    }

    await app.prisma.employerUser.update({ where: { id: target.id }, data: { isActive: false } })
    return { message: 'Team member removed' }
  })
}

// ── Public module: POST /invites/accept ───────────────────────────────────────
export const inviteAcceptModule: FastifyPluginAsync = async (app) => {
  const server = app.withTypeProvider<ZodTypeProvider>()

  server.post('/accept', {
    schema: {
      tags: ['employers'],
      summary: 'Accept an employer invite (public)',
      body: AcceptInviteSchema,
      response: { 200: AuthTokenResponseSchema },
    },
  }, async (req, reply) => {
    const { token, fullName, password } = req.body

    const tokenHash = sha256(token)
    const invite = await app.prisma.employerInviteToken.findUnique({
      where: { tokenHash },
      include: { employer: { select: { companyName: true } } },
    })

    if (!invite) return reply.badRequest('Invalid invite token')
    if (invite.expiresAt < new Date()) return reply.badRequest('Invite token has expired')
    if (invite.acceptedAt) return reply.badRequest('Invite has already been accepted')

    const userRole: UserRole = invite.role === 'ADMIN' ? 'EMPLOYER_ADMIN' : 'EMPLOYER_HR'

    const existingUser = await app.prisma.user.findUnique({ where: { email: invite.email } })

    let user: { id: string; role: UserRole }

    if (existingUser) {
      user = { id: existingUser.id, role: existingUser.role as UserRole }

      await app.prisma.employerUser.upsert({
        where: { employerId_userId: { employerId: invite.employerId, userId: existingUser.id } },
        update: { isActive: true, role: invite.role, acceptedAt: new Date() },
        create: {
          employerId: invite.employerId,
          userId: existingUser.id,
          role: invite.role,
          isActive: true,
          invitedByUserId: invite.invitedByUserId,
          invitedAt: invite.createdAt,
          acceptedAt: new Date(),
        },
      })
    } else {
      if (!fullName || !password) {
        return reply.badRequest('fullName and password are required for new users')
      }

      const complexityErrors = complexityValidator.validate(password)
      if (complexityErrors.length > 0) {
        return reply.badRequest('Password must contain: ' + complexityErrors.join('; '))
      }

      const passwordHash = await bcrypt.hash(password, 12)

      const newUser = await app.prisma.$transaction(async (tx) => {
        const u = await tx.user.create({
          data: {
            email: invite.email,
            passwordHash,
            role: userRole,
            fullName,
            isEmailVerified: true,
          },
        })
        await tx.employerUser.create({
          data: {
            employerId: invite.employerId,
            userId: u.id,
            role: invite.role,
            isActive: true,
            invitedByUserId: invite.invitedByUserId,
            invitedAt: invite.createdAt,
            acceptedAt: new Date(),
          },
        })
        await tx.passwordHistory.create({ data: { userId: u.id, passwordHash } })
        return u
      })

      user = { id: newUser.id, role: userRole }
    }

    await app.prisma.employerInviteToken.update({
      where: { id: invite.id },
      data: { acceptedAt: new Date() },
    })

    return issueTokens(app, reply, req, user)
  })
}

export default employersModule
