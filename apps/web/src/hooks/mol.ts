"use client"

import { useInfiniteQuery } from '@tanstack/react-query'
import { getMolEmployers } from '@/lib/api'
import type { MolEmployerListResponse } from '@/lib/api'

export const molKeys = {
  employers: (search?: string) => ['mol', 'employers', { search }] as const,
}

export function useMolEmployers({ search }: { search?: string } = {}) {
  return useInfiniteQuery<MolEmployerListResponse>({
    queryKey: molKeys.employers(search),
    queryFn: ({ pageParam }) =>
      getMolEmployers({ cursor: pageParam as string | undefined, search: search || undefined }),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: 60 * 1000,
  })
}
