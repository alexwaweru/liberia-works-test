const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: {
      ...(options?.body ? { 'Content-Type': 'application/json' } : {}),
      ...options?.headers,
    },
    ...options,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error((body as { message?: string }).message ?? `Request failed: ${res.status}`)
  }
  if (res.status === 204) return undefined as T
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

export type VacancyListItem = VacancyResponse & { applicationsCount: number }

export type VacancyListResponse = {
  data: VacancyListItem[]
  pagination: {
    nextCursor: string | null
    hasMore: boolean
    total: number
  }
}

export function listVacancies(params?: {
  cursor?: string
  status?: string
  sortBy?: string
  sortDir?: string
}) {
  const q = new URLSearchParams()
  if (params?.cursor) q.set('cursor', params.cursor)
  if (params?.status) q.set('status', params.status)
  if (params?.sortBy) q.set('sortBy', params.sortBy)
  if (params?.sortDir) q.set('sortDir', params.sortDir)
  const qs = q.toString()
  return apiFetch<VacancyListResponse>(`/api/v1/vacancies${qs ? `?${qs}` : ''}`)
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

export type IndividualProfile = {
  id: string
  userId: string
  fullName: string | null
  email: string | null
  phoneNumber: string | null
  dateOfBirth: string | null
  gender: string | null
  nin: string | null
  address: { id: string; countryId: number; stateId: number | null; cityId: number | null; addressLine1: string | null; addressLine2: string | null } | null
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

export function getIndividualProfile() {
  return apiFetch<IndividualProfile>('/api/v1/individuals/me')
}

export function updateIndividualProfile(body: Partial<{ fullName: string; dateOfBirth: string; gender: string; nin: string }>) {
  return apiFetch<IndividualProfile>('/api/v1/individuals/me', { method: 'PATCH', body: JSON.stringify(body) })
}

export function getEducation() {
  return apiFetch<EducationRecord[]>('/api/v1/individuals/me/education')
}

export function addEducation(body: object) {
  return apiFetch<EducationRecord>('/api/v1/individuals/me/education', { method: 'POST', body: JSON.stringify(body) })
}

export function deleteEducation(id: string) {
  return apiFetch<void>(`/api/v1/individuals/me/education/${id}`, { method: 'DELETE' })
}

export function getWorkHistory() {
  return apiFetch<WorkHistoryRecord[]>('/api/v1/individuals/me/work-history')
}

export function addWorkHistory(body: object) {
  return apiFetch<WorkHistoryRecord>('/api/v1/individuals/me/work-history', { method: 'POST', body: JSON.stringify(body) })
}

export function deleteWorkHistory(id: string) {
  return apiFetch<void>(`/api/v1/individuals/me/work-history/${id}`, { method: 'DELETE' })
}

export function updateAddress(body: { countryId?: number; stateId?: number; cityId?: number; addressLine1?: string; addressLine2?: string }) {
  return apiFetch<void>('/api/v1/individuals/me/address', { method: 'PATCH', body: JSON.stringify(body) })
}

export function changePassword(body: { currentPassword: string; newPassword: string }) {
  return apiFetch<{ message: string }>('/api/v1/auth/change-password', { method: 'POST', body: JSON.stringify(body) })
}

export type SessionItem = {
  id: string
  userAgent: string | null
  ipAddress: string | null
  issuedAt: string
  expiresAt: string
  isCurrent: boolean
}

export function getSessions() {
  return apiFetch<SessionItem[]>('/api/v1/auth/sessions')
}

export function revokeSession(id: string) {
  return apiFetch<{ message: string }>(`/api/v1/auth/sessions/${id}`, { method: 'DELETE' })
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
  createdAt: string
  updatedAt: string
}

export type ProgramCycleListResponse = {
  data: ProgramCycleListItem[]
  pagination: {
    nextCursor: string | null
    hasMore: boolean
    total: number
  }
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
  applicationForm: Record<string, unknown> | null
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

export function listProgramCycles(params?: { cursor?: string; status?: string; year?: number }) {
  const q = new URLSearchParams()
  if (params?.cursor) q.set('cursor', params.cursor)
  if (params?.status) q.set('status', params.status)
  if (params?.year) q.set('year', String(params.year))
  const qs = q.toString()
  return apiFetch<ProgramCycleListResponse>(`/api/v1/programs/cycles${qs ? `?${qs}` : ''}`)
}

export type ApplicationListItem = {
  id: string
  applicantName: string | null
  applicantEmail: string | null
  appliedAt: string
  status: 'APPLIED' | 'SHORTLISTED' | 'REJECTED' | 'WITHDRAWN' | 'HIRED'
  statusChangedAt: string
}

export type ApplicationListResponse = {
  data: ApplicationListItem[]
  pagination: { nextCursor: string | null; hasMore: boolean; total: number }
}

export type ApplicationDetail = {
  id: string
  vacancyId: string
  status: 'APPLIED' | 'SHORTLISTED' | 'REJECTED' | 'WITHDRAWN' | 'HIRED'
  statusChangedAt: string
  statusNote: string | null
  appliedAt: string
  responses: Record<string, unknown> | null
  applicant: {
    fullName: string | null
    email: string | null
    phoneNumber: string | null
    dateOfBirth: string | null
    gender: string | null
    education: Array<{
      id: string
      institutionName: string
      qualification: string | null
      fieldOfStudy: string | null
      startDate: string | null
      endDate: string | null
      isCurrent: boolean
    }>
    workHistory: Array<{
      id: string
      employerName: string
      title: string | null
      startDate: string | null
      endDate: string | null
      isCurrent: boolean
      description: string | null
    }>
    skills: Array<{
      id: string
      skillName: string
      proficiency: string | null
      yearsExperience: number | null
    }>
  }
}

export function listApplications(vacancyId: string, params?: { cursor?: string; status?: string }) {
  const q = new URLSearchParams()
  if (params?.cursor) q.set('cursor', params.cursor)
  if (params?.status) q.set('status', params.status)
  const qs = q.toString()
  return apiFetch<ApplicationListResponse>(`/api/v1/vacancies/${vacancyId}/applications${qs ? `?${qs}` : ''}`)
}

export function getApplication(vacancyId: string, applicationId: string) {
  return apiFetch<ApplicationDetail>(`/api/v1/vacancies/${vacancyId}/applications/${applicationId}`)
}

export function updateApplicationStatus(applicationId: string, body: { status: string; statusNote?: string }) {
  return apiFetch<{ message: string }>(`/api/v1/applications/${applicationId}/status`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}

export function getVacancy(id: string) {
  return apiFetch<VacancyResponse>(`/api/v1/vacancies/${id}`)
}

export type UpdateVacancyPayload = Partial<CreateVacancyPayload>

export function updateVacancy(id: string, body: UpdateVacancyPayload) {
  return apiFetch<VacancyResponse>(`/api/v1/vacancies/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
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

export function listMyApplications(params?: { cursor?: string }) {
  const q = new URLSearchParams()
  if (params?.cursor) q.set('cursor', params.cursor)
  const qs = q.toString()
  return apiFetch<MyApplicationListResponse>(`/api/v1/individuals/me/applications${qs ? `?${qs}` : ''}`)
}
