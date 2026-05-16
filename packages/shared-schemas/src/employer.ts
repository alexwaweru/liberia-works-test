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

const AddressInputSchema = z.object({
  countryId: z.number().int(),
  stateId: z.number().int().optional(),
  cityId: z.number().int().optional(),
  addressLine1: z.string().max(300).optional(),
  addressLine2: z.string().max(300).optional(),
})

export const UpdateEmployerSchema = CreateEmployerSchema.partial().extend({
  vacationJobHosting: z.boolean().optional(),
  vacationJobDonating: z.boolean().optional(),
  address: AddressInputSchema.optional(),
})

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

export const AddressResponseSchema = z.object({
  id: z.string().uuid(),
  countryId: z.number().int(),
  stateId: z.number().int().nullable(),
  cityId: z.number().int().nullable(),
  addressLine1: z.string().nullable(),
  addressLine2: z.string().nullable(),
})

export const EmployerSettingsResponseSchema = z.object({
  id: z.string().uuid(),
  companyName: z.string(),
  lraRegistrationNumber: z.string(),
  sectorId: z.string().uuid().nullable(),
  stateId: z.number().int().nullable(),
  primaryContactName: z.string(),
  primaryContactEmail: z.string(),
  primaryContactPhone: z.string(),
  complianceStatus: z.enum(['COMPLIANT', 'PENDING', 'OVERDUE', 'EXEMPT']),
  vacationJobHosting: z.boolean(),
  vacationJobDonating: z.boolean(),
  isActive: z.boolean(),
  address: AddressResponseSchema.nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

// Kept here for backward compatibility — canonical definition is in employer-user.ts
export { InviteEmployerUserSchema } from './employer-user.js'

export const EmployerMeResponseSchema = z.object({
  id: z.string().uuid(),
  companyName: z.string(),
})

export type CreateEmployer = z.infer<typeof CreateEmployerSchema>
export type UpdateEmployer = z.infer<typeof UpdateEmployerSchema>
export type EmployerResponse = z.infer<typeof EmployerResponseSchema>
export type EmployerSettingsResponse = z.infer<typeof EmployerSettingsResponseSchema>
export type EmployerMeResponse = z.infer<typeof EmployerMeResponseSchema>
