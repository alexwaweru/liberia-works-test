import { z } from 'zod'

// ── Sectors ───────────────────────────────────────────────────────────────────

export const SectorQuerySchema = z.object({
  parentId: z.string().uuid().optional(),
})

export const SectorResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  parentId: z.string().uuid().nullable(),
  level: z.number().int(),
})

export const SectorListResponseSchema = z.array(SectorResponseSchema)

// ── Occupations ───────────────────────────────────────────────────────────────

export const OccupationResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  iscoCode: z.string(),
  majorGroup: z.string(),
})

export const OccupationListResponseSchema = z.array(OccupationResponseSchema)

// ── Countries ─────────────────────────────────────────────────────────────────

export const CountryQuerySchema = z.object({
  regionId: z.coerce.number().int().optional(),
  subregionId: z.coerce.number().int().optional(),
  name: z.string().optional(),
})

export const CountryResponseSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  iso2: z.string(),
  iso3: z.string().nullable(),
  emoji: z.string().nullable(),
})

export const CountryListResponseSchema = z.array(CountryResponseSchema)

// ── Education levels ──────────────────────────────────────────────────────────

export const EducationLevelResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  iscedCode: z.string(),
  levelOrder: z.number().int(),
})

export const EducationLevelListResponseSchema = z.array(EducationLevelResponseSchema)

// ── Regions ───────────────────────────────────────────────────────────────────

export const RegionQuerySchema = z.object({
  name: z.string().optional(),
})

export const RegionResponseSchema = z.object({
  id: z.number().int(),
  name: z.string(),
})

export const RegionListResponseSchema = z.array(RegionResponseSchema)

// ── Subregions ────────────────────────────────────────────────────────────────

export const SubregionQuerySchema = z.object({
  regionId: z.coerce.number().int().optional(),
  name: z.string().optional(),
})

export const SubregionResponseSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  regionId: z.number().int(),
})

export const SubregionListResponseSchema = z.array(SubregionResponseSchema)

// ── States ────────────────────────────────────────────────────────────────────

export const StateQuerySchema = z.object({
  countryId: z.coerce.number().int().optional(),
  countryCode: z.string().max(2).optional(),
  name: z.string().optional(),
})

export const StateResponseSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  countryId: z.number().int(),
  stateCode: z.string(),
})

export const StateListResponseSchema = z.array(StateResponseSchema)

// ── Cities ────────────────────────────────────────────────────────────────────

export const CityQuerySchema = z.object({
  countryId: z.coerce.number().int().optional(),
  stateId: z.coerce.number().int().optional(),
  name: z.string().optional(),
})

export const CityResponseSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  countryId: z.number().int(),
  stateId: z.number().int(),
})

export const CityListResponseSchema = z.array(CityResponseSchema)

// ── Inferred types ────────────────────────────────────────────────────────────

export type SectorQuery = z.infer<typeof SectorQuerySchema>
export type SectorResponse = z.infer<typeof SectorResponseSchema>
export type OccupationResponse = z.infer<typeof OccupationResponseSchema>
export type CountryQuery = z.infer<typeof CountryQuerySchema>
export type CountryResponse = z.infer<typeof CountryResponseSchema>
export type EducationLevelResponse = z.infer<typeof EducationLevelResponseSchema>
export type RegionQuery = z.infer<typeof RegionQuerySchema>
export type RegionResponse = z.infer<typeof RegionResponseSchema>
export type SubregionQuery = z.infer<typeof SubregionQuerySchema>
export type SubregionResponse = z.infer<typeof SubregionResponseSchema>
export type StateQuery = z.infer<typeof StateQuerySchema>
export type StateResponse = z.infer<typeof StateResponseSchema>
export type CityQuery = z.infer<typeof CityQuerySchema>
export type CityResponse = z.infer<typeof CityResponseSchema>
