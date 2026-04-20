import type { FastifyPluginAsync } from 'fastify'

/**
 * Applications module — individual → vacancy applications.
 *
 * Individual endpoints:
 *   POST   /api/v1/vacancies/:vacancyId/apply
 *   GET    /api/v1/individuals/me/applications
 *   DELETE /api/v1/individuals/me/applications/:id  (withdraw)
 *
 * Employer endpoints:
 *   GET    /api/v1/vacancies/:vacancyId/applications  (applicant table)
 *   PATCH  /api/v1/applications/:id/status            (shortlist/reject/hire)
 */
export const applicationsModule: FastifyPluginAsync = async (_app) => {
  // TODO: implement in Sprint 0, step 10 (Vacancies + applications)
}

export default applicationsModule
