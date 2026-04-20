import type { FastifyPluginAsync } from 'fastify'

/**
 * Employers module — employer entity, membership, onboarding.
 *
 * Endpoints:
 *   POST  /api/v1/employers                        (register employer)
 *   GET   /api/v1/employers/me                     (current employer)
 *   PATCH /api/v1/employers/me
 *   GET   /api/v1/employers/me/users               (team members)
 *   POST  /api/v1/employers/me/users/invite
 *   PATCH /api/v1/employers/me/users/:userId/role
 *   DELETE /api/v1/employers/me/users/:userId
 *
 * MoL-only:
 *   GET   /api/v1/employers                        (list all)
 *   GET   /api/v1/employers/:id
 *   PATCH /api/v1/employers/:id/compliance-status
 */
export const employersModule: FastifyPluginAsync = async (_app) => {
  // TODO: implement in Sprint 0, step 7 (Employers module)
}

export default employersModule
