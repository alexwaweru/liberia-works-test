"use client"

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { 
  createOptIn, getCounties, getEducationLevels, getMyOptIns, getOptInByProgram, getSectors, listProgramCycles,
  getProgramCycle, listProgramMatches, optInToProgram
} from '@/lib/api'
import type { 
  OptInRequest, 
  ProgramCycleListResponse, 
  County,
  Sector,
  EducationLevel,
  MyOptInsResponse, 
  MyOptIn,
  ProgramCycleListItem, 
  ProgramPlacementListItem, 
  ProgramOptInPayload
} from '@/lib/api'

type ProgramFilters = { cursor?: string; status?: string; year?: number }

export const programKeys = {
  all: ['programs'] as const,
  list: (filters?: ProgramFilters) => [...programKeys.all, 'list', filters] as const,
  detail: (id: string) => [...programKeys.all, "detail", id] as const,
  matches: (id: string) => [...programKeys.all, "matches", id] as const,
  counties: () => [...programKeys.all, 'counties'] as const,
  sectors: () => [...programKeys.all, 'sectors'] as const,
  educationLevels: () => [...programKeys.all, 'education-levels'] as const,
  myOptIns: (cursor?: string) => [...programKeys.all, 'my-opt-ins', cursor] as const,
  optInByProgram: (programId: string) => [...programKeys.all, 'opt-in', programId] as const,
}



export function usePrograms(filters?: ProgramFilters) {
  return useQuery<ProgramCycleListResponse>({
    queryKey: programKeys.list(filters),
    queryFn: () => listProgramCycles(filters),
    staleTime: 2 * 60 * 1000,
    placeholderData: (prev) => prev,
  })
}

export function useCounties() {
  return useQuery<County[]>({
    queryKey: programKeys.counties(),
    queryFn: async () => {
      const res = await getCounties()
      return res.data
    },
    staleTime: 60 * 60 * 1000, // 1 hour - counties don't change
  })
}

export function useSectors() {
  return useQuery<Sector[]>({
    queryKey: programKeys.sectors(),
    queryFn: async () => {
      const res = await getSectors()
      return res.data
    },
    staleTime: 60 * 60 * 1000, // 1 hour
  })
}

export function useEducationLevels() {
  return useQuery<EducationLevel[]>({
    queryKey: programKeys.educationLevels(),
    queryFn: () => getEducationLevels(),
    staleTime: 60 * 60 * 1000, 
  })
}

export function useMyOptIns(cursor?: string) {
  return useQuery<MyOptInsResponse>({
    queryKey: programKeys.myOptIns(cursor),
    queryFn: () => getMyOptIns({ cursor }),
    staleTime: 60 * 1000,
  })
}

export function useOptInByProgram(programId: string, enabled = true) {
  return useQuery<MyOptIn | null>({
    queryKey: programKeys.optInByProgram(programId),
    queryFn: async () => {
      try {
        return await getOptInByProgram(programId)
      } catch (error) {
        // If 404, user hasn't opted in yet
        if (error instanceof Error && error.message.includes('not found')) {
          return null
        }
        throw error
      }
    },
    enabled,
    staleTime: 60 * 1000,
  })
}

export function useCreateOptIn() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: OptInRequest) => createOptIn(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: programKeys.myOptIns() })
      queryClient.invalidateQueries({
        queryKey: programKeys.optInByProgram(variables.programCycleId),
      })
    },
  })
}

export function useProgram(id: string) {
  return useQuery<ProgramCycleListItem>({
    queryKey: programKeys.detail(id),
    queryFn: () => getProgramCycle(id) as Promise<ProgramCycleListItem>,
    enabled: !!id,
  })
}

export function useProgramMatches(id: string) {
  return useQuery<ProgramPlacementListItem[]>({
    queryKey: programKeys.matches(id),
    queryFn: () => listProgramMatches(id) as Promise<ProgramPlacementListItem[]>,
    enabled: !!id,
  })
}

export function useOptInMutation(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: ProgramOptInPayload) => optInToProgram(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: programKeys.detail(id) })
    },
  })
}
