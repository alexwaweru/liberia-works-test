'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import { getEmployerSettings, updateEmployerSettings } from '@/lib/api'
import type { EmployerMeResponse, EmployerSettings, UpdateEmployerSettingsPayload } from '@/lib/api'

export const employerKeys = {
  me: ['employer', 'me'] as const,
  settings: ['employer', 'settings'] as const,
}

export function useCurrentEmployer() {
  return useQuery({
    queryKey: employerKeys.me,
    queryFn: () => api.get<EmployerMeResponse>('/api/v1/employers/me'),
    staleTime: 10 * 60 * 1000,
    retry: false,
  })
}

export function useEmployerSettings() {
  return useQuery<EmployerSettings>({
    queryKey: employerKeys.settings,
    queryFn: getEmployerSettings,
    staleTime: 5 * 60 * 1000,
  })
}

export function useUpdateEmployerSettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateEmployerSettingsPayload) => updateEmployerSettings(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: employerKeys.settings })
      qc.invalidateQueries({ queryKey: employerKeys.me })
    },
  })
}
