import Fastify from 'fastify'
import cookie from '@fastify/cookie'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import jwt from '@fastify/jwt'
import rateLimit from '@fastify/rate-limit'
import sensible from '@fastify/sensible'
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod'

import { env } from './config/env.js'

// ── Plugins ───────────────────────────────────────────────────────────────────
import prismaPlugin from './plugins/prisma.js'
import redisPlugin from './plugins/redis.js'
import authPlugin from './plugins/auth.js'
import swaggerPlugin from './plugins/swagger.js'
import idempotencyPlugin from './plugins/idempotency.js'
import auditPlugin from './plugins/audit.js'
import errorHandlerPlugin from './plugins/error-handler.js'

// ── Domain modules ────────────────────────────────────────────────────────────
import referenceModule from './modules/reference/index.js'
import accountsModule from './modules/accounts/index.js'
import individualsModule from './modules/individuals/index.js'
import employersModule from './modules/employers/index.js'
import documentsModule from './modules/documents/index.js'
import vacanciesModule from './modules/vacancies/index.js'
import applicationsModule from './modules/applications/index.js'
import workPermitsModule from './modules/work-permits/index.js'
import disputesModule from './modules/disputes/index.js'
import vacationJobsModule from './modules/vacation-jobs/index.js'
import messagingModule from './modules/messaging/index.js'
import notificationsModule from './modules/notifications/index.js'
import aiModule from './modules/ai/index.js'
import auditModule from './modules/audit/index.js'
import molModule from './modules/mol/index.js'

const app = Fastify({
  logger: {
    level: env.LOG_LEVEL,
    ...(env.NODE_ENV !== 'production' && { transport: { target: 'pino-pretty' } }),
  },
  genReqId: () => crypto.randomUUID(),
})

// Zod type provider — drives OpenAPI, runtime validation, and TypeScript types
app.setValidatorCompiler(validatorCompiler)
app.setSerializerCompiler(serializerCompiler)

// ── Core plugins (order matters) ──────────────────────────────────────────────
await app.register(errorHandlerPlugin)
await app.register(sensible)
await app.register(helmet)
await app.register(cors, {
  origin: env.ALLOWED_ORIGINS.split(','),
  credentials: true,
})
await app.register(cookie, { secret: env.JWT_SECRET })
await app.register(jwt, {
  secret: env.JWT_SECRET,
  cookie: { cookieName: 'access_token', signed: false },
  sign: { expiresIn: env.JWT_ACCESS_EXPIRES_IN },
})

// ── Infrastructure plugins ────────────────────────────────────────────────────
await app.register(prismaPlugin)
await app.register(redisPlugin)
await app.register(rateLimit, {
  redis: app.redis,
  max: 100,
  timeWindow: '1 minute',
})

// ── OpenAPI docs ──────────────────────────────────────────────────────────────
await app.register(swaggerPlugin)

// ── Application plugins ───────────────────────────────────────────────────────
await app.register(authPlugin)
await app.register(idempotencyPlugin)
await app.register(auditPlugin)

// ── Domain modules ────────────────────────────────────────────────────────────
await app.register(referenceModule,    { prefix: '/api/v1/reference' })
await app.register(accountsModule,     { prefix: '/api/v1/auth' })
await app.register(individualsModule,  { prefix: '/api/v1/individuals' })
await app.register(employersModule,    { prefix: '/api/v1/employers' })
await app.register(documentsModule,    { prefix: '/api/v1/documents' })
await app.register(vacanciesModule,    { prefix: '/api/v1/vacancies' })
await app.register(applicationsModule, { prefix: '/api/v1/applications' })
await app.register(workPermitsModule,  { prefix: '/api/v1/work-permits' })
await app.register(disputesModule,     { prefix: '/api/v1/disputes' })
await app.register(vacationJobsModule, { prefix: '/api/v1/vacation-jobs' })
await app.register(messagingModule,    { prefix: '/api/v1/webhooks' })
await app.register(notificationsModule,{ prefix: '/api/v1/notifications' })
await app.register(aiModule,           { prefix: '/api/v1/cv-parse-jobs' })
await app.register(auditModule,        { prefix: '/api/v1/audit-log' })
await app.register(molModule,          { prefix: '/api/v1/mol' })

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', async () => ({
  status: 'ok',
  timestamp: new Date().toISOString(),
  env: env.NODE_ENV,
}))

// ── Start ─────────────────────────────────────────────────────────────────────
try {
  await app.listen({ port: env.PORT, host: env.HOST })
} catch (err) {
  app.log.error(err)
  process.exit(1)
}
