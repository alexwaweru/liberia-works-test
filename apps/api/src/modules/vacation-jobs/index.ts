import type { FastifyPluginAsync } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { requireRole } from '../../plugins/auth.js'
import { ProgramPlacementListResponseSchema } from '@liberia-works/shared-schemas'

export const vacationJobsModule: FastifyPluginAsync = async (app) => {
  const server = app.withTypeProvider<ZodTypeProvider>()

  server.post('/confirm', {
    schema: {
      tags: ['vacation-jobs'],
      summary: 'Confirm a vacation job placement',
      body: z.object({ code: z.string() }),
      response: { 200: z.object({ success: z.boolean(), message: z.string() }) },
    },
    preHandler: [requireRole(['INDIVIDUAL'])],
  }, async (req, reply) => {
    const { code } = req.body as { code: string }
    const userId = req.authUser!.id

    const placement = await app.prisma.programPlacement.findUnique({
      where: { confirmationCode: code.toUpperCase() },
      include: { employer: true, cycle: true, individual: { include: { user: true, education: true, workHistory: true } } }
    })

    if (!placement || placement.individual.user.id !== userId) return reply.notFound('Invalid confirmation code')
    if (placement.status !== 'MATCHED') return reply.badRequest('Placement already confirmed/invalid')

    await app.prisma.programPlacement.update({
      where: { id: placement.id },
      data: { status: 'CONFIRMED', confirmedAt: new Date() }
    })

    return { success: true, message: 'Confirmed!' }
  })

  server.get('/my-placement', {
    schema: {
      tags: ['vacation-jobs'],
      summary: 'Get placement',
    },
    preHandler: [requireRole(['INDIVIDUAL'])],
  }, async (req) => {
    const userId = req.authUser!.id
    const placement = await app.prisma.programPlacement.findFirst({
      where: { individual: { userId }, status: { in: ['CONFIRMED', 'MATCHED'] } },
      include: { employer: true, cycle: true, individual: { include: { user: true, education: true, workHistory: true } } }
    })

    if (!placement) return null

    return {
      id: placement.id,
      matchDate: placement.matchDate.toISOString(),
      status: placement.status,
      employer: {
        companyName: placement.employer.companyName,
        primaryContactName: placement.employer.primaryContactName,
        primaryContactPhone: placement.employer.primaryContactPhone
      },
      cycle: {
        name: placement.cycle.name,
        startDate: placement.cycle.startDate.toISOString()
      },
      individual: {
        id: placement.individual.id,
        fullName: placement.individual.user.fullName,
        email: placement.individual.user.email,
        phoneNumber: placement.individual.user.phoneNumber,
        dateOfBirth: placement.individual.user.dateOfBirth?.toISOString() ?? null,
        gender: placement.individual.user.gender,
        education: (placement.individual.education as any[]).map((e: any) => ({
            institutionName: e.institutionName,
            qualification: e.qualification,
            fieldOfStudy: e.fieldOfStudy,
        })),
        experience: (placement.individual.workHistory as any[]).map((w: any) => ({
            employerName: w.employerName,
            title: w.title,
        }))
      }
    }
  })
}

export default vacationJobsModule