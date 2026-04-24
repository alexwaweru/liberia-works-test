import { z } from 'zod'

export const UpdateIndividualProfileSchema = z.object({
  educationLevelId: z.string().uuid().optional(),
  vacationJobOptIn: z.boolean().optional(),
})

export const IndividualProfileResponseSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  educationLevelId: z.string().uuid().nullable(),
  profileCompletionPct: z.number().int().min(0).max(100),
  vacationJobOptIn: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export const AddEducationSchema = z.object({
  institutionName: z.string().min(2).max(300),
  qualification: z.string().max(200).optional(),
  fieldOfStudy: z.string().max(200).optional(),
  educationLevelId: z.string().uuid().optional(),
  startDate: z.string().date().optional(),
  endDate: z.string().date().optional(),
  isCurrent: z.boolean().default(false),
})

export const AddWorkHistorySchema = z.object({
  employerName: z.string().min(2).max(300),
  title: z.string().max(200).optional(),
  occupationId: z.string().uuid().optional(),
  startDate: z.string().date().optional(),
  endDate: z.string().date().optional(),
  isCurrent: z.boolean().default(false),
  description: z.string().optional(),
})

export const AddSkillSchema = z.object({
  skillName: z.string().min(1).max(200),
  proficiency: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']).optional(),
  yearsExperience: z.number().int().min(0).max(50).optional(),
})

export type UpdateIndividualProfile = z.infer<typeof UpdateIndividualProfileSchema>
export type AddEducation = z.infer<typeof AddEducationSchema>
export type AddWorkHistory = z.infer<typeof AddWorkHistorySchema>
export type AddSkill = z.infer<typeof AddSkillSchema>
