import type { IncomingMessage, ServerResponse } from 'node:http'
import { buildApp } from '../src/server.js'

// The configured Fastify instance is cached across invocations on the same
// serverless container (`buildApp()` opens Prisma + Redis connections, so we
// must not call it twice).
let appPromise: ReturnType<typeof buildApp> | null = null

async function getApp() {
  if (!appPromise) {
    appPromise = buildApp().then(async (app) => {
      await app.ready()
      return app
    })
  }
  return appPromise
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const app = await getApp()
  app.server.emit('request', req, res)
}
