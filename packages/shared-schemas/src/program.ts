import { z } from 'zod'
import { CursorQuerySchema, CursorPageSchema } from './common.js'

export const ProgramCycleResponseSchema = z.object({
  id: z.string().uuid(),
  type: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  year: z.number().int(),
  startDate: z.string(),
  endDate: z.string(),
  status: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export const ProgramCycleListResponseSchema = CursorPageSchema(ProgramCycleResponseSchema)

export const ProgramCycleFilterSchema = CursorQuerySchema.extend({
  status: z.enum(['PLANNED', 'OPEN', 'MATCHING', 'COMPLETED']).optional(),
  type: z.enum(['VACATION_JOB']).optional(),
  year: z.coerce.number().int().optional(),
})

// --- NEW SCHEMAS ---

export const ProgramOptInSchema = z.object({
  slotsOffered: z.number().int().min(1, "Must offer at least 1 slot"),
  preferredSectorIds: z.array(z.string().uuid()).optional(),
  preferredEducationLevelId: z.string().uuid().optional(),
  stateId: z.number().int().optional(),
  contactName: z.string().min(2, "Contact name required"),
  contactPhone: z.string().min(5, "Valid contact phone required"),
  placementInstructions: z.string().optional(),
})

export const ProgramPlacementResponseSchema = z.object({
  id: z.string().uuid(),
  matchDate: z.string(),
  status: z.string(),
  individual: z.object({
    id: z.string().uuid(),
    fullName: z.string().nullable(),
    email: z.string().nullable(),
    phoneNumber: z.string().nullable(),
    dateOfBirth: z.string().nullable(),
    gender: z.string().nullable(),
    education: z.array(z.object({
        institutionName: z.string(),
        qualification: z.string().nullable(),
        fieldOfStudy: z.string().nullable(),
    })),
    experience: z.array(z.object({
        employerName: z.string(),
        title: z.string().nullable(),
    }))
  })
})

export const ProgramPlacementListResponseSchema = z.array(ProgramPlacementResponseSchema)

export type ProgramCycleResponse = z.infer<typeof ProgramCycleResponseSchema>
export type ProgramCycleListResponse = z.infer<typeof ProgramCycleListResponseSchema>
export type ProgramCycleFilter = z.infer<typeof ProgramCycleFilterSchema>
export type ProgramOptIn = z.infer<typeof ProgramOptInSchema>
export type ProgramPlacementResponse = z.infer<typeof ProgramPlacementResponseSchema>
