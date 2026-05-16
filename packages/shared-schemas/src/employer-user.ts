import { z } from 'zod'
import { CursorQuerySchema, CursorPageSchema } from './common.js'

export const InviteEmployerUserSchema = z.object({
  email: z.string().email(),
  role: z.enum(['ADMIN', 'HR']),
})

export const AcceptInviteSchema = z.object({
  token: z.string().min(1),
  fullName: z.string().min(1).max(200).optional(),
  password: z.string().min(8).max(200).optional(),
})

export const UpdateEmployerUserRoleSchema = z.object({
  role: z.enum(['ADMIN', 'HR']),
})

export const EmployerUserListItemSchema = z.object({
  id: z.string().uuid(),
  // userId is null for pending invites that have no associated user yet
  userId: z.string().uuid().nullable(),
  email: z.string().email(),
  fullName: z.string().nullable(),
  role: z.enum(['ADMIN', 'HR']),
  status: z.enum(['PENDING', 'ACTIVE', 'INACTIVE']),
  invitedAt: z.string().datetime().nullable(),
  acceptedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
})

export const EmployerUserListResponseSchema = CursorPageSchema(EmployerUserListItemSchema)

export type InviteEmployerUser = z.infer<typeof InviteEmployerUserSchema>
export type AcceptInvite = z.infer<typeof AcceptInviteSchema>
export type UpdateEmployerUserRole = z.infer<typeof UpdateEmployerUserRoleSchema>
export type EmployerUserListItem = z.infer<typeof EmployerUserListItemSchema>
export type EmployerUserListResponse = z.infer<typeof EmployerUserListResponseSchema>
