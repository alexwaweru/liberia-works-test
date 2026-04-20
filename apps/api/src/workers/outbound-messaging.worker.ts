/**
 * Outbound Messaging Worker — SMS / WhatsApp sends via Africa's Talking with retries.
 *
 * Queue: outbound-messaging
 * Handles: OTP delivery, application notifications, permit status updates, etc.
 *
 * Run as a separate Node process (or combined with notifications worker at Phase 1 scale).
 */

import { Worker } from 'bullmq'
import { Redis } from 'ioredis'

const redis = new Redis(process.env['REDIS_URL'] ?? 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
})

export type MessageChannel = 'SMS' | 'WHATSAPP'

export interface OutboundMessageJobData {
  phoneNumber: string
  channel: MessageChannel
  templateName?: string
  body?: string
  templateParams?: Record<string, string>
  messageEventId: string
  requestId?: string
}

const worker = new Worker<OutboundMessageJobData>(
  'outbound-messaging',
  async (job) => {
    const { phoneNumber, channel, templateName, body, messageEventId } = job.data
    console.log({ messageEventId, phoneNumber, channel, templateName }, 'Sending message')

    // TODO: call Africa's Talking SDK (SMS or WABA) or Twilio fallback
    // On success: update MessageEvent.deliveryStatus = SENT
    // Provider message ID → MessageEvent.externalMessageId for webhook idempotency
    throw new Error('Outbound messaging worker not yet implemented')
  },
  { connection: redis, concurrency: 10 },
)

worker.on('failed', (job, err) => {
  console.error({ jobId: job?.id, err }, 'Outbound message failed after all retries')
})

process.on('SIGTERM', async () => {
  await worker.close()
  await redis.quit()
})
