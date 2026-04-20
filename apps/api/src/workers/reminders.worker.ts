/**
 * Reminders Worker — Phase 2 workforce-return cascade and other scheduled reminders.
 *
 * Implemented as BullMQ repeatable jobs (replaces Celery Beat).
 *
 * Schedules (Phase 2):
 *   - Workforce return reminders: 30/14/7-day before deadline, then overdue
 *   - Permit confirmation deadline: 48h after match
 *   - Message body anonymisation: check retentionExpiresAt daily
 *
 * Queue: reminders
 */

import { Worker, Queue } from 'bullmq'
import { Redis } from 'ioredis'

const redis = new Redis(process.env['REDIS_URL'] ?? 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
})

export type ReminderType =
  | 'WORKFORCE_RETURN_30D'
  | 'WORKFORCE_RETURN_14D'
  | 'WORKFORCE_RETURN_7D'
  | 'WORKFORCE_RETURN_OVERDUE'
  | 'PLACEMENT_CONFIRMATION_EXPIRY'
  | 'MESSAGE_RETENTION_PURGE'

export interface ReminderJobData {
  type: ReminderType
}

const remindersQueue = new Queue<ReminderJobData>('reminders', { connection: redis })

// Register repeatable jobs on startup
async function registerRepeatableJobs() {
  // Daily message retention purge — Phase 1
  await remindersQueue.add(
    'message-retention-purge',
    { type: 'MESSAGE_RETENTION_PURGE' },
    { repeat: { pattern: '0 2 * * *' } }, // 02:00 UTC daily
  )

  // TODO: add workforce-return cascade repeatable jobs in Phase 2
}

registerRepeatableJobs().catch(console.error)

const worker = new Worker<ReminderJobData>(
  'reminders',
  async (job) => {
    const { type } = job.data
    console.log({ type }, 'Running reminder job')

    switch (type) {
      case 'MESSAGE_RETENTION_PURGE':
        // TODO: anonymise MessageEvent.messageBody where retentionExpiresAt < now()
        break
      default:
        // Phase 2 reminder types
        break
    }
  },
  { connection: redis, concurrency: 1 },
)

worker.on('failed', (job, err) => {
  console.error({ jobId: job?.id, err }, 'Reminder job failed')
})

process.on('SIGTERM', async () => {
  await worker.close()
  await remindersQueue.close()
  await redis.quit()
})
