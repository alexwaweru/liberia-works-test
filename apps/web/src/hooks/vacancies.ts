'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listVacancies, createVacancy, publishVacancy, deleteVacancy } from '@/lib/api'
import type { CreateVacancyPayload } from '@/lib/api'

export const vacancyKeys = {
  all: ['vacancies'] as const,
  list: () => [...vacancyKeys.all, 'list'] as const,
}

export function useVacancies() {
  return useQuery({
    queryKey: vacancyKeys.list(),
    queryFn: listVacancies,
    staleTime: 2 * 60 * 1000,
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
