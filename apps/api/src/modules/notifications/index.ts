import type { FastifyPluginAsync } from 'fastify'

/**
 * Notifications module — cross-channel dispatcher (SMS / WhatsApp / email / in-app).
 *
 * Endpoints:
 *   GET  /api/v1/notifications           (user's notification feed)
 *   POST /api/v1/notifications/:id/read  (mark read)
 *   POST /api/v1/notifications/read-all
 *
 * Internal dispatch (not HTTP-exposed — handled by the Inngest notifications-dispatch function):
 *   inngest.send({ name: 'notifications/dispatch', data: { userId, type, ... } })
 *   → routes to SMS/email/in-app based on user prefs
 *
 * Notification types: VACANCY_MATCH, APPLICATION_STATUS, PERMIT_STATUS,
 *   DISPUTE_RESPONSE, COMPLIANCE_ALERT, VACATION_JOB_MATCH, PROFILE_NUDGE
 */
export const notificationsModule: FastifyPluginAsync = async (_app) => {
  // TODO: implement in Sprint 0, step 11
}

export default notificationsModule
