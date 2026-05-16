import type { FastifyPluginAsync } from 'fastify'
import { Queue } from 'bullmq'
import { env } from '../../config/env.js'
import { MessageDirection, MessageChannel, MessageDeliveryStatus } from '@prisma/client'
import { WebhookSecurity } from './security.js'

/**
 * Messaging module — Africa's Talking adapters, inbound webhook, WhatsApp bot flows.
 */

// Helper: Queue for outbound messages
const outboundQueue = new Queue('outbound-messaging', {
  connection: {
    url: env.REDIS_URL
  }
})

// Helper: Queue for inbound processing (Bot logic)
const inboundQueue = new Queue('inbound-messaging', {
  connection: { url: env.REDIS_URL }
})

export const messagingModule: FastifyPluginAsync = async (app) => {
  
  /**
   * POST /africastalking/inbound
   * Handles incoming SMS from Africa's Talking.
   */
  app.post('/africastalking/inbound', async (req, reply) => {
    // In production, verify the source (IP whitelist or HMAC if configured)
    const body = req.body as any
    const { from, to, text, date, id } = body

    app.log.info({ from, text }, 'Received Africa\'s Talking SMS')

    // Log the inbound message
    const event = await app.prisma.messageEvent.create({
      data: {
        phoneNumber: from,
        direction: MessageDirection.INBOUND,
        channel: MessageChannel.SMS,
        messageBody: text,
        externalMessageId: id,
        provider: 'africastalking',
        retentionExpiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      }
    })

    // Enqueue for Bot Processing
    await inboundQueue.add('process-inbound', {
      from,
      text,
      channel: 'SMS',
      messageEventId: event.id,
    })

    return reply.status(200).send('OK')
  })

  /**
   * POST /meta/waba
   * Handles incoming WhatsApp messages and status updates from Meta.
   */
  app.post('/meta/waba', async (req, reply) => {
    const signature = req.headers['x-hub-signature-256'] as string
    
    // 1. Verify Signature (Security)
    if (env.NODE_ENV === 'production' && !WebhookSecurity.verifyMetaSignature(signature, env.JWT_SECRET, JSON.stringify(req.body))) {
      return reply.status(401).send('Unauthorized')
    }

    const body = req.body as any

    // Handle Status Updates (Delivered, Read, etc.)
    if (body.entry?.[0]?.changes?.[0]?.value?.statuses) {
      const status = body.entry[0].changes[0].value.statuses[0]
      await app.prisma.messageEvent.updateMany({
        where: { externalMessageId: status.id },
        data: { 
          deliveryStatus: status.status.toUpperCase() as MessageDeliveryStatus,
          deliveredAt: new Date(),
        }
      })
      return reply.status(200).send('OK')
    }

    // Handle Incoming Messages
    const message = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]
    if (message) {
      const from = message.from
      const text = message.text?.body || ''

      const event = await app.prisma.messageEvent.create({
        data: {
          phoneNumber: from,
          direction: MessageDirection.INBOUND,
          channel: MessageChannel.WHATSAPP,
          messageBody: text,
          externalMessageId: message.id,
          provider: 'africastalking',
          retentionExpiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        }
      })

      await inboundQueue.add('process-inbound', {
        from,
        text,
        channel: 'WHATSAPP',
        messageEventId: event.id,
      })
    }

    return reply.status(200).send('OK')
  })

  /**
   * GET /meta/waba
   * Webhook verification for Meta.
   */
  app.get('/meta/waba', async (req, reply) => {
    const query = req.query as Record<string, string | undefined>
    const mode = query['hub.mode']
    const token = query['hub.verify_token']
    const challenge = query['hub.challenge']

    if (mode === 'subscribe' && token === env.JWT_SECRET) {
      return reply.status(200).send(challenge)
    }
    return reply.status(403).send('Forbidden')
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
