import fp from 'fastify-plugin'
import { Redis } from 'ioredis'
import type { FastifyPluginAsync } from 'fastify'
import { env } from '../config/env.js'

declare module 'fastify' {
  interface FastifyInstance {
    redis: Redis
  }
}

const redisPlugin: FastifyPluginAsync = async (app) => {
  const redis = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
  })

  redis.on('error', (err: Error) => app.log.error({ err }, 'Redis connection error'))
  redis.on('connect', () => app.log.info('Redis connected'))

  app.decorate('redis', redis)
  app.addHook('onClose', async () => {
    await redis.quit()
  })
}

export default fp(redisPlugin, { name: 'redis' })
