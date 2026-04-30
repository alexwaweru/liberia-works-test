import { Worker } from 'bullmq'
import { Redis } from 'ioredis'
import { env } from '../config/env.js'
import { BotRouter } from '../modules/messaging/bot/router.js'

const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
})

export interface InboundMessageJobData {
  from: string
  text: string
  channel: 'SMS' | 'WHATSAPP'
  messageEventId: string
}

const worker = new Worker<InboundMessageJobData>(
  'inbound-messaging',
  async (job) => {
    const { from, text } = job.data
    console.log({ from, text }, 'Processing inbound message via BotRouter')

    await BotRouter.handle(from, text)
  },
  { connection: redis, concurrency: 5 },
)

worker.on('failed', (job, err) => {
  console.error({ jobId: job?.id, err }, 'Inbound message processing failed')
})

process.on('SIGTERM', async () => {
  await worker.close()
  await redis.quit()
})
