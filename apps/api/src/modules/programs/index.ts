import type { FastifyPluginAsync } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import {
  ProgramCycleListResponseSchema,
  ProgramCycleFilterSchema,
} from '@liberia-works/shared-schemas'
import { EMPLOYER_ROLES } from '@liberia-works/shared-types'
import { requireRole } from '../../plugins/auth.js'
import { encodeCursor, decodeCursor } from '../../lib/cursor.js'
import type { ProgramCycle } from '@prisma/client'

function formatCycle(c: ProgramCycle) {
  return {
    id: c.id,
    type: c.type as string,
    name: c.name,
    description: c.description ?? null,
    year: c.year,
    startDate: c.startDate instanceof Date ? c.startDate.toISOString().split('T')[0]! : String(c.startDate),
    endDate: c.endDate instanceof Date ? c.endDate.toISOString().split('T')[0]! : String(c.endDate),
    status: c.status as string,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  }
}

export const programsModule: FastifyPluginAsync = async (app) => {
  const server = app.withTypeProvider<ZodTypeProvider>()

  // GET /cycles — list all program cycles (paginated)
  server.get('/cycles', {
    schema: {
      tags: ['programs'],
      summary: 'List program cycles',
      querystring: ProgramCycleFilterSchema,
      response: { 200: ProgramCycleListResponseSchema },
    },
    preHandler: [requireRole([...EMPLOYER_ROLES, 'INDIVIDUAL'])],
  }, async (req) => {
    const { cursor, status, type, year } = req.query
    const PAGE_SIZE = 20

    const where = {
      ...(status ? { status } : {}),
      ...(type ? { type } : {}),
      ...(year ? { year } : {}),
    }

    const decodedCursor = cursor ? decodeCursor(cursor) : undefined

    const [total, rows] = await Promise.all([
      app.prisma.programCycle.count({ where }),
      app.prisma.programCycle.findMany({
        where,
        orderBy: [{ year: 'desc' }, { startDate: 'desc' }, { id: 'desc' }],
        ...(decodedCursor ? { cursor: { id: decodedCursor }, skip: 1 } : {}),
        take: PAGE_SIZE + 1,
      }),
    ])

    const hasMore = rows.length > PAGE_SIZE
    const data = hasMore ? rows.slice(0, PAGE_SIZE) : rows
    const nextCursor = hasMore ? encodeCursor(data[data.length - 1]!.id) : null

    return { data: data.map(formatCycle), pagination: { nextCursor, hasMore, total } }
  })
}

export default programsModule
