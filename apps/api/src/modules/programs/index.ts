import type { FastifyPluginAsync } from 'fastify'

/**
 * Programs module.
 *
 * Phase 1 (Sprint 0):
 *   - Cycle management
 *   - Individual opt-in / opt-out
 *
 * Phase 2 (stubs present):
 *   - Employer hosting capacity declaration
 *   - Matching worker (BullMQ)
 *   - Placement confirmation via confirmation code
 *
 * Endpoints:
 *   GET  /api/v1/programs/cycles           (list cycles)
 *   GET  /api/v1/programs/cycles/active    (current open cycle)
 *
 *   POST /api/v1/programs/opt-in           (individual)
 *   DELETE /api/v1/programs/opt-in         (individual opt-out)
 *
 *   Phase 2:
 *   POST /api/v1/programs/hosting          (employer declares capacity)
 *   GET  /api/v1/programs/placements/me    (individual sees their placement)
 *   POST /api/v1/programs/placements/:id/confirm
 */
export const programsModule: FastifyPluginAsync = async (_app) => {
  // TODO: implement in Sprint 0, step 10 + Phase 2
}

export default programsModule
