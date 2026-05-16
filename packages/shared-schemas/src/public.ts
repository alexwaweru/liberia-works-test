import { z } from 'zod'
import { CursorQuerySchema, CursorPageSchema } from './common.js'

// ── Stats ─────────────────────────────────────────────────────────────────────

export const PublicStatsResponseSchema = z.object({
  employers: z.number().int(),
  individuals: z.number().int(),
  openPositions: z.number().int(),
})
export type PublicStatsResponse = z.infer<typeof PublicStatsResponseSchema>

// ── Public vacancy list (landing page — no description, no applicationForm) ───
// Superset of the existing PublicVacancyListItemSchema: adds occupationId and applicationsCount.

export const LandingPublicVacancyListItemSchema = z.object({
  id: z.string().uuid(),
  employerId: z.string().uuid(),
  companyName: z.string(),
  title: z.string(),
  vacancyType: z.string(),
  stateId: z.number().int(),
  sectorId: z.string().uuid().nullable(),
  occupationId: z.string().uuid().nullable(),
  slotsAvailable: z.number().int(),
  deadline: z.string(),
  postedAt: z.string().datetime().nullable(),
  applicationsCount: z.number().int(),
})
export type LandingPublicVacancyListItem = z.infer<typeof LandingPublicVacancyListItemSchema>

export const LandingPublicVacancyListResponseSchema = CursorPageSchema(LandingPublicVacancyListItemSchema)
export type LandingPublicVacancyListResponse = z.infer<typeof LandingPublicVacancyListResponseSchema>

export const LandingVacancyBrowseFilterSchema = CursorQuerySchema.extend({
  keyword: z.string().max(100).optional(),
  vacancyType: z.enum(['VACATION_JOB', 'PERMANENT', 'CONTRACT', 'INTERNSHIP']).optional(),
  stateId: z.coerce.number().int().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
})
export type LandingVacancyBrowseFilter = z.infer<typeof LandingVacancyBrowseFilterSchema>

// ── Public vacancy detail (landing page) ─────────────────────────────────────
// Includes description; does NOT include applicationForm.

export const LandingPublicVacancyDetailSchema = LandingPublicVacancyListItemSchema.extend({
  description: z.string(),
})
export type LandingPublicVacancyDetail = z.infer<typeof LandingPublicVacancyDetailSchema>

// ── Public program cycles ─────────────────────────────────────────────────────
// ProgramCycle has no separate Program model — the cycle's own name is the program name.
// openAt maps to ProgramCycle.startDate; closeAt maps to ProgramCycle.endDate.
// expectedSlots does not exist in the schema and is omitted.

export const PublicProgramCycleListItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  status: z.string(),
  openAt: z.string(),   // ProgramCycle.startDate
  closeAt: z.string(),  // ProgramCycle.endDate
  createdAt: z.string().datetime(),
})
export type PublicProgramCycleListItem = z.infer<typeof PublicProgramCycleListItemSchema>

export const PublicProgramCycleListResponseSchema = CursorPageSchema(PublicProgramCycleListItemSchema)
export type PublicProgramCycleListResponse = z.infer<typeof PublicProgramCycleListResponseSchema>

// Detail adds year and type for richer display.
export const PublicProgramCycleDetailSchema = PublicProgramCycleListItemSchema.extend({
  type: z.string(),
  year: z.number().int(),
})
export type PublicProgramCycleDetail = z.infer<typeof PublicProgramCycleDetailSchema>
