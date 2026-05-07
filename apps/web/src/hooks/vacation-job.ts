"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getMyPlacement, confirmPlacement } from "@/lib/api"
import type { MyPlacementResponse } from "@/lib/api"

export const vacationJobKeys = {
  all: ["vacation-job"] as const,
  myPlacement: () => [...vacationJobKeys.all, "my-placement"] as const,
}

export function useMyPlacement() {
  return useQuery<MyPlacementResponse | null>({
    queryKey: vacationJobKeys.myPlacement(),
    queryFn: () => getMyPlacement() as Promise<MyPlacementResponse | null>,
  })
}

export function useConfirmPlacement() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (code: string) => confirmPlacement(code),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vacationJobKeys.myPlacement() })
    },
  })
}
