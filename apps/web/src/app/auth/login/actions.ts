'use server'

import { redirect } from 'next/navigation'
import { serverFetch, forwardCookies } from '@/lib/server-api'

type LoginResponse = { userId: string; role: string; expiresAt: string }

function roleRedirect(role: string): string {
  if (role === 'INDIVIDUAL') return '/profile'
  if (role === 'EMPLOYER_ADMIN' || role === 'EMPLOYER_HR') return '/dashboard'
  if (role === 'MOL_OFFICER' || role === 'MOL_DIRECTOR') return '/mol/overview'
  return '/'
}

export async function loginAction(credentials: {
  email?: string
  phoneNumber?: string
  password: string
}): Promise<{ error: string } | never> {
  const result = await serverFetch<LoginResponse>('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  })

  if ('error' in result) return { error: result.error }

  await forwardCookies(result.headers)
  redirect(roleRedirect(result.data.role))
}
