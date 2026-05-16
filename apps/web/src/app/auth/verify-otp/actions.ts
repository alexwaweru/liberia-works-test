'use server'

import { redirect } from 'next/navigation'
import { serverFetch, forwardCookies } from '@/lib/server-api'

type OtpVerifyResponse = { userId: string; role: string; expiresAt: string }

export async function verifyOtpAction(body: {
  phone: string
  otp: string
}): Promise<{ error: string } | never> {
  const result = await serverFetch<OtpVerifyResponse>('/api/v1/auth/otp/verify', {
    method: 'POST',
    body: JSON.stringify({ ...body, purpose: 'REGISTRATION' }),
  })
  if ('error' in result) return { error: result.error }
  await forwardCookies(result.headers)
  const role = result.data.role
  if (role === 'INDIVIDUAL') redirect('/me/jobs')
  if (role === 'EMPLOYER_ADMIN' || role === 'EMPLOYER_HR') redirect('/vacancies')
  if (role === 'MOL_OFFICER' || role === 'MOL_DIRECTOR') redirect('/mol/overview')
  redirect('/')
}

export async function requestOtpAction(body: {
  phone: string
}): Promise<{ error: string } | { success: true }> {
  const result = await serverFetch<{ message: string }>('/api/v1/auth/otp/request', {
    method: 'POST',
    body: JSON.stringify({ phone: body.phone, channel: 'SMS', purpose: 'REGISTRATION' }),
  })
  if ('error' in result) return { error: result.error }
  return { success: true }
}
