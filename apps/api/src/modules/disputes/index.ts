import type { FastifyPluginAsync } from 'fastify'

/**
 * Disputes module — submission, SLA tracking, MoL response.
 *
 * SLA: slaDueAt = submittedAt + 10 business days (computed on insert).
 *
 * Employer endpoints:
 *   POST /api/v1/disputes
 *   GET  /api/v1/disputes             (own disputes)
 *   GET  /api/v1/disputes/:id
 *
 * MoL endpoints:
 *   GET   /api/v1/disputes            (all, overdue queue: status + sla_due_at index)
 *   POST  /api/v1/disputes/:id/assign
 *   POST  /api/v1/disputes/:id/respond
 *   POST  /api/v1/disputes/:id/close
 */
export const disputesModule: FastifyPluginAsync = async (_app) => {
  // TODO: implement in Sprint 0, step 13 (Disputes module)
}

export default disputesModule
