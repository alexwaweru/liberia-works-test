import { inngest } from '../client.js'
import { BotRouter } from '../../../modules/messaging/bot/router.js'

export const inboundMessagingFn = inngest.createFunction(
  {
    id: 'inbound-messaging',
    name: 'Process inbound message via BotRouter',
    concurrency: { limit: 5 },
  },
  { event: 'messaging/inbound.received' },
  async ({ event, logger }) => {
    const { from, text } = event.data
    logger.info({ from, text }, 'Processing inbound message via BotRouter')
    await BotRouter.handle(from, text)
  },
)
