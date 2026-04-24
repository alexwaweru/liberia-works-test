'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/api/client'
import { useAuthStore } from '@/stores/auth-store'
import type { MeResponse } from '@/lib/api'

export const authKeys = {
  me: ['auth', 'me'] as const,
}

export function useCurrentUser() {
  const setUser = useAuthStore((s) => s.setUser)
  return useQuery({
    queryKey: authKeys.me,
    queryFn: async () => {
      const user = await api.get<MeResponse>('/api/v1/auth/me')
      setUser({ id: user.id, role: user.role })
      return user
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  })
}
