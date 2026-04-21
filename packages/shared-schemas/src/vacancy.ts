import { z } from 'zod'
import { CursorQuerySchema } from './common.js'

export const CreateVacancySchema = z.object({
  title: z.string().min(3).max(300),
  description: z.string().min(10),
  vacancyType: z.enum(['VACATION_JOB', 'PERMANENT', 'CONTRACT', 'INTERNSHIP']),
  stateId: z.string().uuid(),
  sectorId: z.string().uuid().optional(),
  occupationId: z.string().uuid().optional(),
  minimumEducationLevelId: z.string().uuid().optional(),
  slotsAvailable: z.number().int().min(1),
  deadline: z.string().date(),
})

export const UpdateVacancySchema = CreateVacancySchema.partial()

export const VacancyResponseSchema = z.object({
  id: z.string().uuid(),
  employerId: z.string().uuid(),
  title: z.string(),
  description: z.string(),
  vacancyType: z.string(),
  stateId: z.string().uuid(),
  sectorId: z.string().uuid().nullable(),
  occupationId: z.string().uuid().nullable(),
  minimumEducationLevelId: z.string().uuid().nullable(),
  slotsAvailable: z.number(),
  deadline: z.string(),
  isMandatoryAdvertised: z.boolean(),
  status: z.string(),
  postedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export const VacancyFilterSchema = CursorQuerySchema.extend({
  stateId: z.string().uuid().optional(),
  sectorId: z.string().uuid().optional(),
  vacancyType: z.enum(['VACATION_JOB', 'PERMANENT', 'CONTRACT', 'INTERNSHIP']).optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'CLOSED', 'ARCHIVED']).optional(),
  keyword: z.string().max(100).optional(),
})

export type CreateVacancy = z.infer<typeof CreateVacancySchema>
export type UpdateVacancy = z.infer<typeof UpdateVacancySchema>
export type VacancyResponse = z.infer<typeof VacancyResponseSchema>
export type VacancyFilter = z.infer<typeof VacancyFilterSchema>
