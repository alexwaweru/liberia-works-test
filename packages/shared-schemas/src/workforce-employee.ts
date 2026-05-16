import { z } from 'zod'
import { CursorQuerySchema, CursorPageSchema } from './common.js'

const EMPLOYMENT_TYPES = ['PERMANENT', 'CONTRACT', 'CASUAL', 'INTERN'] as const
const GENDERS = ['MALE', 'FEMALE', 'PREFER_NOT_TO_SAY'] as const

// E.164: + followed by 7-15 digits
const phoneRegex = /^\+[1-9]\d{6,14}$/

// Treat empty form strings as missing so optional fields validate cleanly.
const emptyToUndef = (v: unknown) => (v === '' ? undefined : v)

export const CreateWorkforceEmployeeSchema = z.object({
  fullName: z.string().min(1).max(200),
  nationality: z.string().min(1).max(100),
  position: z.string().min(1).max(200),
  department: z.preprocess(emptyToUndef, z.string().max(200).optional()),
  employmentType: z.enum(EMPLOYMENT_TYPES),
  hireDate: z.string().date(),
  gender: z.preprocess(emptyToUndef, z.enum(GENDERS).optional()),
  terminationDate: z.preprocess(emptyToUndef, z.string().date().optional()),
  email: z.preprocess(emptyToUndef, z.string().email().optional()),
  phone: z.preprocess(emptyToUndef, z.string().regex(phoneRegex, 'Must be a valid E.164 phone number').optional()),
  // salary serialised as string to avoid JS float precision loss
  salary: z.preprocess(emptyToUndef, z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid decimal').optional()),
})

export const UpdateWorkforceEmployeeSchema = CreateWorkforceEmployeeSchema.partial()

export const WorkforceEmployeeResponseSchema = z.object({
  id: z.string().uuid(),
  employerId: z.string().uuid(),
  fullName: z.string(),
  gender: z.enum(GENDERS).nullable(),
  nationality: z.string(),
  position: z.string(),
  department: z.string().nullable(),
  employmentType: z.enum(EMPLOYMENT_TYPES),
  hireDate: z.string(),
  terminationDate: z.string().nullable(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  salary: z.string().nullable(),
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export const WorkforceEmployeeListFilterSchema = CursorQuerySchema.extend({
  search: z.string().max(100).optional(),
  isActive: z.enum(['true', 'false']).optional(),
  employmentType: z.enum(EMPLOYMENT_TYPES).optional(),
  department: z.string().max(200).optional(),
})

export const WorkforceEmployeeListResponseSchema = CursorPageSchema(WorkforceEmployeeResponseSchema)

export type CreateWorkforceEmployee = z.infer<typeof CreateWorkforceEmployeeSchema>
export type UpdateWorkforceEmployee = z.infer<typeof UpdateWorkforceEmployeeSchema>
export type WorkforceEmployeeResponse = z.infer<typeof WorkforceEmployeeResponseSchema>
export type WorkforceEmployeeListFilter = z.infer<typeof WorkforceEmployeeListFilterSchema>
export type WorkforceEmployeeListResponse = z.infer<typeof WorkforceEmployeeListResponseSchema>
