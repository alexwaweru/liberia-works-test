import fp from 'fastify-plugin'
import type { FastifyPluginAsync } from 'fastify'
import type { Prisma } from '@prisma/client'
import type { UserRole } from '@liberia-works/shared-types'

export interface AuditRecordParams {
  actorUserId: string | null
  actorRole: UserRole | 'SYSTEM'
  action: string
  targetTable?: string | undefined
  targetId?: string | undefined
  beforeData?: Record<string, unknown> | undefined
  afterData?: Record<string, unknown> | undefined
  ipAddress?: string | undefined
  userAgent?: string | undefined
  requestId?: string | undefined
}

declare module 'fastify' {
  interface FastifyInstance {
    audit: {
      record: (params: AuditRecordParams) => Promise<void>
    }
  }
}

const auditPlugin: FastifyPluginAsync = async (app) => {
  const audit = {
    async record(params: AuditRecordParams): Promise<void> {
      try {
        await app.prisma.auditLog.create({
          data: {
            actorUserId: params.actorUserId,
            actorRole: params.actorRole,
            action: params.action,
            targetTable: params.targetTable ?? null,
            targetId: params.targetId ?? null,
            ...(params.beforeData !== undefined ? { beforeData: params.beforeData as Prisma.InputJsonValue } : {}),
            ...(params.afterData !== undefined ? { afterData: params.afterData as Prisma.InputJsonValue } : {}),
            ipAddress: params.ipAddress ?? null,
            userAgent: params.userAgent ?? null,
            requestId: params.requestId ?? null,
          },
        })
      } catch (err) {
        // Audit failure must never crash the application
        app.log.error({ err, action: params.action }, 'audit.record failed')
      }
    },
  }

  app.decorate('audit', audit)
}

export default fp(auditPlugin, { name: 'audit', dependencies: ['prisma'] })
