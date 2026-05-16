import fp from 'fastify-plugin'
import type { FastifyPluginAsync } from 'fastify'
import { SenderRegistry } from './registry.js'
import type { DeliveryType, Message } from './types.js'

declare module 'fastify' {
  interface FastifyInstance {
    senders: SenderRegistry
    notify(type: DeliveryType, message: Message): Promise<void>
  }
}

const notifyPlugin: FastifyPluginAsync = async (app) => {
  const registry = new SenderRegistry()
  app.decorate('senders', registry)
  app.decorate('notify', async function (type: DeliveryType, message: Message) {
    const sender = registry.resolve(type)
    await sender.send(type, message)
    if (sender.name === 'console') {
      app.log.info({ type, to: message.to, body: message.body }, 'DEV notification (no real sender configured)')
    }
  })
}

export default fp(notifyPlugin, { name: 'notify' })
