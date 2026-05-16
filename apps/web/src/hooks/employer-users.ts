'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  listEmployerUsers,
  inviteEmployerUser,
  resendEmployerInvite,
  revokeEmployerInvite,
  updateEmployerUserRole,
  removeEmployerUser,
} from '@/lib/api'
import type { EmployerUserListResponse } from '@/lib/api'

export const employerUserKeys = {
  all: ['employer-users'] as const,
  list: (cursor?: string) => [...employerUserKeys.all, 'list', cursor] as const,
}

export function useEmployerUsers(cursor?: string) {
  return useQuery<EmployerUserListResponse>({
    queryKey: employerUserKeys.list(cursor),
    queryFn: () => listEmployerUsers(cursor),
    staleTime: 2 * 60 * 1000,
    placeholderData: (prev) => prev,
  })
}

export function useInviteEmployerUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: { email: string; role: 'ADMIN' | 'HR' }) =>
      inviteEmployerUser(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: employerUserKeys.all }),
  })
}

export function useResendInvite() {
  return useMutation({
    mutationFn: (inviteId: string) => resendEmployerInvite(inviteId),
  })
}

export function useRevokeInvite() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (inviteId: string) => revokeEmployerInvite(inviteId),
    onSuccess: () => qc.invalidateQueries({ queryKey: employerUserKeys.all }),
  })
}

export function useUpdateEmployerUserRole() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: 'ADMIN' | 'HR' }) =>
      updateEmployerUserRole(userId, role),
    onSuccess: () => qc.invalidateQueries({ queryKey: employerUserKeys.all }),
  })
}

export function useRemoveEmployerUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (userId: string) => removeEmployerUser(userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: employerUserKeys.all }),
  })
}
