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

export type County = {
  id: number
  name: string
  code: string | null
}

export type Sector = {
  id: string
  name: string
  code: string
}

export type EducationLevel = {
  id: string
  name: string
  code: string
}

export type OptInRequest = {
  programCycleId: string
  preferredSectors: string[]
  preferredCounties: number[]
  preferredEducationLevelId?: string
  additionalNotes?: string
}

export type OptInResponse = {
  id: string
  individualId: string
  programCycleId: string
  status: 'PENDING' | 'MATCHED' | 'DECLINED' | 'WITHDRAWN'
  preferredSectors: string[]
  preferredCounties: number[]
  preferredEducationLevelId: string | null
  additionalNotes: string | null
  matchedEmployerId: string | null
  matchedAt: string | null
  createdAt: string
}

export type MyOptIn = {
  id: string
  individualId: string
  programCycleId: string
  status: 'PENDING' | 'MATCHED' | 'DECLINED' | 'WITHDRAWN'
  preferredSectors: Array<{ id: string; name: string; code: string | null }>
  preferredCounties: Array<{ id: number; name: string; code: string | null }>
  preferredEducationLevel: { id: string; name: string; code: string } | null
  additionalNotes: string | null
  matchedEmployerId: string | null
  matchedAt: string | null
  createdAt: string
  programCycle: {
    id: string
    name: string
    year: number
    status: string
  }
  matchedEmployer: {
    id: string
    companyName: string
  } | null
}

