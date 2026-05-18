import { MessageDeliveryStatus } from '@prisma/client'
import { NonRetriableError } from 'inngest'
import { inngest } from '../client.js'
import { getPrisma } from '../../prisma.js'
import { env } from '../../../config/env.js'
import {
  AfricasTalkingProvider,
  TwilioProvider,
  type MessagingProvider,
} from '../../../modules/messaging/providers/index.js'

const providers: MessagingProvider[] = []

if (env.AT_API_KEY && env.AT_USERNAME) {
  providers.push(
    new AfricasTalkingProvider({
      apiKey: env.AT_API_KEY,
      username: env.AT_USERNAME,
      ...(env.AT_SENDER_ID !== undefined ? { senderId: env.AT_SENDER_ID } : {}),
    }),
  )
}

if (env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN) {
  providers.push(
    new TwilioProvider({
      accountSid: env.TWILIO_ACCOUNT_SID,
      authToken: env.TWILIO_AUTH_TOKEN,
      fromSms: env.TWILIO_FROM_SMS ?? '',
      fromWhatsapp: env.TWILIO_FROM_WHATSAPP ?? '',
    }),
  )
}

async function deliver(
  channel: 'SMS' | 'WHATSAPP',
  phoneNumber: string,
  body: string,
  messageEventId: string,
) {
  const prisma = getPrisma()

  if (!body) throw new NonRetriableError('Message body is required')

  const primary = providers.find((p) => p.name === 'africastalking')
  const standby = providers.find((p) => p.name === 'twilio')

  let result
  let usedProvider = ''

  try {
    if (!primary) {
      throw new NonRetriableError(
        "Primary messaging provider (Africa's Talking) not configured",
      )
    }
    result = await primary.sendMessage({ to: phoneNumber, body, channel })
    usedProvider = 'africastalking'
  } catch (err) {
    console.error(`Primary provider failed, attempting standby: ${(err as Error).message}`)
    if (!standby) throw err
    result = await standby.sendMessage({ to: phoneNumber, body, channel })
    usedProvider = 'twilio'
  }

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
}

async function markFailed(messageEventId: string) {
  await getPrisma()
    .messageEvent.update({
      where: { id: messageEventId },
      data: { deliveryStatus: MessageDeliveryStatus.FAILED },
    })
    .catch(console.error)
}

export const sendSmsFn = inngest.createFunction(
  {
    id: 'outbound-send-sms',
    name: 'Send outbound SMS',
    retries: 3,
    concurrency: { limit: 10 },
    onFailure: async ({ event }) => {
      await markFailed(event.data.event.data.messageEventId)
    },
  },
  { event: 'messaging/outbound.send-sms' },
  async ({ event }) =>
    deliver('SMS', event.data.phoneNumber, event.data.body, event.data.messageEventId),
)

export const sendWhatsappFn = inngest.createFunction(
  {
    id: 'outbound-send-whatsapp',
    name: 'Send outbound WhatsApp',
    retries: 3,
    concurrency: { limit: 10 },
    onFailure: async ({ event }) => {
      await markFailed(event.data.event.data.messageEventId)
    },
  },
  { event: 'messaging/outbound.send-whatsapp' },
  async ({ event }) =>
    deliver(
      'WHATSAPP',
      event.data.phoneNumber,
      event.data.body,
      event.data.messageEventId,
    ),
)
