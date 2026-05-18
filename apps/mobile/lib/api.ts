import { getAccessToken, getRefreshToken, storeTokens, parseTokensFromCookieHeader } from './auth'

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001'

// ─── Types ────────────────────────────────────────────────────────────────────

export type AuthTokenResponse = {
  userId: string
  role: string
  expiresAt: string
  accessToken?: string
}

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

export type IndividualProfile = {
  id: string
  userId: string
  fullName: string | null
  email: string | null
  phoneNumber: string | null
  dateOfBirth: string | null
  gender: string | null
  nin: string | null
  address: {
    id: string
    countryId: number
    stateId: number | null
    cityId: number | null
    addressLine1: string | null
    addressLine2: string | null
  } | null
}

export type EducationRecord = {
  id: string
  institutionName: string
  qualification: string | null
  fieldOfStudy: string | null
  startDate: string | null
  endDate: string | null
  isCurrent: boolean
}

export type WorkHistoryRecord = {
  id: string
  employerName: string
  title: string | null
  startDate: string | null
  endDate: string | null
  isCurrent: boolean
  description: string | null
}

export type PublicVacancyListItem = {
  id: string
  employerId: string
  companyName: string
  title: string
  vacancyType: string
  stateId: number
  sectorId: string | null
  slotsAvailable: number
  deadline: string
  postedAt: string | null
}

export type PublicVacancyDetail = PublicVacancyListItem & {
  description: string
  applicationForm: {
    sections: {
      fields: {
        id: string
        label: string
        type: string
        validation?: Record<string, unknown>
      }[]
    }[]
  } | null
}

export type MyApplicationListItem = {
  id: string
  vacancyId: string
  vacancyTitle: string
  companyName: string
  appliedAt: string
  status: 'APPLIED' | 'SHORTLISTED' | 'REJECTED' | 'WITHDRAWN' | 'HIRED'
}

export type MyApplicationListResponse = {
  data: MyApplicationListItem[]
  pagination: { nextCursor: string | null; hasMore: boolean; total: number }
}

export type PublicVacancyListResponse = {
  data: PublicVacancyListItem[]
  pagination: { nextCursor: string | null; hasMore: boolean; total: number }
}

export type ProgramCycleListItem = {
  id: string
  type: string
  name: string
  description: string | null
  year: number
  startDate: string
  endDate: string
  status: string
}

export type ProgramCycleListResponse = {
  data: ProgramCycleListItem[]
  pagination: { nextCursor: string | null; hasMore: boolean; total: number }
}

export type StateItem = {
  id: number
  name: string
  code: string
  countryId: number
}

// ─── XHR-based auth calls (to access raw set-cookie headers) ──────────────────

function xhrPost<T>(
  path: string,
  body: Record<string, unknown>,
): Promise<{ data: T; cookieHeader: string | null }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `${API_BASE}${path}`)
    xhr.setRequestHeader('Content-Type', 'application/json')
    xhr.withCredentials = true

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        let data: T
        try {
          data = JSON.parse(xhr.responseText)
        } catch {
          data = undefined as unknown as T
        }
        const cookieHeader = xhr.getResponseHeader('set-cookie')
        resolve({ data, cookieHeader })
      } else {
        let message = `Request failed: ${xhr.status}`
        try {
          const body = JSON.parse(xhr.responseText)
          if (body?.message) message = body.message
        } catch {}
        reject(new Error(message))
      }
    }

    xhr.onerror = () => reject(new Error('Network error'))
    xhr.send(JSON.stringify(body))
  })
}

// ─── Fetch-based calls (authenticated, includes stored cookie) ────────────────

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = await getAccessToken()
  const headers: Record<string, string> = {}

  if (options?.body) {
    headers['Content-Type'] = 'application/json'
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...headers, ...options?.headers },
  })

  if (res.status === 401) {
    // Attempt token refresh
    const refreshed = await attemptRefresh()
    if (refreshed) {
      const newToken = await getAccessToken()
      const retryHeaders: Record<string, string> = { ...headers }
      if (newToken) retryHeaders['Authorization'] = `Bearer ${newToken}`
      const retry = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers: { ...retryHeaders, ...options?.headers },
      })
      if (!retry.ok) {
        const body = await retry.json().catch(() => ({}))
        throw new Error((body as { message?: string }).message ?? `Request failed: ${retry.status}`)
      }
      if (retry.status === 204) return undefined as T
      return retry.json() as Promise<T>
    }
    throw new Error('Unauthorized')
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error((body as { message?: string }).message ?? `Request failed: ${res.status}`)
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

