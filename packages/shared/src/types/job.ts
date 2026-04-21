import type { ID, Timestamp } from './common.js'

export type JobType = 'full-time' | 'part-time' | 'contract' | 'internship' | 'gig'
export type JobStatus = 'draft' | 'published' | 'closed' | 'expired'

export type Job = Timestamp & {
  id: ID
  title: string
  description: string
  employerId: ID
  state: string
  type: JobType
  status: JobStatus
  salaryMin?: number
  salaryMax?: number
  applicationDeadline?: string
  requiredSkills: string[]
}

export type Application = Timestamp & {
  id: ID
  jobId: ID
  seekerId: ID
  status: 'pending' | 'reviewed' | 'shortlisted' | 'rejected' | 'hired'
  coverNote?: string
}