export type MyOptInsResponse = {
  data: MyOptIn[]
  pagination: {
    nextCursor: string | null
    hasMore: boolean
    total: number
  }
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

export function getCounties() {
  return apiFetch<{ data: County[] }>('/api/v1/programs/counties')
}

export function getSectors() {
  return apiFetch<{ data: Sector[] }>('/api/v1/programs/sectors')
}

export function getEducationLevels() {
  return apiFetch<EducationLevel[]>('/api/v1/reference/education-levels')
}

export function createOptIn(body: OptInRequest) {
  return apiFetch<OptInResponse>('/api/v1/programs/opt-in', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}


export type ProgramOptInPayload = {
  contactName: string
  contactPhone: string
  preferredSectors: string[]
  preferredEducationLevelId?: string
  placementInstructions?: string
  capacities: Array<{ stateId: number; slotsOffered: number }>
}

export type ProgramPlacementListItem = {
  id: string
  matchDate: string
  status: string
  individual: {
    id: string
    fullName: string
    email: string | null
    phoneNumber: string | null
    dateOfBirth: string | null
    gender: string | null
    education: Array<{
      institutionName: string
      qualification: string | null
      fieldOfStudy: string | null
    }>
    experience: Array<{
      employerName: string
      title: string | null
    }>
  }
}

export type MyPlacementResponse = {
  id: string
  matchDate: string
  status: string
  employer: {
    companyName: string
    primaryContactName: string
    primaryContactPhone: string
  }
  cycle: {
    name: string
    startDate: string
  }
}

export function getProgramCycle(id: string) {
  return apiFetch<ProgramCycleListItem>(`/api/v1/programs/cycles/${id}`)
}

export type UpdateProgramCyclePayload = {
  name?: string
  year?: number
  type?: 'VACATION_JOB'
  status?: 'PLANNED' | 'OPEN' | 'MATCHING' | 'COMPLETED'
  startDate?: string
  endDate?: string
  description?: string
}

export type CreateProgramCyclePayload = {
  name: string
  year: number
  startDate: string
  endDate: string
  type?: 'VACATION_JOB'
  status?: 'PLANNED' | 'OPEN' | 'MATCHING' | 'COMPLETED'
  description?: string
}

export type DeleteProgramCycleConflict = {
  error: string
  message: string
  details: { optIns: number; hostingCapacities: number; placements: number }
}

export function updateProgramCycle(id: string, body: UpdateProgramCyclePayload) {
  return apiFetch<ProgramCycleListItem>(`/api/v1/programs/cycles/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}

export function createProgramCycle(body: CreateProgramCyclePayload) {
  return apiFetch<ProgramCycleListItem>('/api/v1/programs/cycles', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function deleteProgramCycle(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/v1/programs/cycles/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  })
  if (res.status === 204) return
  const body = await res.json().catch(() => ({}))
  const err = new Error((body as { message?: string }).message ?? `Request failed: ${res.status}`)
  ;(err as Error & { status: number; details?: DeleteProgramCycleConflict['details'] }).status = res.status
  ;(err as Error & { status: number; details?: DeleteProgramCycleConflict['details'] }).details =
    (body as DeleteProgramCycleConflict).details
  throw err
}

export type MolEmployerItem = {
  id: string
  companyName: string
  lraRegistrationNumber: string
  primaryContactName: string
  primaryContactEmail: string
  primaryContactPhone: string
  stateId: number | null
  stateName: string | null
  createdAt: string
  metrics: {
    vacanciesTotal: number
    vacanciesActive: number
    employees: number
    workPermits: number
    disputes: number
    placements: number
  }
}

export type MolEmployerListResponse = {
  items: MolEmployerItem[]
  nextCursor: string | null
}

export function getMolEmployers(params?: { cursor?: string; limit?: number; search?: string }) {
  const q = new URLSearchParams()
  if (params?.cursor) q.set('cursor', params.cursor)
  if (params?.limit) q.set('limit', String(params.limit))
  if (params?.search) q.set('search', params.search)
  const qs = q.toString()
  return apiFetch<MolEmployerListResponse>(`/api/v1/mol/employers${qs ? `?${qs}` : ''}`)
}

export function optInToProgram(id: string, body: ProgramOptInPayload) {
  return apiFetch(`/api/v1/programs/cycles/${id}/opt-in`, {
    method: "POST",
    body: JSON.stringify(body),
  })
}

export function getMyOptIns(params?: { cursor?: string }) {
  const q = new URLSearchParams()
  if (params?.cursor) q.set('cursor', params.cursor)
  const qs = q.toString()
  return apiFetch<MyOptInsResponse>(`/api/v1/programs/my-opt-ins${qs ? `?${qs}` : ''}`)
}

export function getOptInByProgram(programCycleId: string) {
  return apiFetch<MyOptIn>(`/api/v1/programs/opt-ins/by-program/${programCycleId}`)
}

export function listProgramMatches(id: string) {
  return apiFetch(`/api/v1/programs/cycles/${id}/matches`)
}

export function confirmPlacement(code: string) {
  return apiFetch("/api/v1/vacation-job/confirm", {
    method: "POST",
    body: JSON.stringify({ code }),
  })
}

export function getMyPlacement() {
  return apiFetch("/api/v1/vacation-job/my-placement")
}

export type HostingCapacityRequest = {
  cycleId: string
  contactName: string
  contactPhone: string
  preferredSectors: string[]
  preferredEducationLevelId?: string
  placementInstructions?: string
  capacities: Array<{ stateId: number; slotsOffered: number }>
}

export type HostingCapacityRow = {
  id: string
  stateId: number
  slotsOffered: number
  state: { id: number; name: string; code: string | null }
}

export type HostingCapacity = {
  cycleId: string
  contactName: string
  contactPhone: string
  preferredSectors: string[]
  preferredEducationLevelId: string | null
  placementInstructions: string | null
  capacities: HostingCapacityRow[]
  totalSlots: number
  cycle: { id: string; name: string; year: number; status: string }
}

export type MyHostingCapacityResponse = {
  data: HostingCapacity[]
  pagination: { nextCursor: string | null; hasMore: boolean; total: number }
}

export function createHostingCapacity(body: HostingCapacityRequest) {
  return apiFetch<HostingCapacity>('/api/v1/programs/hosting-capacity', { method: 'POST', body: JSON.stringify(body) })
}

export function getMyHostingCapacity(params?: { cursor?: string }) {
  const q = params?.cursor ? `?cursor=${params.cursor}` : ''
  return apiFetch<MyHostingCapacityResponse>(`/api/v1/programs/my-hosting-capacity${q}`)
}

export function getHostingCapacityByCycle(cycleId: string) {
  return apiFetch<HostingCapacity>(`/api/v1/programs/hosting-capacity/by-cycle/${cycleId}`)
}

// ── Employer users (team members) ─────────────────────────────────────────────

export type EmployerUserListItem = {
  id: string
  userId: string | null
  email: string
  fullName: string | null
  role: 'ADMIN' | 'HR'
  status: 'PENDING' | 'ACTIVE' | 'INACTIVE'
  invitedAt: string | null
  acceptedAt: string | null
  createdAt: string
}

export type EmployerUserListResponse = {
  data: EmployerUserListItem[]
  pagination: { nextCursor: string | null; hasMore: boolean; total: number }
}

export function listEmployerUsers(cursor?: string) {
  const qs = cursor ? `?cursor=${encodeURIComponent(cursor)}` : ''
  return apiFetch<EmployerUserListResponse>(`/api/v1/employers/me/users${qs}`)
}

export function inviteEmployerUser(payload: { email: string; role: 'ADMIN' | 'HR' }) {
  return apiFetch<{ message: string }>('/api/v1/employers/me/users/invite', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function resendEmployerInvite(inviteId: string) {
  return apiFetch<{ message: string }>(`/api/v1/employers/me/invites/${inviteId}/resend`, {
    method: 'POST',
  })
}

export function revokeEmployerInvite(inviteId: string) {
  return apiFetch<{ message: string }>(`/api/v1/employers/me/invites/${inviteId}`, {
    method: 'DELETE',
  })
}

export function updateEmployerUserRole(userId: string, role: 'ADMIN' | 'HR') {
  return apiFetch<{ message: string }>(`/api/v1/employers/me/users/${userId}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  })
}

export function removeEmployerUser(userId: string) {
  return apiFetch<{ message: string }>(`/api/v1/employers/me/users/${userId}`, {
    method: 'DELETE',
  })
}

// ── Workforce employees ───────────────────────────────────────────────────────

export type WorkforceEmployee = {
  id: string
  employerId: string
  fullName: string
  gender: 'MALE' | 'FEMALE' | 'PREFER_NOT_TO_SAY' | null
  nationality: string
  position: string
  department: string
  employmentType: 'PERMANENT' | 'CONTRACT' | 'CASUAL' | 'INTERN'
  hireDate: string
  terminationDate: string | null
  email: string | null
  phone: string | null
  salary: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export type WorkforceEmployeeListResponse = {
  data: WorkforceEmployee[]
  pagination: { nextCursor: string | null; hasMore: boolean; total: number }
}

export type WorkforceEmployeeFilters = {
  cursor?: string
  search?: string
  employmentType?: 'PERMANENT' | 'CONTRACT' | 'CASUAL' | 'INTERN'
  department?: string
  isActive?: boolean
}

export function listWorkforceEmployees(filters?: WorkforceEmployeeFilters) {
  const q = new URLSearchParams()
  if (filters?.cursor) q.set('cursor', filters.cursor)
  if (filters?.search) q.set('search', filters.search)
  if (filters?.employmentType) q.set('employmentType', filters.employmentType)
  if (filters?.department) q.set('department', filters.department)
  if (filters?.isActive !== undefined) q.set('isActive', String(filters.isActive))
  const qs = q.toString()
  return apiFetch<WorkforceEmployeeListResponse>(`/api/v1/workforce-employees${qs ? `?${qs}` : ''}`)
}

export function getWorkforceEmployee(id: string) {
  return apiFetch<WorkforceEmployee>(`/api/v1/workforce-employees/${id}`)
}

export type CreateWorkforceEmployeePayload = {
  fullName: string
  nationality: string
  position: string
  department: string
  employmentType: 'PERMANENT' | 'CONTRACT' | 'CASUAL' | 'INTERN'
  hireDate: string
  gender?: 'MALE' | 'FEMALE' | 'PREFER_NOT_TO_SAY'
  terminationDate?: string
  email?: string
  phone?: string
  salary?: string
}

export function createWorkforceEmployee(payload: CreateWorkforceEmployeePayload) {
  return apiFetch<WorkforceEmployee>('/api/v1/workforce-employees', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateWorkforceEmployee(id: string, payload: Partial<CreateWorkforceEmployeePayload>) {
  return apiFetch<WorkforceEmployee>(`/api/v1/workforce-employees/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function deleteWorkforceEmployee(id: string) {
  return apiFetch<{ message: string }>(`/api/v1/workforce-employees/${id}`, {
    method: 'DELETE',
  })
}

// ── Employer settings ─────────────────────────────────────────────────────────

export type EmployerAddress = {
  id: string
  countryId: number
  stateId: number | null
  cityId: number | null
  addressLine1: string | null
  addressLine2: string | null
}

export type EmployerSettings = {
  id: string
  companyName: string
  lraRegistrationNumber: string
  sectorId: string | null
  stateId: number | null
  primaryContactName: string
  primaryContactEmail: string
  primaryContactPhone: string
  complianceStatus: 'COMPLIANT' | 'PENDING' | 'OVERDUE' | 'EXEMPT'
  vacationJobHosting: boolean
  vacationJobDonating: boolean
  isActive: boolean
  address: EmployerAddress | null
  createdAt: string
  updatedAt: string
}

export function getEmployerSettings() {
  return apiFetch<EmployerSettings>('/api/v1/employers/me/settings')
}

export type UpdateEmployerSettingsPayload = {
  companyName?: string
  sectorId?: string
  stateId?: number
  primaryContactName?: string
  primaryContactEmail?: string
  primaryContactPhone?: string
  vacationJobHosting?: boolean
  vacationJobDonating?: boolean
  address?: {
    countryId?: number
    stateId?: number
    cityId?: number
    addressLine1?: string
    addressLine2?: string
  }
}

export function updateEmployerSettings(payload: UpdateEmployerSettingsPayload) {
  return apiFetch<EmployerSettings>('/api/v1/employers/me', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

// ── Public landing endpoints ──────────────────────────────────────────────────

import type {
  PublicStatsResponse,
  LandingPublicVacancyListItem,
  LandingPublicVacancyListResponse,
  LandingPublicVacancyDetail,
  PublicProgramCycleListItem,
  PublicProgramCycleListResponse,
  PublicProgramCycleDetail,
} from '@liberia-works/shared-schemas'

export type { PublicStatsResponse, LandingPublicVacancyListItem, LandingPublicVacancyListResponse, LandingPublicVacancyDetail, PublicProgramCycleListItem, PublicProgramCycleListResponse, PublicProgramCycleDetail }

export function getPublicStats() {
  return apiFetch<PublicStatsResponse>('/api/v1/public/stats')
}

export function listPublicVacancies(params?: {
  cursor?: string
  limit?: number
  keyword?: string
  vacancyType?: string
  stateId?: number
}) {
  const q = new URLSearchParams()
  if (params?.cursor) q.set('cursor', params.cursor)
  if (params?.limit) q.set('limit', String(params.limit))
  if (params?.keyword) q.set('keyword', params.keyword)
  if (params?.vacancyType) q.set('vacancyType', params.vacancyType)
  if (params?.stateId) q.set('stateId', String(params.stateId))
  const qs = q.toString()
  return apiFetch<LandingPublicVacancyListResponse>(`/api/v1/public/vacancies${qs ? `?${qs}` : ''}`)
}

export function getPublicVacancyDetail(id: string) {
  return apiFetch<LandingPublicVacancyDetail>(`/api/v1/public/vacancies/${id}`)
}

export function listPublicProgramCycles(params?: { cursor?: string; limit?: number }) {
  const q = new URLSearchParams()
  if (params?.cursor) q.set('cursor', params.cursor)
  if (params?.limit) q.set('limit', String(params.limit))
  const qs = q.toString()
  return apiFetch<PublicProgramCycleListResponse>(`/api/v1/public/programs/cycles${qs ? `?${qs}` : ''}`)
}

export function getPublicProgramCycleDetail(id: string) {
  return apiFetch<PublicProgramCycleDetail>(`/api/v1/public/programs/cycles/${id}`)
}

// ── Invite accept (public) ────────────────────────────────────────────────────

export type AcceptInvitePayload = {
  token: string
  fullName?: string
  password?: string
}

export type AcceptInviteResponse = {
  userId: string
  role: string
  expiresAt: string
}

export function acceptInvite(payload: AcceptInvitePayload) {
  return apiFetch<AcceptInviteResponse>('/api/v1/invites/accept', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
