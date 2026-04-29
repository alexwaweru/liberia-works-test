import { z } from 'zod'
import { CursorQuerySchema, CursorPageSchema } from './common.js'

// applicationForm is stored as a FormDefinition JSON blob
const applicationFormSchema = z.record(z.unknown()).nullable()

export const CreateVacancySchema = z.object({
  title: z.string().min(3).max(300),
  description: z.string().min(10),
  vacancyType: z.enum(['VACATION_JOB', 'PERMANENT', 'CONTRACT', 'INTERNSHIP']),
  stateId: z.number().int(),              // State.id is Int, not UUID
  sectorId: z.string().uuid().optional(),
  occupationId: z.string().uuid().optional(),
  minimumEducationLevelId: z.string().uuid().optional(),
  slotsAvailable: z.number().int().min(1),
  deadline: z.string().date(),
  isMandatoryAdvertised: z.boolean().optional(),
  applicationForm: applicationFormSchema.optional(),
})

export const UpdateVacancySchema = CreateVacancySchema.partial()

export const VacancyResponseSchema = z.object({
  id: z.string().uuid(),
  employerId: z.string().uuid(),
  title: z.string(),
  description: z.string(),
  vacancyType: z.string(),
  stateId: z.number().int(),
  sectorId: z.string().uuid().nullable(),
  occupationId: z.string().uuid().nullable(),
  minimumEducationLevelId: z.string().uuid().nullable(),
  slotsAvailable: z.number(),
  deadline: z.string(),
  isMandatoryAdvertised: z.boolean(),
  status: z.string(),
  applicationForm: applicationFormSchema,
  postedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export const VacancyListItemSchema = VacancyResponseSchema.extend({
  applicationsCount: z.number().int(),
})
export type VacancyListItem = z.infer<typeof VacancyListItemSchema>

export const VacancyListResponseSchema = CursorPageSchema(VacancyListItemSchema)
export type VacancyListResponse = z.infer<typeof VacancyListResponseSchema>

export const VacancyFilterSchema = CursorQuerySchema.extend({
  stateId: z.coerce.number().int().optional(),
  sectorId: z.string().uuid().optional(),
  vacancyType: z.enum(['VACATION_JOB', 'PERMANENT', 'CONTRACT', 'INTERNSHIP']).optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'CLOSED', 'ARCHIVED']).optional(),
  keyword: z.string().max(100).optional(),
  sortBy: z.enum(['postedAt', 'deadline']).optional(),
  sortDir: z.enum(['asc', 'desc']).optional(),
})

export type CreateVacancy = z.infer<typeof CreateVacancySchema>
export type UpdateVacancy = z.infer<typeof UpdateVacancySchema>
export type VacancyResponse = z.infer<typeof VacancyResponseSchema>
export type VacancyFilter = z.infer<typeof VacancyFilterSchema>
