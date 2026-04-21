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

// ── Inferred types ────────────────────────────────────────────────────────────

export type SectorQuery = z.infer<typeof SectorQuerySchema>
export type SectorResponse = z.infer<typeof SectorResponseSchema>
export type OccupationResponse = z.infer<typeof OccupationResponseSchema>
export type CountryResponse = z.infer<typeof CountryResponseSchema>
export type EducationLevelResponse = z.infer<typeof EducationLevelResponseSchema>