async function attemptRefresh(): Promise<boolean> {
  const refreshToken = await getRefreshToken()
  if (!refreshToken) return false

  try {
    // Use XHR so we can read the set-cookie response header for the new access_token.
    return await new Promise<boolean>((resolve) => {
      const xhr = new XMLHttpRequest()
      xhr.open('POST', `${API_BASE}/api/v1/auth/refresh`)
      xhr.setRequestHeader('Content-Type', 'application/json')
      xhr.setRequestHeader('Cookie', `refresh_token=${refreshToken}`)

      xhr.onload = async () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const cookieHeader = xhr.getResponseHeader('set-cookie')
          const { accessToken, refreshToken: newRefresh } = parseTokensFromCookieHeader(cookieHeader)
          if (accessToken) {
            await storeTokens(accessToken, newRefresh ?? undefined)
            resolve(true)
          } else {
            resolve(false)
          }
        } else {
          resolve(false)
        }
      }
      xhr.onerror = () => resolve(false)
      xhr.send(JSON.stringify({}))
    })
  } catch {
    return false
  }
}

// ─── Auth endpoints ────────────────────────────────────────────────────────────

export async function loginWithPassword(body: {
  phoneNumber?: string
  email?: string
  password: string
}): Promise<AuthTokenResponse> {
  const { data, cookieHeader } = await xhrPost<AuthTokenResponse>('/api/v1/auth/login', body)
  if (data?.accessToken) {
    const { refreshToken } = parseTokensFromCookieHeader(cookieHeader)
    await storeTokens(data.accessToken, refreshToken ?? undefined)
  }
  return data
}

export async function registerIndividual(body: {
  phone: string
  fullName: string
  countyId: number
  password: string
  channel?: 'SMS' | 'WHATSAPP'
  email?: string
  dateOfBirth?: string
  gender?: string
}): Promise<{ message: string }> {
  const { data } = await xhrPost<{ message: string }>('/api/v1/auth/register/individual', {
    channel: 'SMS',
    ...body,
  })
  return data
}

export async function requestOtp(body: {
  phone: string
  channel?: 'SMS' | 'WHATSAPP'
}): Promise<{ message: string }> {
  const { data } = await xhrPost<{ message: string }>('/api/v1/auth/otp/request', {
    channel: 'SMS',
    ...body,
  })
  return data
}

export async function verifyOtp(body: {
  phone: string
  otp: string
  purpose: 'REGISTRATION' | 'LOGIN'
}): Promise<AuthTokenResponse> {
  const { data, cookieHeader } = await xhrPost<AuthTokenResponse>('/api/v1/auth/otp/verify', body)
  if (data?.accessToken) {
    const { refreshToken } = parseTokensFromCookieHeader(cookieHeader)
    await storeTokens(data.accessToken, refreshToken ?? undefined)
  }
  return data
}

export function logout() {
  return apiFetch<{ message: string }>('/api/v1/auth/logout', { method: 'POST' })
}

export function getMe() {
  return apiFetch<MeResponse>('/api/v1/auth/me')
}

// ─── Individual profile ────────────────────────────────────────────────────────

export function getIndividualProfile() {
  return apiFetch<IndividualProfile>('/api/v1/individuals/me')
}

