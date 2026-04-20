import type { FastifyPluginAsync } from 'fastify'

/**
 * Work permits module — mandatory advertising enforcement (reg. RL/MOL/CWK/M/1011/725).
 *
 * Key invariant enforced here AND at DB level:
 *   A work permit application MUST reference a vacancy with isMandatoryAdvertised=true
 *   posted >= 60 days before submission by this employer for the same occupation.
 *   If not, return 409 + draftVacancyId so the employer can post first.
 *
 * Employer endpoints:
 *   POST  /api/v1/work-permits             (create application)
 *   GET   /api/v1/work-permits             (own applications)
 *   GET   /api/v1/work-permits/:id
 *   PATCH /api/v1/work-permits/:id         (update draft)
 *   POST  /api/v1/work-permits/:id/submit
 *
 * MoL endpoints:
 *   GET   /api/v1/work-permits             (all, filterable)
 *   PATCH /api/v1/work-permits/:id/review  (approve/reject/request-info)
 */
export const workPermitsModule: FastifyPluginAsync = async (_app) => {
  // TODO: implement in Sprint 0, step 12 (Work permits module)
}

export default workPermitsModule
