import fp from 'fastify-plugin'
import type { FastifyPluginAsync } from 'fastify'

const IDEMPOTENCY_TTL = 60 * 60 * 24 // 24 hours in seconds

/**
 * Redis-backed idempotency for mutating endpoints.
 * Clients send an `Idempotency-Key` header; duplicate requests within 24h
 * return the original cached response.
 */
const idempotencyPlugin: FastifyPluginAsync = async (app) => {
  // Before handler: return cached response if key was already used
  app.addHook('preHandler', async (request, reply) => {
    const key = request.headers['idempotency-key']
    if (!key || typeof key !== 'string') return undefined
    if (!['POST', 'PUT', 'PATCH'].includes(request.method)) return undefined

    const cacheKey = `idempotency:${key}`
    const cached = await app.redis.get(cacheKey)
    if (!cached) return undefined

    const { statusCode, body } = JSON.parse(cached) as {
      statusCode: number
      body: unknown
    }
    
    // Skip replaying 102 (in-progress marker) — let the handler run
    if (statusCode === 102) return undefined

    return reply.code(statusCode).send(body)
  })

  // Before response is sent: cache the result for future duplicate requests
  app.addHook('onSend', async (request, reply, payload) => {
    const key = request.headers['idempotency-key']
    if (!key || typeof key !== 'string') return payload
    if (!['POST', 'PUT', 'PATCH'].includes(request.method)) return payload

    const cacheKey = `idempotency:${key}`
    await app.redis.setex(
      cacheKey,
      IDEMPOTENCY_TTL,
      JSON.stringify({ statusCode: reply.statusCode, body: payload }),
    )
    return payload
  })
}

export default fp(idempotencyPlugin, { name: 'idempotency', dependencies: ['redis'] })
