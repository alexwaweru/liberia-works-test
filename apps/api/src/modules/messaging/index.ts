import type { FastifyPluginAsync } from 'fastify'

/**
 * Messaging module — Africa's Talking adapters, inbound webhook, WhatsApp bot flows.
 *
 * Inbound webhooks (HMAC verified, enqueue BullMQ job, return 200 immediately):
 *   POST /api/v1/webhooks/africastalking/sms
 *   POST /api/v1/webhooks/africastalking/delivery
 *   POST /api/v1/webhooks/meta/waba
 *
 * WhatsApp bot keywords (handled via inbound webhook):
 *   JOIN  → opt-in to job notifications
 *   APPLY <vacancy-id> → start application flow
 *   STATUS → check application statuses
 *   STOP  → opt-out
 *
 * Internal (called by notification dispatcher, not HTTP-exposed):
 *   sendSms(phone, body)
 *   sendWhatsApp(phone, templateName, params)
 */
export const messagingModule: FastifyPluginAsync = async (_app) => {
  // TODO: implement in Sprint 0, step 11 (Messaging module)
  // WABA application to Africa's Talking should be submitted on day 1 — 2–4 week approval lead time.
}

export default messagingModule
