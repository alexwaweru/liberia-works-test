import { Worker } from 'bullmq'
import { Redis } from 'ioredis'
import { PrismaClient, MessageDeliveryStatus } from '@prisma/client'
import { env } from '../config/env.js'
import { 
  AfricasTalkingProvider, 
  TwilioProvider, 
  MessagingProvider 
} from '../modules/messaging/providers/index.js'

const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
})

import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const pool = new pg.Pool({ connectionString: env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

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

// Initialize Providers
const providers: MessagingProvider[] = []

if (env.AT_API_KEY && env.AT_USERNAME) {
  providers.push(new AfricasTalkingProvider({
    apiKey: env.AT_API_KEY,
    username: env.AT_USERNAME,
    senderId: env.AT_SENDER_ID,
  }))
}

if (env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN) {
  providers.push(new TwilioProvider({
    accountSid: env.TWILIO_ACCOUNT_SID,
    authToken: env.TWILIO_AUTH_TOKEN,
    fromSms: env.TWILIO_FROM_SMS ?? '',
    fromWhatsapp: env.TWILIO_FROM_WHATSAPP ?? '',
  }))
}

const worker = new Worker<OutboundMessageJobData>(
  'outbound-messaging',
  async (job) => {
    const { phoneNumber, channel, body, messageEventId } = job.data
    
    if (!body) throw new Error('Message body is required')

    // 1. Get the primary provider (Africa's Talking)
    const primary = providers.find(p => p.name === 'africastalking')
    const standby = providers.find(p => p.name === 'twilio')

    let result;
    let usedProvider = '';

    try {
      if (!primary) throw new Error('Primary messaging provider (Africa\'s Talking) not configured')
      
      result = await primary.sendMessage({
        to: phoneNumber,
        body,
        channel: channel as any,
      })
      usedProvider = 'africastalking'
    } catch (err) {
      console.error(`Primary provider failed, attempting standby: ${(err as Error).message}`)
      
      if (standby) {
        result = await standby.sendMessage({
          to: phoneNumber,
          body,
          channel: channel as any,
        })
        usedProvider = 'twilio'
      } else {
        throw err // No standby available
      }
    }

    // 2. Update MessageEvent in DB
    await prisma.messageEvent.update({
      where: { id: messageEventId },
      data: {
        externalMessageId: result.externalMessageId,
        deliveryStatus: MessageDeliveryStatus.SENT,
        provider: usedProvider,
        deliveredAt: result.deliveredAt ?? new Date(),
      },
    })

    return { success: true, provider: usedProvider, externalId: result.externalMessageId }
  },
  { connection: redis, concurrency: 10 },
)

worker.on('failed', async (job, err) => {
  console.error({ jobId: job?.id, err }, 'Outbound message failed after all retries')
  if (job) {
    await prisma.messageEvent.update({
      where: { id: job.data.messageEventId },
      data: {
        deliveryStatus: MessageDeliveryStatus.FAILED,
      },
    }).catch(console.error)
  }
})

process.on('SIGTERM', async () => {
  await worker.close()
  await prisma.$disconnect()
  await redis.quit()
})
