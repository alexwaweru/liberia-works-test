import type { FastifyPluginAsync } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import {
  SectorQuerySchema,
  SectorListResponseSchema,
  OccupationListResponseSchema,
  CountryQuerySchema,
  CountryListResponseSchema,
  EducationLevelListResponseSchema,
  RegionQuerySchema,
  RegionListResponseSchema,
  SubregionQuerySchema,
  SubregionListResponseSchema,
  StateQuerySchema,
  StateListResponseSchema,
  CityQuerySchema,
  CityListResponseSchema,
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
        summary: 'List all countries, optionally filtered by regionId, subregionId, or name',
        querystring: CountryQuerySchema,
        response: { 200: CountryListResponseSchema },
      },
    },
    async (req, reply) => {
      const { regionId, subregionId, name } = req.query
      const where: Record<string, unknown> = {}
      if (regionId !== undefined) where.regionId = regionId
      if (subregionId !== undefined) where.subregionId = subregionId
      if (name !== undefined) where.name = { contains: name, mode: 'insensitive' }
      const rows = await app.prisma.country.findMany({
        select: { id: true, name: true, iso2: true, iso3: true, emoji: true },
        where,
        orderBy: { name: 'asc' },
      })
      void reply.header('Cache-Control', CACHE_CONTROL)
      return rows
    },
  )

  server.get(
    '/regions',
    {
      schema: {
        tags: ['reference'],
        summary: 'List all world regions, optionally filtered by name',
        querystring: RegionQuerySchema,
        response: { 200: RegionListResponseSchema },
      },
    },
    async (req, reply) => {
      const { name } = req.query
      const where: Record<string, unknown> = {}
      if (name !== undefined) where.name = { contains: name, mode: 'insensitive' }
      const rows = await app.prisma.region.findMany({
        select: { id: true, name: true },
        where,
        orderBy: { name: 'asc' },
      })
      void reply.header('Cache-Control', CACHE_CONTROL)
      return rows
    },
  )

  server.get(
    '/sub-regions',
    {
      schema: {
        tags: ['reference'],
        summary: 'List all subregions, optionally filtered by regionId or name',
        querystring: SubregionQuerySchema,
        response: { 200: SubregionListResponseSchema },
      },
    },
    async (req, reply) => {
      const { regionId, name } = req.query
      const where: Record<string, unknown> = {}
      if (regionId !== undefined) where.regionId = regionId
      if (name !== undefined) where.name = { contains: name, mode: 'insensitive' }
      const rows = await app.prisma.subregion.findMany({
        select: { id: true, name: true, regionId: true },
        where,
        orderBy: { name: 'asc' },
      })
      void reply.header('Cache-Control', CACHE_CONTROL)
      return rows
    },
  )

  server.get(
    '/states',
    {
      schema: {
        tags: ['reference'],
        summary: 'List all states/provinces, optionally filtered by countryId or name',
        querystring: StateQuerySchema,
        response: { 200: StateListResponseSchema },
      },
    },
    async (req, reply) => {
      const { countryId, name } = req.query
      const where: Record<string, unknown> = {}
      if (countryId !== undefined) where.countryId = countryId
      if (name !== undefined) where.name = { contains: name, mode: 'insensitive' }
      const rows = await app.prisma.state.findMany({
        select: { id: true, name: true, countryId: true, stateCode: true },
        where,
        orderBy: { name: 'asc' },
      })
      void reply.header('Cache-Control', CACHE_CONTROL)
      return rows
    },
  )

  server.get(
    '/cities',
    {
      schema: {
        tags: ['reference'],
        summary: 'List all cities, optionally filtered by countryId, stateId, or name',
        querystring: CityQuerySchema,
        response: { 200: CityListResponseSchema },
      },
    },
    async (req, reply) => {
      const { countryId, stateId, name } = req.query
      const where: Record<string, unknown> = {}
      if (countryId !== undefined) where.countryId = countryId
      if (stateId !== undefined) where.stateId = stateId
      if (name !== undefined) where.name = { contains: name, mode: 'insensitive' }
      const rows = await app.prisma.city.findMany({
        select: { id: true, name: true, countryId: true, stateId: true },
        where,
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
