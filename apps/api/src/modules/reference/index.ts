import type { FastifyPluginAsync } from 'fastify'

/**
 * Reference data module — read-only, public, cached.
 *
 * Endpoints:
 *   GET /api/v1/reference/counties
 *   GET /api/v1/reference/sectors
 *   GET /api/v1/reference/occupations
 *   GET /api/v1/reference/countries
 *   GET /api/v1/reference/education-levels
 */
export const referenceModule: FastifyPluginAsync = async (app) => {
  app.get('/counties', async () => {
    return app.prisma.county.findMany({ orderBy: { name: 'asc' } })
  })

  app.get('/sectors', async (request) => {
    const { parentId } = request.query as { parentId?: string }
    return app.prisma.sector.findMany({
      where: parentId ? { parentId } : { parentId: null },
      orderBy: { name: 'asc' },
    })
  })

  app.get('/occupations', async () => {
    return app.prisma.occupation.findMany({ orderBy: { name: 'asc' } })
  })

  app.get('/countries', async () => {
    return app.prisma.country.findMany({ orderBy: { name: 'asc' } })
  })

  app.get('/education-levels', async () => {
    return app.prisma.educationLevel.findMany({ orderBy: { levelOrder: 'asc' } })
  })
}

export default referenceModule
