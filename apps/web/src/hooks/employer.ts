'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/api/client'
import type { EmployerMeResponse } from '@/lib/api'

export const employerKeys = {
  me: ['employer', 'me'] as const,
}

export function useCurrentEmployer() {
  return useQuery({
    queryKey: employerKeys.me,
    queryFn: () => api.get<EmployerMeResponse>('/api/v1/employers/me'),
    staleTime: 10 * 60 * 1000,
    retry: false,
  })
}
