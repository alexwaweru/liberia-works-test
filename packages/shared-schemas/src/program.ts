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

export type ProgramCycleResponse = z.infer<typeof ProgramCycleResponseSchema>
export type ProgramCycleListResponse = z.infer<typeof ProgramCycleListResponseSchema>
export type ProgramCycleFilter = z.infer<typeof ProgramCycleFilterSchema>
