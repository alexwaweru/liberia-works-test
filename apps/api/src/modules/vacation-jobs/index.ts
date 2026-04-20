import type { FastifyPluginAsync } from 'fastify'

/**
 * Vacation Jobs module.
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
 *   GET  /api/v1/vacation-jobs/cycles           (list cycles)
 *   GET  /api/v1/vacation-jobs/cycles/active    (current open cycle)
 *
 *   POST /api/v1/vacation-jobs/opt-in           (individual)
 *   DELETE /api/v1/vacation-jobs/opt-in         (individual opt-out)
 *
 *   Phase 2:
 *   POST /api/v1/vacation-jobs/hosting          (employer declares capacity)
 *   GET  /api/v1/vacation-jobs/placements/me    (individual sees their placement)
 *   POST /api/v1/vacation-jobs/placements/:id/confirm
 */
export const vacationJobsModule: FastifyPluginAsync = async (_app) => {
  // TODO: implement in Sprint 0, step 10 + Phase 2
}

export default vacationJobsModule
