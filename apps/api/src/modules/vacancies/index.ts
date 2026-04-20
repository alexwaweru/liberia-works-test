import type { FastifyPluginAsync } from 'fastify'

/**
 * Vacancies module — posting, browsing, filters.
 *
 * Public endpoints (no auth):
 *   GET  /api/v1/vacancies             (browse with filters)
 *   GET  /api/v1/vacancies/:id
 *
 * Employer endpoints:
 *   POST   /api/v1/vacancies           (create)
 *   PATCH  /api/v1/vacancies/:id       (update)
 *   POST   /api/v1/vacancies/:id/publish
 *   POST   /api/v1/vacancies/:id/close
 *   DELETE /api/v1/vacancies/:id       (soft-delete → ARCHIVED)
 *   GET    /api/v1/employers/me/vacancies
 *
 * MoL:
 *   GET  /api/v1/vacancies             (all, including draft)
 */
export const vacanciesModule: FastifyPluginAsync = async (_app) => {
  // TODO: implement in Sprint 0, step 10 (Vacancies + applications)
}

export default vacanciesModule
