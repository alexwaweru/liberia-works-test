import type { ID, Timestamp } from './common.js'

export type UserRole = 'jobseeker' | 'employer' | 'admin'

export type User = Timestamp & {
  id: ID
  phone: string
  fullName: string
  role: UserRole
  isVerified: boolean
}

export type JobSeeker = User & {
  role: 'jobseeker'
  skills: string[]
  county: string
  resumeUrl?: string
}

export type Employer = User & {
  role: 'employer'
  companyName: string
  companySize?: string
  sector?: string
}
