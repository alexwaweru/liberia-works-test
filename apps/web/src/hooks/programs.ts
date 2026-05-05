'use client'

import { useQuery } from '@tanstack/react-query'
import { listProgramCycles } from '@/lib/api'
import type { ProgramCycleListResponse } from '@/lib/api'

type ProgramFilters = { cursor?: string; status?: string; year?: number }

export const programKeys = {
  all: ['programs'] as const,
  list: (filters?: ProgramFilters) => [...programKeys.all, 'list', filters] as const,
}

export function usePrograms(filters?: ProgramFilters) {
  return useQuery<ProgramCycleListResponse>({
    queryKey: programKeys.list(filters),
    queryFn: () => listProgramCycles(filters),
    staleTime: 2 * 60 * 1000,
    placeholderData: (prev) => prev,
  })
}
