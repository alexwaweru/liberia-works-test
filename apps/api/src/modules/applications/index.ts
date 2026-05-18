import type { FastifyPluginAsync } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { UpdateApplicationStatusSchema, MessageResponseSchema } from '@liberia-works/shared-schemas'
import { EMPLOYER_ROLES } from '@liberia-works/shared-types'
import { requireRole } from '../../plugins/auth.js'
import type { FastifyReply } from 'fastify'

/**
 * Applications module — employer-facing status update.
 *
 * PATCH /api/v1/applications/:id/status
 */
export const applicationsModule: FastifyPluginAsync = async (app) => {
  const server = app.withTypeProvider<ZodTypeProvider>()

  async function getEmployerId(userId: string, reply: FastifyReply): Promise<string | null> {
    const eu = await app.prisma.employerUser.findFirst({
      where: { userId, isActive: true },
      select: { employerId: true },
    })
    if (!eu) { reply.notFound('No employer found for this user'); return null }
    return eu.employerId
  }

  // PATCH /:id/status — update application status
  server.patch('/:id/status', {
    schema: {
      tags: ['applications'],
      summary: 'Update application status',
      body: UpdateApplicationStatusSchema,
      response: { 200: MessageResponseSchema },
    },
    preHandler: [requireRole(EMPLOYER_ROLES)],
  }, async (req, reply) => {
    const employerId = await getEmployerId(req.authUser!.id, reply)
    if (!employerId) return undefined

    const { id } = req.params as { id: string }
    const application = await app.prisma.application.findFirst({
      where: { id, isActive: true },
      select: { id: true, vacancyId: true, vacancy: { select: { employerId: true } } },
    })
    if (!application) return reply.notFound('Application not found')
    if (application.vacancy.employerId !== employerId) {
      return reply.forbidden('Access denied')
    }

    const { status, statusNote } = req.body
    await app.prisma.application.update({
      where: { id },
      data: {
        status,
        statusChangedAt: new Date(),
        statusChangedByUserId: req.authUser!.id,
        ...(statusNote !== undefined ? { statusNote } : {}),
      },
    })

    return { message: 'Status updated' }
  })
}

export default applicationsModule
