import { z } from 'zod'
import { CursorQuerySchema, CursorPageSchema } from './common.js'

export const CreateApplicationSchema = z.object({
  responses: z.record(z.unknown()).optional(),
})
export type CreateApplication = z.infer<typeof CreateApplicationSchema>

export const MyApplicationListItemSchema = z.object({
  id: z.string().uuid(),
  vacancyId: z.string().uuid(),
  vacancyTitle: z.string(),
  companyName: z.string(),
  appliedAt: z.string().datetime(),
  status: z.enum(['APPLIED', 'SHORTLISTED', 'REJECTED', 'WITHDRAWN', 'HIRED']),
})
export const MyApplicationListResponseSchema = CursorPageSchema(MyApplicationListItemSchema)
export type MyApplicationListItem = z.infer<typeof MyApplicationListItemSchema>
export type MyApplicationListResponse = z.infer<typeof MyApplicationListResponseSchema>

export const ApplicationListItemSchema = z.object({
  id: z.string().uuid(),
  applicantName: z.string().nullable(),
  applicantEmail: z.string().nullable(),
  appliedAt: z.string().datetime(),
  status: z.enum(['APPLIED', 'SHORTLISTED', 'REJECTED', 'WITHDRAWN', 'HIRED']),
  statusChangedAt: z.string().datetime(),
})
export const ApplicationListResponseSchema = CursorPageSchema(ApplicationListItemSchema)

export const ApplicationDetailSchema = z.object({
  id: z.string().uuid(),
  vacancyId: z.string().uuid(),
  status: z.enum(['APPLIED', 'SHORTLISTED', 'REJECTED', 'WITHDRAWN', 'HIRED']),
  statusChangedAt: z.string().datetime(),
  statusNote: z.string().nullable(),
  appliedAt: z.string().datetime(),
  responses: z.record(z.unknown()).nullable(),
  applicant: z.object({
    fullName: z.string().nullable(),
    email: z.string().nullable(),
    phoneNumber: z.string().nullable(),
    dateOfBirth: z.string().nullable(),
    gender: z.string().nullable(),
    education: z.array(z.object({
      id: z.string().uuid(),
      institutionName: z.string(),
      qualification: z.string().nullable(),
      fieldOfStudy: z.string().nullable(),
      startDate: z.string().nullable(),
      endDate: z.string().nullable(),
      isCurrent: z.boolean(),
    })),
    workHistory: z.array(z.object({
      id: z.string().uuid(),
      employerName: z.string(),
      title: z.string().nullable(),
      startDate: z.string().nullable(),
      endDate: z.string().nullable(),
      isCurrent: z.boolean(),
      description: z.string().nullable(),
    })),
    skills: z.array(z.object({
      id: z.string().uuid(),
      skillName: z.string(),
      proficiency: z.string().nullable(),
      yearsExperience: z.number().int().nullable(),
    })),
  }),
})

export const UpdateApplicationStatusSchema = z.object({
  status: z.enum(['APPLIED', 'SHORTLISTED', 'REJECTED', 'WITHDRAWN', 'HIRED']),
  statusNote: z.string().max(1000).optional(),
})

export const ApplicationFilterSchema = CursorQuerySchema.extend({
  status: z.enum(['APPLIED', 'SHORTLISTED', 'REJECTED', 'WITHDRAWN', 'HIRED']).optional(),
})

export type ApplicationListItem = z.infer<typeof ApplicationListItemSchema>
export type ApplicationDetail = z.infer<typeof ApplicationDetailSchema>
export type ApplicationListResponse = z.infer<typeof ApplicationListResponseSchema>
export type UpdateApplicationStatus = z.infer<typeof UpdateApplicationStatusSchema>
