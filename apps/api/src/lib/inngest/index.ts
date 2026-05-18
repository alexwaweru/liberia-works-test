export { inngest } from './client.js'
import { matchingFn } from './functions/matching.js'
import { sendSmsFn, sendWhatsappFn } from './functions/outbound-messaging.js'
import { inboundMessagingFn } from './functions/inbound-messaging.js'
import { cvParseFn } from './functions/cv-parse.js'
import { notificationsFn } from './functions/notifications.js'
import { messageRetentionPurgeFn, remindersFn } from './functions/reminders.js'

export const inngestFunctions = [
  matchingFn,
  sendSmsFn,
  sendWhatsappFn,
  inboundMessagingFn,
  cvParseFn,
  notificationsFn,
  messageRetentionPurgeFn,
  remindersFn,
]
