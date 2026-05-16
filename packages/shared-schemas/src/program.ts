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
  contactName: z.string().min(2, "Contact name required"),
  contactPhone: z.string().min(5, "Valid contact phone required"),
  preferredSectors: z.array(z.string().uuid()).min(1, "Select at least one sector"),
  preferredEducationLevelId: z.string().uuid().optional(),
  placementInstructions: z.string().optional(),
  capacities: z.array(z.object({
    stateId: z.number().int(),
    slotsOffered: z.number().int().min(1, "Must offer at least 1 slot"),
  })).min(1, "At least one county capacity required"),
})

export const ProgramPlacementResponseSchema = z.object({
  id: z.string().uuid(),
  matchDate: z.string(),
  status: z.string(),
  employer: z.object({
    companyName: z.string(),
    primaryContactName: z.string().nullable(),
    primaryContactPhone: z.string().nullable(),
  }).optional(),
  cycle: z.object({
    name: z.string(),
    startDate: z.string(),
  }).optional(),
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

export const UpdateProgramCycleSchema = z.object({
  name: z.string().min(1).optional(),
  year: z.number().int().min(2000).max(2100).optional(),
  type: z.enum(['VACATION_JOB']).optional(),
  status: z.enum(['PLANNED', 'OPEN', 'MATCHING', 'COMPLETED']).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  description: z.string().optional(),
})

export const CreateProgramCycleSchema = z.object({
  name: z.string().min(1),
  year: z.number().int().min(2000).max(2100),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  type: z.enum(['VACATION_JOB']).optional().default('VACATION_JOB'),
  status: z.enum(['PLANNED', 'OPEN', 'MATCHING', 'COMPLETED']).optional().default('PLANNED'),
  description: z.string().optional(),
})

export type UpdateProgramCycle = z.infer<typeof UpdateProgramCycleSchema>
export type CreateProgramCycle = z.infer<typeof CreateProgramCycleSchema>

export type ProgramCycleResponse = z.infer<typeof ProgramCycleResponseSchema>
export type ProgramCycleListResponse = z.infer<typeof ProgramCycleListResponseSchema>
export type ProgramCycleFilter = z.infer<typeof ProgramCycleFilterSchema>
export type ProgramOptIn = z.infer<typeof ProgramOptInSchema>
export type ProgramPlacementResponse = z.infer<typeof ProgramPlacementResponseSchema>
