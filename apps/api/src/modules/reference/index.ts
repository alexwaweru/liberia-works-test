import type { FastifyPluginAsync } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import {
  SectorQuerySchema,
  SectorListResponseSchema,
  OccupationListResponseSchema,
  CountryListResponseSchema,
  EducationLevelListResponseSchema,
} from '@liberia-works/shared-schemas'

const CACHE_CONTROL = 'public, max-age=86400, stale-while-revalidate=3600'

export const referenceModule: FastifyPluginAsync = async (app) => {
  const server = app.withTypeProvider<ZodTypeProvider>()

  server.get(
    '/sectors',
    {
      schema: {
        tags: ['reference'],
        summary: 'List sectors, optionally filtered by parentId',
        querystring: SectorQuerySchema,
        response: { 200: SectorListResponseSchema },
      },
    },
    async (req, reply) => {
      const { parentId } = req.query
      const rows = await app.prisma.sector.findMany({
        select: { id: true, name: true, parentId: true, level: true },
        where: parentId ? { parentId } : { parentId: null },
        orderBy: { name: 'asc' },
      })
      void reply.header('Cache-Control', CACHE_CONTROL)
      return rows
    },
  )

  server.get(
    '/occupations',
    {
      schema: {
        tags: ['reference'],
        summary: 'List all ISCO-08 occupations',
        response: { 200: OccupationListResponseSchema },
      },
    },
    async (_req, reply) => {
      const rows = await app.prisma.occupation.findMany({
        select: { id: true, name: true, iscoCode: true, majorGroup: true },
        orderBy: { name: 'asc' },
      })
      void reply.header('Cache-Control', CACHE_CONTROL)
      return rows
    },
  )

  server.get(
    '/countries',
    {
      schema: {
        tags: ['reference'],
        summary: 'List all countries',
        response: { 200: CountryListResponseSchema },
      },
    },
    async (_req, reply) => {
      const rows = await app.prisma.country.findMany({
        select: { id: true, name: true, iso2: true, iso3: true, emoji: true },
        orderBy: { name: 'asc' },
      })
      void reply.header('Cache-Control', CACHE_CONTROL)
      return rows
    },
  )

  server.get(
    '/education-levels',
    {
      schema: {
        tags: ['reference'],
        summary: 'List ISCED 2011 education levels ordered by level',
        response: { 200: EducationLevelListResponseSchema },
      },
    },
    async (_req, reply) => {
      const rows = await app.prisma.educationLevel.findMany({
        select: { id: true, name: true, iscedCode: true, levelOrder: true },
        orderBy: { levelOrder: 'asc' },
      })
      void reply.header('Cache-Control', CACHE_CONTROL)
      return rows
    },
  )
}

export default referenceModule
