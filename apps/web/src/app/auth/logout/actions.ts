'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { serverFetch } from '@/lib/server-api'

export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies()
  await serverFetch('/api/v1/auth/logout', { method: 'POST' }).catch(() => {})
  cookieStore.delete('access_token')
  cookieStore.delete('refresh_token')
  redirect('/auth/login')
}
