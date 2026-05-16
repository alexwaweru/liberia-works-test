import type { FastifyPluginAsync } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { MolEmployerListResponseSchema } from '@liberia-works/shared-schemas'
import { MOL_ROLES } from '@liberia-works/shared-types'
import { requireRole } from '../../plugins/auth.js'
import { encodeCursor, decodeCursor } from '../../lib/cursor.js'

export const molModule: FastifyPluginAsync = async (app) => {
  const server = app.withTypeProvider<ZodTypeProvider>()

  // GET /employers — paginated employer list with metrics (MoL only)
  server.get('/employers', {
    schema: {
      tags: ['mol'],
      summary: 'List employers with metrics (MoL only)',
      querystring: z.object({
        cursor: z.string().optional(),
        limit: z.coerce.number().int().min(1).max(100).optional().default(25),
        search: z.string().optional(),
      }),
      response: { 200: MolEmployerListResponseSchema },
    },
    preHandler: [requireRole(MOL_ROLES)],
  }, async (req) => {
    const { cursor, limit, search } = req.query
    const PAGE_SIZE = limit

    const where = search
      ? { companyName: { contains: search, mode: 'insensitive' as const } }
      : {}

    const decodedCursor = cursor ? decodeCursor(cursor) : undefined

    const employers = await app.prisma.employer.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      ...(decodedCursor ? { cursor: { id: decodedCursor }, skip: 1 } : {}),
      take: PAGE_SIZE + 1,
      include: {
        state: { select: { id: true, name: true } },
        _count: {
          select: {
            vacancies: true,
            workforceEmployees: true,
            workPermitApplications: true,
            disputes: true,
            placements: true,
          },
        },
        vacancies: {
          where: { status: 'ACTIVE' },
          select: { id: true },
        },
      },
    })

    const hasMore = employers.length > PAGE_SIZE
    const data = hasMore ? employers.slice(0, PAGE_SIZE) : employers
    const nextCursor = hasMore ? encodeCursor(data[data.length - 1]!.id) : null

    const items = data.map((e) => ({
      id: e.id,
      companyName: e.companyName,
      lraRegistrationNumber: e.lraRegistrationNumber,
      primaryContactName: e.primaryContactName,
      primaryContactEmail: e.primaryContactEmail,
      primaryContactPhone: e.primaryContactPhone,
      stateId: e.stateId,
      stateName: e.state?.name ?? null,
      createdAt: e.createdAt.toISOString(),
      metrics: {
        vacanciesTotal: e._count.vacancies,
        vacanciesActive: e.vacancies.length,
        employees: e._count.workforceEmployees,
        workPermits: e._count.workPermitApplications,
        disputes: e._count.disputes,
        placements: e._count.placements,
      },
    }))

    return { items, nextCursor }
  })
}

export default molModule
