'use client'
import { useQuery } from '@tanstack/react-query'
import { browseVacancies } from '@/lib/api'
import type { PublicVacancyListResponse } from '@/lib/api'

type JobFilters = { cursor?: string; keyword?: string; vacancyType?: string; stateId?: number }

export const jobKeys = {
  all: ['jobs'] as const,
  list: (filters?: JobFilters) => [...jobKeys.all, 'list', filters] as const,
}

export function useJobListings(filters?: JobFilters) {
  return useQuery<PublicVacancyListResponse>({
    queryKey: jobKeys.list(filters),
    queryFn: () => browseVacancies(filters),
    staleTime: 2 * 60 * 1000,
    placeholderData: (prev) => prev,
  })
}