export function updateIndividualProfile(body: {
  fullName?: string
  dateOfBirth?: string
  gender?: string
  nin?: string
}) {
  return apiFetch<IndividualProfile>('/api/v1/individuals/me', {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}

export function getEducation() {
  return apiFetch<EducationRecord[]>('/api/v1/individuals/me/education')
}

export function addEducation(body: {
  institutionName: string
  qualification?: string
  fieldOfStudy?: string
  startDate?: string
  endDate?: string
  isCurrent?: boolean
}) {
  return apiFetch<EducationRecord>('/api/v1/individuals/me/education', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function deleteEducation(id: string) {
  return apiFetch<void>(`/api/v1/individuals/me/education/${id}`, { method: 'DELETE' })
}

export function getWorkHistory() {
  return apiFetch<WorkHistoryRecord[]>('/api/v1/individuals/me/work-history')
}

export function addWorkHistory(body: {
  employerName: string
  title?: string
  startDate?: string
  endDate?: string
  isCurrent?: boolean
  description?: string
}) {
  return apiFetch<WorkHistoryRecord>('/api/v1/individuals/me/work-history', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function deleteWorkHistory(id: string) {
  return apiFetch<void>(`/api/v1/individuals/me/work-history/${id}`, { method: 'DELETE' })
}

// ─── Vacancies ─────────────────────────────────────────────────────────────────

export function browseVacancies(params?: {
  cursor?: string
  keyword?: string
  vacancyType?: string
  stateId?: number
}) {
  const q = new URLSearchParams()
  if (params?.cursor) q.set('cursor', params.cursor)
  if (params?.keyword) q.set('keyword', params.keyword)
  if (params?.vacancyType) q.set('vacancyType', params.vacancyType)
  if (params?.stateId) q.set('stateId', String(params.stateId))
  const qs = q.toString()
  return apiFetch<PublicVacancyListResponse>(`/api/v1/vacancies/browse${qs ? `?${qs}` : ''}`)
}

export function getPublicVacancy(id: string) {
  return apiFetch<PublicVacancyDetail>(`/api/v1/vacancies/browse/${id}`)
}

export function createApplication(vacancyId: string, body: { responses?: Record<string, unknown> }) {
  return apiFetch<{ message: string }>(`/api/v1/vacancies/${vacancyId}/applications`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

// ─── My applications ───────────────────────────────────────────────────────────

export function listMyApplications(params?: { cursor?: string }) {
  const q = new URLSearchParams()
  if (params?.cursor) q.set('cursor', params.cursor)
  const qs = q.toString()
  return apiFetch<MyApplicationListResponse>(`/api/v1/individuals/me/applications${qs ? `?${qs}` : ''}`)
}

// ─── Programs ──────────────────────────────────────────────────────────────────

export function listProgramCycles(params?: { cursor?: string; status?: string; year?: number }) {
  const q = new URLSearchParams()
  if (params?.cursor) q.set('cursor', params.cursor)
  if (params?.status) q.set('status', params.status)
  if (params?.year) q.set('year', String(params.year))
  const qs = q.toString()
  return apiFetch<ProgramCycleListResponse>(`/api/v1/programs/cycles${qs ? `?${qs}` : ''}`)
}

export type ProgramCycleDetail = ProgramCycleListItem & {
  createdAt: string
  updatedAt: string
}

export function getProgramCycle(id: string) {
  return apiFetch<ProgramCycleDetail>(`/api/v1/programs/cycles/${id}`)
}

export type ProgramOptIn = {
  id: string
  programCycleId: string
  status: string
  additionalNotes: string | null
  matchedEmployerId: string | null
  matchedAt: string | null
  createdAt: string
  programCycle: { id: string; name: string; year: number; status: string }
  preferredSectors: { id: string; name: string; code: string | null }[]
  preferredCounties: { id: number; name: string; code: string | null }[]
  preferredEducationLevel: { id: string; name: string; code: string } | null
  matchedEmployer: { id: string; companyName: string } | null
}

export type MyOptInsResponse = {
  data: ProgramOptIn[]
  pagination: { nextCursor: string | null; hasMore: boolean; total: number }
}

export function getMyOptIns() {
  return apiFetch<MyOptInsResponse>('/api/v1/programs/my-opt-ins')
}

export function optInToProgram(body: { programCycleId: string; additionalNotes?: string }) {
  return apiFetch<{ id: string; status: string }>('/api/v1/programs/opt-in', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

// ─── Reference ─────────────────────────────────────────────────────────────────

export function getLiberiaCounties() {
  return apiFetch<StateItem[]>('/api/v1/reference/states?countryCode=LR')
}
