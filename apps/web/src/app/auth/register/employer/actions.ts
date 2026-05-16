'use server'

import { redirect } from 'next/navigation'
import { serverFetch, forwardCookies } from '@/lib/server-api'

type RegisterEmployerResponse = { userId: string; role: string; expiresAt: string }

export async function registerEmployerAction(body: {
  email: string
  password: string
  fullName: string
  companyName: string
  lraRegistrationNumber: string
  primaryContactPhone?: string
}): Promise<{ error: string } | never> {
  const result = await serverFetch<RegisterEmployerResponse>('/api/v1/auth/register/employer', {
    method: 'POST',
    body: JSON.stringify(body),
  })

  if ('error' in result) return { error: result.error }

  await forwardCookies(result.headers)
  redirect('/vacancies')
}
