'use client'

import { useQuery } from '@tanstack/react-query'
import {
  getPublicStats,
  listPublicVacancies,
  getPublicVacancyDetail,
  listPublicProgramCycles,
  getPublicProgramCycleDetail,
} from '@/lib/api'
import type {
  PublicStatsResponse,
  LandingPublicVacancyListResponse,
  LandingPublicVacancyDetail,
  PublicProgramCycleListResponse,
  PublicProgramCycleDetail,
} from '@/lib/api'

type PublicVacancyFilters = {
  cursor?: string
  limit?: number
  keyword?: string
  vacancyType?: string
  stateId?: number
}

export const publicKeys = {
  stats: ['public', 'stats'] as const,
  vacancyList: (filters?: PublicVacancyFilters) => ['public', 'vacancies', 'list', filters] as const,
  vacancyDetail: (id: string) => ['public', 'vacancies', 'detail', id] as const,
  programList: (params?: { cursor?: string; limit?: number }) => ['public', 'programs', 'list', params] as const,
  programDetail: (id: string) => ['public', 'programs', 'detail', id] as const,
}

export function usePublicStats() {
  return useQuery<PublicStatsResponse>({
    queryKey: publicKeys.stats,
    queryFn: getPublicStats,
    staleTime: 5 * 60_000,
  })
}

export function usePublicVacancies(filters?: PublicVacancyFilters) {
  return useQuery<LandingPublicVacancyListResponse>({
    queryKey: publicKeys.vacancyList(filters),
    queryFn: () => listPublicVacancies(filters),
    staleTime: 60_000,
    placeholderData: (prev) => prev,
  })
}

export function usePublicVacancy(id: string) {
  return useQuery<LandingPublicVacancyDetail>({
    queryKey: publicKeys.vacancyDetail(id),
    queryFn: () => getPublicVacancyDetail(id),
    staleTime: 60_000,
    enabled: !!id,
  })
}

export function usePublicProgramCycles(params?: { cursor?: string; limit?: number }) {
  return useQuery<PublicProgramCycleListResponse>({
    queryKey: publicKeys.programList(params),
    queryFn: () => listPublicProgramCycles(params),
    staleTime: 60_000,
    placeholderData: (prev) => prev,
  })
}

export function usePublicProgramCycle(id: string) {
  return useQuery<PublicProgramCycleDetail>({
    queryKey: publicKeys.programDetail(id),
    queryFn: () => getPublicProgramCycleDetail(id),
    staleTime: 60_000,
    enabled: !!id,
  })
}
