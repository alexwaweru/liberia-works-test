/**
 * Notifications Worker — fan-out dispatcher.
 *
 * Resolves user channel preferences, creates Notification DB record,
 * then enqueues outbound-messaging jobs for SMS/WhatsApp/email.
 *
 * Queue: notifications
 */

import { Worker, Queue } from 'bullmq'
import { Redis } from 'ioredis'
import type { OutboundMessageJobData } from './outbound-messaging.worker.js'

const redis = new Redis(process.env['REDIS_URL'] ?? 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
})

const messagingQueue = new Queue<OutboundMessageJobData>('outbound-messaging', {
  connection: redis,
})

export interface NotificationJobData {
  userId: string
  type: string
  title: string
  body: string
  metadata?: Record<string, unknown>
  requestId?: string
}

const worker = new Worker<NotificationJobData>(
  'notifications',
  async (job) => {
    const { userId, type, title, body } = job.data
    console.log({ userId, type, title, body }, 'Dispatching notification')

    // TODO:
    // 1. Load user's notification preferences from DB
    // 2. Create Notification record (in-app)
    // 3. If SMS/WhatsApp preference: enqueue outbound-messaging job
    // 4. If email preference: send via Resend
    throw new Error('Notifications worker not yet implemented')
  },
  { connection: redis, concurrency: 20 },
)

worker.on('failed', (job, err) => {
  console.error({ jobId: job?.id, err }, 'Notification dispatch failed')
})

process.on('SIGTERM', async () => {
  await worker.close()
  await messagingQueue.close()
  await redis.quit()
})
