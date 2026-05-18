import { inngest } from '../client.js'

export const notificationsFn = inngest.createFunction(
  {
    id: 'notifications-dispatch',
    name: 'Dispatch notification (fan-out)',
    concurrency: { limit: 20 },
  },
  { event: 'notifications/dispatch' },
  async ({ event, logger }) => {
    const { userId, type, title, body } = event.data
    logger.info({ userId, type, title, body }, 'Dispatching notification')
    // TODO:
    //  1. Load user's notification preferences from DB
    //  2. Create Notification record (in-app)
    //  3. If SMS/WhatsApp preference: send `messaging/outbound.send-*` event
    //  4. If email preference: send via Resend
    throw new Error('Notifications function not yet implemented')
  },
)
