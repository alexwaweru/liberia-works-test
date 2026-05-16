'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  listWorkforceEmployees,
  getWorkforceEmployee,
  createWorkforceEmployee,
  updateWorkforceEmployee,
  deleteWorkforceEmployee,
} from '@/lib/api'
import type {
  WorkforceEmployeeListResponse,
  WorkforceEmployee,
  WorkforceEmployeeFilters,
  CreateWorkforceEmployeePayload,
} from '@/lib/api'

export const workforceKeys = {
  all: ['workforce-employees'] as const,
  list: (filters?: WorkforceEmployeeFilters) => [...workforceKeys.all, 'list', filters] as const,
  detail: (id: string) => [...workforceKeys.all, 'detail', id] as const,
}

export function useWorkforceEmployees(filters?: WorkforceEmployeeFilters) {
  return useQuery<WorkforceEmployeeListResponse>({
    queryKey: workforceKeys.list(filters),
    queryFn: () => listWorkforceEmployees(filters),
    staleTime: 2 * 60 * 1000,
    placeholderData: (prev) => prev,
  })
}

export function useWorkforceEmployee(id: string) {
  return useQuery<WorkforceEmployee>({
    queryKey: workforceKeys.detail(id),
    queryFn: () => getWorkforceEmployee(id),
    staleTime: 2 * 60 * 1000,
  })
}

export function useCreateWorkforceEmployee() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateWorkforceEmployeePayload) => createWorkforceEmployee(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: workforceKeys.all }),
  })
}

export function useUpdateWorkforceEmployee() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CreateWorkforceEmployeePayload> }) =>
      updateWorkforceEmployee(id, payload),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: workforceKeys.detail(id) })
      qc.invalidateQueries({ queryKey: workforceKeys.all })
    },
  })
}

export function useDeleteWorkforceEmployee() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteWorkforceEmployee(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: workforceKeys.all }),
  })
}
