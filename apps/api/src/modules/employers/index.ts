import type { FastifyPluginAsync } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { EmployerMeResponseSchema } from '@liberia-works/shared-schemas'
import { EMPLOYER_ROLES } from '@liberia-works/shared-types'
import { requireRole } from '../../plugins/auth.js'

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
export const employersModule: FastifyPluginAsync = async (app) => {
  const server = app.withTypeProvider<ZodTypeProvider>()

  // GET /employers/me
  server.get('/me', {
    schema: {
      tags: ['employers'],
      summary: 'Get current employer context',
      response: { 200: EmployerMeResponseSchema },
    },
    preHandler: [requireRole(EMPLOYER_ROLES)],
  }, async (req, reply) => {
    const employerUser = await app.prisma.employerUser.findFirst({
      where: { userId: req.authUser!.id, isActive: true },
      select: { employer: { select: { id: true, companyName: true } } },
    })
    if (!employerUser) return reply.notFound('No employer found for this user')
    return employerUser.employer
  })
}

export default employersModule
