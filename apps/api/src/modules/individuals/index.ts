import type { FastifyPluginAsync } from 'fastify'

/**
 * Individuals module — profiles, education, work history, skills, sector interests.
 *
 * Endpoints:
 *   GET    /api/v1/individuals/me
 *   PATCH  /api/v1/individuals/me
 *   GET    /api/v1/individuals/me/education
 *   POST   /api/v1/individuals/me/education
 *   DELETE /api/v1/individuals/me/education/:id
 *   GET    /api/v1/individuals/me/work-history
 *   POST   /api/v1/individuals/me/work-history
 *   DELETE /api/v1/individuals/me/work-history/:id
 *   GET    /api/v1/individuals/me/skills
 *   POST   /api/v1/individuals/me/skills
 *   DELETE /api/v1/individuals/me/skills/:id
 *   PUT    /api/v1/individuals/me/sector-interests
 *   POST   /api/v1/individuals/me/vacation-job/opt-in
 *   DELETE /api/v1/individuals/me/vacation-job/opt-in
 */
export const individualsModule: FastifyPluginAsync = async (_app) => {
  // TODO: implement in Sprint 0, step 6 (Individuals module)
}

export default individualsModule
