import { describe, it, expect, vi } from 'vitest'
import Fastify from 'fastify'
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod'
import type { PrismaClient } from '@prisma/client'
import referenceModule from '../modules/reference/index.js'

const mockSectors = [
  { id: 'b1000000-0000-0000-0000-000000000001', name: 'Agriculture', parentId: null, level: 1 },
  { id: 'b1000000-0000-0000-0000-000000000002', name: 'Mining', parentId: null, level: 1 },
]

const mockChildSectors = [
  { id: 'b2000000-0000-0000-0000-000000000001', name: 'Crop farming', parentId: 'b1000000-0000-0000-0000-000000000001', level: 2 },
]

const mockOccupations = [
  { id: 'c1000000-0000-0000-0000-000000000001', name: 'Software Developer', iscoCode: '2512', majorGroup: 'ICT Professionals' },
]

const mockCountries = [
  { id: 121, name: 'Liberia', iso2: 'LR', iso3: 'LBR', emoji: '🇱🇷' },
  { id: 100, name: 'Ghana', iso2: 'GH', iso3: 'GHA', emoji: '🇬🇭' },
]

const mockEducationLevels = [
  { id: 'd1000000-0000-0000-0000-000000000001', name: 'Primary', iscedCode: 'ISCED1', levelOrder: 1 },
  { id: 'd1000000-0000-0000-0000-000000000002', name: 'Secondary', iscedCode: 'ISCED2', levelOrder: 2 },
]

const mockRegions = [
  { id: 1, name: 'Africa' },
  { id: 2, name: 'Europe' },
]

const mockSubregions = [
  { id: 11, name: 'Eastern Africa', regionId: 1 },
  { id: 12, name: 'Western Africa', regionId: 1 },
]

const mockStates = [
  { id: 101, name: 'Montserrado', countryId: 121, stateCode: 'MO' },
]

const mockCities = [
  { id: 1001, name: 'Monrovia', countryId: 121, stateId: 101 },
]

function buildApp() {
  const app = Fastify()
  app.setValidatorCompiler(validatorCompiler)
  app.setSerializerCompiler(serializerCompiler)
  app.decorate('prisma', {
    sector: { findMany: vi.fn() },
    occupation: { findMany: vi.fn() },
    country: { findMany: vi.fn() },
    educationLevel: { findMany: vi.fn() },
    region: { findMany: vi.fn() },
    subregion: { findMany: vi.fn() },
    state: { findMany: vi.fn() },
    city: { findMany: vi.fn() },
  } as unknown as PrismaClient)
  return app
}

