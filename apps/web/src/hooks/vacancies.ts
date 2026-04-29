'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listVacancies, createVacancy, publishVacancy, deleteVacancy } from '@/lib/api'
import type { CreateVacancyPayload, VacancyListResponse } from '@/lib/api'

type VacancyFilters = { cursor?: string; status?: string; sortBy?: string; sortDir?: string }

export const vacancyKeys = {
  all: ['vacancies'] as const,
  list: (filters?: VacancyFilters) => [...vacancyKeys.all, 'list', filters] as const,
}

export function useVacancies(filters?: VacancyFilters) {
  return useQuery<VacancyListResponse>({
    queryKey: vacancyKeys.list(filters),
    queryFn: () => listVacancies(filters),
    staleTime: 2 * 60 * 1000,
    placeholderData: (prev) => prev,
  })
}

export function useCreateVacancy() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateVacancyPayload) => createVacancy(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: vacancyKeys.all }),
  })
}

export function usePublishVacancy() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => publishVacancy(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: vacancyKeys.all }),
  })
}

export function useDeleteVacancy() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteVacancy(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: vacancyKeys.all }),
  })
}
