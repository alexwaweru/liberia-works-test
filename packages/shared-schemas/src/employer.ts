import { z } from 'zod'

export const CreateEmployerSchema = z.object({
  lraRegistrationNumber: z.string().min(6).max(50),
  companyName: z.string().min(2).max(300),
  sectorId: z.string().uuid(),
  stateId: z.string().uuid(),
  primaryContactName: z.string().min(2).max(200),
  primaryContactEmail: z.string().email(),
  primaryContactPhone: z
    .string()
    .regex(/^\+[1-9]\d{6,14}$/, 'Must be a valid E.164 phone number'),
})

export const UpdateEmployerSchema = CreateEmployerSchema.partial()

export const EmployerResponseSchema = z.object({
  id: z.string().uuid(),
  lraRegistrationNumber: z.string(),
  companyName: z.string(),
  sectorId: z.string().uuid(),
  stateId: z.string().uuid(),
  primaryContactName: z.string(),
  primaryContactEmail: z.string(),
  primaryContactPhone: z.string(),
  complianceStatus: z.enum(['COMPLIANT', 'PENDING', 'OVERDUE', 'EXEMPT']),
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export const InviteEmployerUserSchema = z.object({
  email: z.string().email(),
  role: z.enum(['ADMIN', 'HR']),
})

export const EmployerMeResponseSchema = z.object({
  id: z.string().uuid(),
  companyName: z.string(),
})

export type CreateEmployer = z.infer<typeof CreateEmployerSchema>
export type UpdateEmployer = z.infer<typeof UpdateEmployerSchema>
export type EmployerResponse = z.infer<typeof EmployerResponseSchema>
export type InviteEmployerUser = z.infer<typeof InviteEmployerUserSchema>
export type EmployerMeResponse = z.infer<typeof EmployerMeResponseSchema>
