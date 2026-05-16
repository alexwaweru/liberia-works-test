'use client'

import { useMutation } from '@tanstack/react-query'
import { acceptInvite } from '@/lib/api'
import type { AcceptInvitePayload, AcceptInviteResponse } from '@/lib/api'

export function useAcceptInvite() {
  return useMutation<AcceptInviteResponse, Error, AcceptInvitePayload>({
    mutationFn: acceptInvite,
  })
}
