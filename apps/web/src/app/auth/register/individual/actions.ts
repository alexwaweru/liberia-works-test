'use server'

import { serverFetch } from '@/lib/server-api'

export async function registerIndividualAction(body: {
  phone: string
  fullName: string
  county: string
  dateOfBirth?: string
  gender?: 'male' | 'female' | 'unspecified'
}): Promise<{ error: string } | { success: true }> {
  const result = await serverFetch<{ message: string }>('/api/v1/auth/register/individual', {
    method: 'POST',
    body: JSON.stringify({ channel: 'SMS', ...body }),
  })

  if ('error' in result) return { error: result.error }
  return { success: true }
}
