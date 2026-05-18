import { EventSchemas, Inngest } from 'inngest'
import { env } from '../../config/env.js'

type ReminderType =
  | 'WORKFORCE_RETURN_30D'
  | 'WORKFORCE_RETURN_14D'
  | 'WORKFORCE_RETURN_7D'
  | 'WORKFORCE_RETURN_OVERDUE'
  | 'PLACEMENT_CONFIRMATION_EXPIRY'
  | 'MESSAGE_RETENTION_PURGE'

type OutboundMessagePayload = {
  phoneNumber: string
  body: string
  messageEventId: string
  requestId?: string
}

type Events = {
  'matching/trigger': {
    data: { cycleId: string; requestId?: string }
  }
  'messaging/outbound.send-sms': { data: OutboundMessagePayload }
  'messaging/outbound.send-whatsapp': { data: OutboundMessagePayload }
  'messaging/inbound.received': {
    data: {
      from: string
      text: string
      channel: 'SMS' | 'WHATSAPP'
      messageEventId: string
    }
  }
  'cv-parse/start': {
    data: {
      cvParseJobId: string
      documentId: string
      individualId: string
      storageKey: string
      requestId?: string
    }
  }
  'notifications/dispatch': {
    data: {
      userId: string
      type: string
      title: string
      body: string
      metadata?: Record<string, unknown>
      requestId?: string
    }
  }
  'reminders/run': { data: { type: ReminderType } }
}

export const inngest = new Inngest({
  id: 'liberia-works',
  schemas: new EventSchemas().fromRecord<Events>(),
  ...(env.INNGEST_EVENT_KEY ? { eventKey: env.INNGEST_EVENT_KEY } : {}),
})

export type { ReminderType }
