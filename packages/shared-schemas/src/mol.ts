import { z } from 'zod'

export const MolEmployerMetricsSchema = z.object({
  vacanciesTotal: z.number().int(),
  vacanciesActive: z.number().int(),
  employees: z.number().int(),
  workPermits: z.number().int(),
  disputes: z.number().int(),
  placements: z.number().int(),
})

export const MolEmployerItemSchema = z.object({
  id: z.string().uuid(),
  companyName: z.string(),
  lraRegistrationNumber: z.string(),
  primaryContactName: z.string(),
  primaryContactEmail: z.string(),
  primaryContactPhone: z.string(),
  stateId: z.number().int().nullable(),
  stateName: z.string().nullable(),
  createdAt: z.string().datetime(),
  metrics: MolEmployerMetricsSchema,
})

export const MolEmployerListResponseSchema = z.object({
  items: z.array(MolEmployerItemSchema),
  nextCursor: z.string().nullable(),
})

export type MolEmployerItem = z.infer<typeof MolEmployerItemSchema>
export type MolEmployerListResponse = z.infer<typeof MolEmployerListResponseSchema>
