const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error((body as { message?: string }).message ?? `Request failed: ${res.status}`)
  }
  return res.json() as Promise<T>
}

export type AuthTokenResponse = { userId: string; role: string; expiresAt: string }
export type EmployerMeResponse = { id: string; companyName: string }
export type MeResponse = {
  id: string
  role: string
  email: string | null
  phoneNumber: string | null
  isPhoneVerified: boolean
  isEmailVerified: boolean
  fullName: string | null
  gender: 'MALE' | 'FEMALE' | 'PREFER_NOT_TO_SAY' | null
}

export function registerIndividual(body: {
  phone: string
  fullName: string
  channel?: 'SMS' | 'WHATSAPP'
}) {
  return apiFetch<{ message: string }>('/api/v1/auth/register/individual', {
    method: 'POST',
    body: JSON.stringify({ channel: 'SMS', ...body }),
  })
}

export function registerEmployer(body: {
  email: string
  password: string
  fullName: string
  companyName: string
  lraRegistrationNumber: string
}) {
  return apiFetch<AuthTokenResponse>('/api/v1/auth/register/employer', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function requestOtp(body: { phone: string; channel?: 'SMS' | 'WHATSAPP' }) {
  return apiFetch<{ message: string }>('/api/v1/auth/otp/request', {
    method: 'POST',
    body: JSON.stringify({ channel: 'SMS', ...body }),
  })
}

export function verifyOtp(body: { phone: string; otp: string }) {
  return apiFetch<AuthTokenResponse>('/api/v1/auth/otp/verify', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function login(body: { email?: string; phoneNumber?: string; password: string }) {
  return apiFetch<AuthTokenResponse>('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function logout() {
  return apiFetch<{ message: string }>('/api/v1/auth/logout', { method: 'POST' })
}

export function getMe() {
  return apiFetch<MeResponse>('/api/v1/auth/me')
}

export type VacancyResponse = {
  id: string
  employerId: string
  title: string
  description: string
  vacancyType: string
  stateId: number
  sectorId: string | null
  occupationId: string | null
  minimumEducationLevelId: string | null
  slotsAvailable: number
  deadline: string
  isMandatoryAdvertised: boolean
  status: string
  applicationForm: Record<string, unknown> | null
  postedAt: string | null
  createdAt: string
  updatedAt: string
}

export type CreateVacancyPayload = {
  title: string
  description: string
  vacancyType: 'VACATION_JOB' | 'PERMANENT' | 'CONTRACT' | 'INTERNSHIP'
  stateId: number
  sectorId?: string
  slotsAvailable: number
  deadline: string
  isMandatoryAdvertised?: boolean
  applicationForm?: Record<string, unknown>
}

export function listVacancies() {
  return apiFetch<VacancyResponse[]>('/api/v1/vacancies')
}

export function createVacancy(body: CreateVacancyPayload) {
  return apiFetch<VacancyResponse>('/api/v1/vacancies', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function publishVacancy(id: string) {
  return apiFetch<VacancyResponse>(`/api/v1/vacancies/${id}/publish`, { method: 'POST' })
}

export function deleteVacancy(id: string) {
  return apiFetch<{ message: string }>(`/api/v1/vacancies/${id}`, { method: 'DELETE' })
}