describe('GET /api/v1/reference/sectors', () => {
  it('returns top-level sectors when no query param given', async () => {
    const app = buildApp()
    ;(app.prisma.sector.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(mockSectors)
    await app.register(referenceModule, { prefix: '/api/v1/reference' })

    const res = await app.inject({ method: 'GET', url: '/api/v1/reference/sectors' })

    expect(res.statusCode).toBe(200)
    expect(res.headers['cache-control']).toBe('no-cache')
    const calledWith = (app.prisma.sector.findMany as ReturnType<typeof vi.fn>).mock.calls[0]![0]
    expect(calledWith.where).toEqual({ parentId: null })
  })

  it('filters by parentId when query param is provided', async () => {
    const app = buildApp()
    ;(app.prisma.sector.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(mockChildSectors)
    await app.register(referenceModule, { prefix: '/api/v1/reference' })

    const parentId = 'b1000000-0000-0000-0000-000000000001'
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/reference/sectors?parentId=${parentId}`,
    })

    expect(res.statusCode).toBe(200)
    const calledWith = (app.prisma.sector.findMany as ReturnType<typeof vi.fn>).mock.calls[0]![0]
    expect(calledWith.where).toEqual({ parentId })
    const body = res.json()
    expect(body[0]).toMatchObject({ parentId, level: 2 })
  })

  it('rejects a non-UUID parentId with 400', async () => {
    const app = buildApp()
    await app.register(referenceModule, { prefix: '/api/v1/reference' })

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/reference/sectors?parentId=not-a-uuid',
    })

    expect(res.statusCode).toBe(400)
  })
})

describe('GET /api/v1/reference/occupations', () => {
  it('returns 200 with occupations and Cache-Control header', async () => {
    const app = buildApp()
    ;(app.prisma.occupation.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(mockOccupations)
    await app.register(referenceModule, { prefix: '/api/v1/reference' })

    const res = await app.inject({ method: 'GET', url: '/api/v1/reference/occupations' })

    expect(res.statusCode).toBe(200)
    expect(res.headers['cache-control']).toBe('no-cache')
    const body = res.json()
    expect(body[0]).toMatchObject({ iscoCode: '2512', majorGroup: 'ICT Professionals' })
  })
})

describe('GET /api/v1/reference/countries', () => {
  it('returns 200 with countries and Cache-Control header', async () => {
    const app = buildApp()
    ;(app.prisma.country.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(mockCountries)
    await app.register(referenceModule, { prefix: '/api/v1/reference' })

    const res = await app.inject({ method: 'GET', url: '/api/v1/reference/countries' })

    expect(res.statusCode).toBe(200)
    expect(res.headers['cache-control']).toBe('no-cache')
    const body = res.json()
    expect(body[0]).toMatchObject({ id: 121, name: 'Liberia', iso2: 'LR', iso3: 'LBR', emoji: '🇱🇷' })
  })
})

describe('GET /api/v1/reference/education-levels', () => {
  it('returns 200 with education levels and Cache-Control header', async () => {
    const app = buildApp()
    ;(app.prisma.educationLevel.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(mockEducationLevels)
    await app.register(referenceModule, { prefix: '/api/v1/reference' })

    const res = await app.inject({ method: 'GET', url: '/api/v1/reference/education-levels' })

    expect(res.statusCode).toBe(200)
    expect(res.headers['cache-control']).toBe('no-cache')
    const body = res.json()
    expect(body).toHaveLength(2)
    expect(body[0]).toMatchObject({ iscedCode: 'ISCED1', levelOrder: 1 })
  })
})

describe('GET /api/v1/reference/regions', () => {
  it('returns 200 with all regions and Cache-Control header when no filter', async () => {
    const app = buildApp()
    ;(app.prisma.region.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(mockRegions)
    await app.register(referenceModule, { prefix: '/api/v1/reference' })

    const res = await app.inject({ method: 'GET', url: '/api/v1/reference/regions' })

    expect(res.statusCode).toBe(200)
    expect(res.headers['cache-control']).toBe('no-cache')
    const body = res.json()
    expect(body).toHaveLength(2)
    expect(body[0]).toMatchObject({ id: 1, name: 'Africa' })
    const calledWith = (app.prisma.region.findMany as ReturnType<typeof vi.fn>).mock.calls[0]![0]
    expect(calledWith.where).toEqual({})
  })

  it('filters by name (contains, insensitive) when name param provided', async () => {
    const app = buildApp()
    ;(app.prisma.region.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([mockRegions[0]])
    await app.register(referenceModule, { prefix: '/api/v1/reference' })

    const res = await app.inject({ method: 'GET', url: '/api/v1/reference/regions?name=afr' })

    expect(res.statusCode).toBe(200)
    const calledWith = (app.prisma.region.findMany as ReturnType<typeof vi.fn>).mock.calls[0]![0]
    expect(calledWith.where).toEqual({ name: { contains: 'afr', mode: 'insensitive' } })
  })
})

describe('GET /api/v1/reference/sub-regions', () => {
  it('returns 200 with all subregions and Cache-Control header when no filter', async () => {
    const app = buildApp()
    ;(app.prisma.subregion.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(mockSubregions)
    await app.register(referenceModule, { prefix: '/api/v1/reference' })

    const res = await app.inject({ method: 'GET', url: '/api/v1/reference/sub-regions' })

    expect(res.statusCode).toBe(200)
    expect(res.headers['cache-control']).toBe('no-cache')
    const body = res.json()
    expect(body).toHaveLength(2)
    expect(body[0]).toMatchObject({ id: 11, name: 'Eastern Africa', regionId: 1 })
    const calledWith = (app.prisma.subregion.findMany as ReturnType<typeof vi.fn>).mock.calls[0]![0]
    expect(calledWith.where).toEqual({})
  })

  it('filters by regionId when provided', async () => {
    const app = buildApp()
    ;(app.prisma.subregion.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(mockSubregions)
    await app.register(referenceModule, { prefix: '/api/v1/reference' })

    const res = await app.inject({ method: 'GET', url: '/api/v1/reference/sub-regions?regionId=1' })

    expect(res.statusCode).toBe(200)
    const calledWith = (app.prisma.subregion.findMany as ReturnType<typeof vi.fn>).mock.calls[0]![0]
    expect(calledWith.where).toEqual({ regionId: 1 })
  })

  it('filters by name and regionId together', async () => {
    const app = buildApp()
    ;(app.prisma.subregion.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([mockSubregions[0]])
    await app.register(referenceModule, { prefix: '/api/v1/reference' })

    const res = await app.inject({ method: 'GET', url: '/api/v1/reference/sub-regions?regionId=1&name=east' })

    expect(res.statusCode).toBe(200)
    const calledWith = (app.prisma.subregion.findMany as ReturnType<typeof vi.fn>).mock.calls[0]![0]
    expect(calledWith.where).toEqual({ regionId: 1, name: { contains: 'east', mode: 'insensitive' } })
  })

  it('rejects non-integer regionId with 400', async () => {
    const app = buildApp()
    await app.register(referenceModule, { prefix: '/api/v1/reference' })

    const res = await app.inject({ method: 'GET', url: '/api/v1/reference/sub-regions?regionId=abc' })

    expect(res.statusCode).toBe(400)
  })
})

describe('GET /api/v1/reference/countries (extended filters)', () => {
  it('filters by regionId and name together', async () => {
    const app = buildApp()
    ;(app.prisma.country.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([mockCountries[0]])
    await app.register(referenceModule, { prefix: '/api/v1/reference' })

    const res = await app.inject({ method: 'GET', url: '/api/v1/reference/countries?regionId=1&name=lib' })

    expect(res.statusCode).toBe(200)
    const calledWith = (app.prisma.country.findMany as ReturnType<typeof vi.fn>).mock.calls[0]![0]
    expect(calledWith.where).toEqual({ regionId: 1, name: { contains: 'lib', mode: 'insensitive' } })
  })

  it('filters by subregionId when provided', async () => {
    const app = buildApp()
    ;(app.prisma.country.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(mockCountries)
    await app.register(referenceModule, { prefix: '/api/v1/reference' })

    const res = await app.inject({ method: 'GET', url: '/api/v1/reference/countries?subregionId=11' })

    expect(res.statusCode).toBe(200)
    const calledWith = (app.prisma.country.findMany as ReturnType<typeof vi.fn>).mock.calls[0]![0]
    expect(calledWith.where).toEqual({ subregionId: 11 })
  })

  it('rejects non-integer regionId with 400', async () => {
    const app = buildApp()
    await app.register(referenceModule, { prefix: '/api/v1/reference' })

    const res = await app.inject({ method: 'GET', url: '/api/v1/reference/countries?regionId=notanumber' })

    expect(res.statusCode).toBe(400)
  })
})

describe('GET /api/v1/reference/states', () => {
  it('returns 200 with all states and Cache-Control header when no filter', async () => {
    const app = buildApp()
    ;(app.prisma.state.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(mockStates)
    await app.register(referenceModule, { prefix: '/api/v1/reference' })

    const res = await app.inject({ method: 'GET', url: '/api/v1/reference/states' })

    expect(res.statusCode).toBe(200)
    expect(res.headers['cache-control']).toBe('no-cache')
    const body = res.json()
    expect(body[0]).toMatchObject({ id: 101, name: 'Montserrado', countryId: 121, stateCode: 'MO' })
    const calledWith = (app.prisma.state.findMany as ReturnType<typeof vi.fn>).mock.calls[0]![0]
    expect(calledWith.where).toEqual({})
  })

  it('filters by countryId when provided', async () => {
    const app = buildApp()
    ;(app.prisma.state.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(mockStates)
    await app.register(referenceModule, { prefix: '/api/v1/reference' })

    const res = await app.inject({ method: 'GET', url: '/api/v1/reference/states?countryId=121' })

    expect(res.statusCode).toBe(200)
    const calledWith = (app.prisma.state.findMany as ReturnType<typeof vi.fn>).mock.calls[0]![0]
    expect(calledWith.where).toEqual({ countryId: 121 })
  })

  it('rejects non-integer countryId with 400', async () => {
    const app = buildApp()
    await app.register(referenceModule, { prefix: '/api/v1/reference' })

    const res = await app.inject({ method: 'GET', url: '/api/v1/reference/states?countryId=abc' })

    expect(res.statusCode).toBe(400)
  })
})

describe('GET /api/v1/reference/cities', () => {
  it('returns 200 with all cities and Cache-Control header when no filter', async () => {
    const app = buildApp()
    ;(app.prisma.city.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(mockCities)
    await app.register(referenceModule, { prefix: '/api/v1/reference' })

    const res = await app.inject({ method: 'GET', url: '/api/v1/reference/cities' })

    expect(res.statusCode).toBe(200)
    expect(res.headers['cache-control']).toBe('no-cache')
    const body = res.json()
    expect(body[0]).toMatchObject({ id: 1001, name: 'Monrovia', countryId: 121, stateId: 101 })
    const calledWith = (app.prisma.city.findMany as ReturnType<typeof vi.fn>).mock.calls[0]![0]
    expect(calledWith.where).toEqual({})
  })

  it('filters by countryId and stateId together', async () => {
    const app = buildApp()
    ;(app.prisma.city.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(mockCities)
    await app.register(referenceModule, { prefix: '/api/v1/reference' })

    const res = await app.inject({ method: 'GET', url: '/api/v1/reference/cities?countryId=121&stateId=101' })

    expect(res.statusCode).toBe(200)
    const calledWith = (app.prisma.city.findMany as ReturnType<typeof vi.fn>).mock.calls[0]![0]
    expect(calledWith.where).toEqual({ countryId: 121, stateId: 101 })
  })

  it('rejects non-integer stateId with 400', async () => {
    const app = buildApp()
    await app.register(referenceModule, { prefix: '/api/v1/reference' })

    const res = await app.inject({ method: 'GET', url: '/api/v1/reference/cities?stateId=notanumber' })

    expect(res.statusCode).toBe(400)
  })
})
