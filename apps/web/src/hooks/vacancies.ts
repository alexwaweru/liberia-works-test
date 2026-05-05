'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listVacancies, createVacancy, publishVacancy, deleteVacancy, getVacancy, updateVacancy } from '@/lib/api'
import type { CreateVacancyPayload, UpdateVacancyPayload, VacancyListResponse, VacancyResponse } from '@/lib/api'

type VacancyFilters = { cursor?: string; status?: string; sortBy?: string; sortDir?: string }

export const vacancyKeys = {
  all: ['vacancies'] as const,
  list: (filters?: VacancyFilters) => [...vacancyKeys.all, 'list', filters] as const,
  detail: (id: string) => [...vacancyKeys.all, 'detail', id] as const,
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

export function useVacancy(id: string) {
  return useQuery<VacancyResponse>({
    queryKey: vacancyKeys.detail(id),
    queryFn: () => getVacancy(id),
    staleTime: 2 * 60 * 1000,
  })
}

export function useUpdateVacancy(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateVacancyPayload) => updateVacancy(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: vacancyKeys.detail(id) })
      qc.invalidateQueries({ queryKey: vacancyKeys.all })
    },
  })
}
