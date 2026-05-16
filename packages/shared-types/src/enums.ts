// All application enums — mirrors Prisma enum definitions in apps/api/prisma/schema.prisma

export type UserRole =
  | 'INDIVIDUAL'
  | 'EMPLOYER_ADMIN'
  | 'EMPLOYER_HR'
  | 'MOL_OFFICER'
  | 'MOL_DIRECTOR'
  | 'SYSTEM_ADMIN'

export type Gender = 'MALE' | 'FEMALE' | 'PREFER_NOT_TO_SAY'

export type DocumentType =
  | 'CV'
  | 'NATIONAL_ID'
  | 'PASSPORT'
  | 'CERTIFICATE'
  | 'TRAINING_RECORD'
  | 'PERMIT_DOC'
  | 'DISPUTE_ATTACHMENT'
  | 'OTHER'

export type DataSource = 'MANUAL' | 'CV_PARSE'

export type Proficiency = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT'

export type CvParseStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'NEEDS_REVIEW'

export type VacancyType = 'VACATION_JOB' | 'PERMANENT' | 'CONTRACT' | 'INTERNSHIP'

export type VacancyStatus = 'DRAFT' | 'ACTIVE' | 'CLOSED' | 'ARCHIVED'

export type ApplicationChannel = 'WEB' | 'MOBILE' | 'WHATSAPP' | 'SMS'

export type ApplicationStatus = 'APPLIED' | 'SHORTLISTED' | 'REJECTED' | 'WITHDRAWN' | 'HIRED'

export type WorkPermitStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'INFO_REQUIRED'
  | 'APPROVED'
  | 'REJECTED'

export type ComplianceStatus = 'COMPLIANT' | 'PENDING' | 'OVERDUE' | 'EXEMPT'

export type DisputeCategory =
  | 'PERMIT_DECISION'
  | 'COMPLIANCE_FINDING'
  | 'APPLICANT_CONDUCT'
  | 'PLATFORM_ISSUE'
  | 'REGULATORY_INQUIRY'

export type DisputeStatus = 'SUBMITTED' | 'UNDER_REVIEW' | 'RESPONDED' | 'CLOSED'

export type PlacementStatus = 'MATCHED' | 'CONFIRMED' | 'COMPLETED' | 'NO_SHOW' | 'CANCELLED'

export type VacationJobCycleStatus = 'PLANNED' | 'OPEN' | 'MATCHING' | 'COMPLETED'

export type WorkforceReturnStatus = 'DRAFT' | 'SUBMITTED' | 'VALIDATED' | 'DISPUTED'

export type MessageDirection = 'INBOUND' | 'OUTBOUND'

export type MessageChannel = 'SMS' | 'WHATSAPP'

export type MessageDeliveryStatus = 'QUEUED' | 'SENT' | 'DELIVERED' | 'FAILED' | 'READ'

export type OtpChannel = 'SMS' | 'WHATSAPP' | 'EMAIL'

export type OtpPurpose = 'REGISTRATION' | 'LOGIN' | 'PHONE_CHANGE' | 'EMAIL_CHANGE'

export type EmployerUserRole = 'ADMIN' | 'HR'

export type EmploymentType = 'PERMANENT' | 'CONTRACT' | 'CASUAL' | 'INTERN'

// Convenience: all roles that can access the employer portal
export const EMPLOYER_ROLES: UserRole[] = ['EMPLOYER_ADMIN', 'EMPLOYER_HR']

// Convenience: all MoL roles
export const MOL_ROLES: UserRole[] = ['MOL_OFFICER', 'MOL_DIRECTOR']

// Convenience: all EmploymentType values
export const EMPLOYMENT_TYPES: EmploymentType[] = ['PERMANENT', 'CONTRACT', 'CASUAL', 'INTERN']
