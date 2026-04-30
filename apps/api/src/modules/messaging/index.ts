import type { FastifyPluginAsync } from 'fastify'
import { Queue } from 'bullmq'
import { env } from '../../config/env.js'
import { MessageDirection, MessageChannel, MessageDeliveryStatus } from '@prisma/client'

/**
 * Messaging module — Africa's Talking adapters, inbound webhook, WhatsApp bot flows.
 */

// Helper: Queue for outbound messages
const outboundQueue = new Queue('outbound-messaging', {
  connection: {
    url: env.REDIS_URL
  }
})

export const messagingModule: FastifyPluginAsync = async (app) => {
  // Webhook placeholders (Step 2)
  app.post('/africastalking/sms', async (req, reply) => {
     // TODO: Implement HMAC and inbound logic
     return reply.status(200).send('OK')
  })

  app.post('/meta/waba', async (req, reply) => {
     // TODO: Implement Meta WABA webhook
     return reply.status(200).send('OK')
  })
}

/**
 * Internal utility to send an SMS via Africa's Talking (Primary) or Twilio (Standby).
 */
export async function sendSms(params: { 
  to: string; 
  body: string; 
  userId?: string;
  templateName?: string;
  prisma: any;
}) {
  // 1. Create MessageEvent record (Audit/Retention)
  const event = await params.prisma.messageEvent.create({
    data: {
      userId: params.userId,
      phoneNumber: params.to,
      direction: MessageDirection.OUTBOUND,
      channel: MessageChannel.SMS,
      messageBody: params.body,
      templateName: params.templateName,
      deliveryStatus: MessageDeliveryStatus.QUEUED,
      provider: 'africastalking', // Default expected
      retentionExpiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
    }
  })

  // 2. Enqueue BullMQ job
  await outboundQueue.add('send-sms', {
    phoneNumber: params.to,
    channel: 'SMS',
    body: params.body,
    messageEventId: event.id,
    templateName: params.templateName,
  })

  return event.id
}

/**
 * Internal utility to send a WhatsApp message.
 */
export async function sendWhatsApp(params: { 
  to: string; 
  body: string; 
  userId?: string;
  templateName?: string;
  prisma: any;
}) {
  const event = await params.prisma.messageEvent.create({
    data: {
      userId: params.userId,
      phoneNumber: params.to,
      direction: MessageDirection.OUTBOUND,
      channel: MessageChannel.WHATSAPP,
      messageBody: params.body,
      templateName: params.templateName,
      deliveryStatus: MessageDeliveryStatus.QUEUED,
      provider: 'africastalking',
      retentionExpiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    }
  })

  await outboundQueue.add('send-whatsapp', {
    phoneNumber: params.to,
    channel: 'WHATSAPP',
    body: params.body,
    messageEventId: event.id,
    templateName: params.templateName,
  })

  return event.id
}

export default messagingModule
