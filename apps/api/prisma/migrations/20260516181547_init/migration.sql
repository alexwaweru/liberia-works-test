-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "postgis";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('INDIVIDUAL', 'EMPLOYER_ADMIN', 'EMPLOYER_HR', 'MOL_OFFICER', 'MOL_DIRECTOR', 'SYSTEM_ADMIN');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'PREFER_NOT_TO_SAY');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('CV', 'NATIONAL_ID', 'PASSPORT', 'CERTIFICATE', 'TRAINING_RECORD', 'PERMIT_DOC', 'DISPUTE_ATTACHMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "DataSource" AS ENUM ('MANUAL', 'CV_PARSE');

-- CreateEnum
CREATE TYPE "Proficiency" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT');

-- CreateEnum
CREATE TYPE "CvParseStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'NEEDS_REVIEW');

-- CreateEnum
CREATE TYPE "VacancyType" AS ENUM ('VACATION_JOB', 'PERMANENT', 'CONTRACT', 'INTERNSHIP');

-- CreateEnum
CREATE TYPE "VacancyStatus" AS ENUM ('DRAFT', 'ACTIVE', 'CLOSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ApplicationChannel" AS ENUM ('WEB', 'MOBILE', 'WHATSAPP', 'SMS');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('APPLIED', 'SHORTLISTED', 'REJECTED', 'WITHDRAWN', 'HIRED');

-- CreateEnum
CREATE TYPE "WorkPermitStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'INFO_REQUIRED', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ComplianceStatus" AS ENUM ('COMPLIANT', 'PENDING', 'OVERDUE', 'EXEMPT');

-- CreateEnum
CREATE TYPE "DisputeCategory" AS ENUM ('PERMIT_DECISION', 'COMPLIANCE_FINDING', 'APPLICANT_CONDUCT', 'PLATFORM_ISSUE', 'REGULATORY_INQUIRY');

-- CreateEnum
CREATE TYPE "DisputeStatus" AS ENUM ('SUBMITTED', 'UNDER_REVIEW', 'RESPONDED', 'CLOSED');

-- CreateEnum
CREATE TYPE "ProgramType" AS ENUM ('VACATION_JOB');

-- CreateEnum
CREATE TYPE "ProgramCycleStatus" AS ENUM ('PLANNED', 'OPEN', 'MATCHING', 'COMPLETED');

-- CreateEnum
CREATE TYPE "ProgramPlacementStatus" AS ENUM ('MATCHED', 'CONFIRMED', 'COMPLETED', 'NO_SHOW', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ProgramOptInStatus" AS ENUM ('PENDING', 'MATCHED', 'DECLINED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "WorkforceReturnStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'VALIDATED', 'DISPUTED');

-- CreateEnum
CREATE TYPE "MessageDirection" AS ENUM ('INBOUND', 'OUTBOUND');

-- CreateEnum
CREATE TYPE "MessageChannel" AS ENUM ('SMS', 'WHATSAPP');

-- CreateEnum
CREATE TYPE "MessageDeliveryStatus" AS ENUM ('QUEUED', 'SENT', 'DELIVERED', 'FAILED', 'READ');

-- CreateEnum
CREATE TYPE "OtpChannel" AS ENUM ('SMS', 'WHATSAPP', 'EMAIL');

-- CreateEnum
CREATE TYPE "OtpPurpose" AS ENUM ('REGISTRATION', 'LOGIN', 'PHONE_CHANGE', 'EMAIL_CHANGE');

-- CreateEnum
CREATE TYPE "EmployerUserRole" AS ENUM ('ADMIN', 'HR', 'MEMBER');

-- CreateEnum
CREATE TYPE "EmploymentType" AS ENUM ('PERMANENT', 'CONTRACT', 'CASUAL', 'INTERN');

-- CreateTable
CREATE TABLE "sectors" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "isic_code" VARCHAR(10) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "parent_id" UUID,
    "level" SMALLINT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "sectors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "occupations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "isco_code" VARCHAR(10) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "major_group" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "occupations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "location_region" (
    "id" INTEGER NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "translations" JSONB,
    "wikidata_id" VARCHAR(255),
    "flag" BOOLEAN NOT NULL DEFAULT true,
    "name_embedding" vector(384),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "location_region_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "location_subregion" (
    "id" INTEGER NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "region_id" INTEGER NOT NULL,
    "translations" JSONB,
    "wikidata_id" VARCHAR(255),
    "flag" BOOLEAN NOT NULL DEFAULT true,
    "name_embedding" vector(384),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "location_subregion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "location_country" (
    "id" INTEGER NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "iso3" VARCHAR(3),
    "numeric_code" VARCHAR(3),
    "iso2" VARCHAR(2) NOT NULL,
    "phonecode" VARCHAR(255),
    "capital" VARCHAR(255),
    "currency" VARCHAR(255),
    "currency_name" VARCHAR(255),
    "currency_symbol" VARCHAR(255),
    "tld" VARCHAR(255),
    "native" VARCHAR(255),
    "region_id" INTEGER,
    "subregion_id" INTEGER,
    "nationality" VARCHAR(255),
    "timezones" JSONB,
    "translations" JSONB,
    "location" geography(Point,4326),
    "emoji" VARCHAR(191),
    "emoji_u" VARCHAR(191),
    "wikidata_id" VARCHAR(255),
    "flag" BOOLEAN NOT NULL DEFAULT true,
    "population" BIGINT,
    "gdp" BIGINT,
    "area_sq_km" DOUBLE PRECISION,
    "postal_code_format" VARCHAR(255),
    "postal_code_regex" VARCHAR(255),
    "name_embedding" vector(384),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "location_country_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "location_state" (
    "id" INTEGER NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "country_id" INTEGER NOT NULL,
    "country_code" VARCHAR(2) NOT NULL,
    "fips_code" VARCHAR(255),
    "iso2" VARCHAR(255),
    "iso3166_2" VARCHAR(10),
    "state_code" VARCHAR(255) NOT NULL,
    "state_type" VARCHAR(191),
    "level" INTEGER,
    "parent_id" INTEGER,
    "native" VARCHAR(255),
    "location" geography(Point,4326),
    "timezone" VARCHAR(255),
    "translations" JSONB,
    "wikidata_id" VARCHAR(255),
    "flag" BOOLEAN NOT NULL DEFAULT true,
    "population" BIGINT,
    "name_embedding" vector(384),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "location_state_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "location_city" (
    "id" INTEGER NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "state_id" INTEGER NOT NULL,
    "state_code" VARCHAR(255) NOT NULL,
    "country_id" INTEGER NOT NULL,
    "country_code" VARCHAR(2) NOT NULL,
    "location" geography(Point,4326) NOT NULL,
    "city_type" VARCHAR(191),
    "level" INTEGER,
    "parent_id" INTEGER,
    "native" VARCHAR(255),
    "population" BIGINT,
    "timezone" VARCHAR(255),
    "translations" JSONB,
    "wikidata_id" VARCHAR(255),
    "flag" BOOLEAN NOT NULL DEFAULT true,
    "name_embedding" vector(384),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "location_city_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "education_levels" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "isced_code" VARCHAR(5) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "level_order" SMALLINT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "education_levels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "phone_number" VARCHAR(20),
    "email" VARCHAR(255),
    "password_hash" VARCHAR(255),
    "role" "UserRole" NOT NULL,
    "full_name" VARCHAR(200),
    "date_of_birth" DATE,
    "gender" "Gender",
    "is_phone_verified" BOOLEAN NOT NULL DEFAULT false,
    "is_email_verified" BOOLEAN NOT NULL DEFAULT false,
    "last_active_at" TIMESTAMPTZ(6),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "otp_codes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID,
    "destination" VARCHAR(255) NOT NULL,
    "channel" "OtpChannel" NOT NULL,
    "purpose" "OtpPurpose" NOT NULL,
    "code_hash" VARCHAR(255) NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "attempts" SMALLINT NOT NULL DEFAULT 0,
    "consumed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otp_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "refresh_token_hash" VARCHAR(255) NOT NULL,
    "issued_at" TIMESTAMPTZ(6) NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "revoked_at" TIMESTAMPTZ(6),
    "user_agent" VARCHAR(500),
    "ip_address" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "addresses" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID,
    "employer_id" UUID,
    "country_id" INTEGER NOT NULL,
    "state_id" INTEGER,
    "city_id" INTEGER,
    "address_line_1" VARCHAR(300),
    "address_line_2" VARCHAR(300),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "individuals" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "nin" VARCHAR(20),
    "education_level_id" UUID,
    "profile_completion_pct" SMALLINT NOT NULL DEFAULT 0,
    "vacation_job_opt_in" BOOLEAN NOT NULL DEFAULT false,
    "vacation_job_opt_in_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "individuals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "individual_sector_interests" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "individual_id" UUID NOT NULL,
    "sector_id" UUID NOT NULL,
    "priority_order" SMALLINT NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "individual_sector_interests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "individual_education" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "individual_id" UUID NOT NULL,
    "institution_name" VARCHAR(300) NOT NULL,
    "qualification" VARCHAR(200),
    "field_of_study" VARCHAR(200),
    "education_level_id" UUID,
    "start_date" DATE,
    "end_date" DATE,
    "is_current" BOOLEAN NOT NULL DEFAULT false,
    "source" "DataSource" NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "individual_education_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "individual_work_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "individual_id" UUID NOT NULL,
    "employer_name" VARCHAR(300) NOT NULL,
    "title" VARCHAR(200),
    "occupation_id" UUID,
    "start_date" DATE,
    "end_date" DATE,
    "is_current" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "source" "DataSource" NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "individual_work_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "individual_skills" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "individual_id" UUID NOT NULL,
    "skill_name" VARCHAR(200) NOT NULL,
    "proficiency" "Proficiency",
    "years_experience" SMALLINT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "individual_skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "individual_id" UUID,
    "employer_id" UUID,
    "work_permit_application_id" UUID,
    "dispute_id" UUID,
    "document_type" "DocumentType" NOT NULL,
    "storage_key" VARCHAR(500) NOT NULL,
    "file_name" VARCHAR(300) NOT NULL,
    "file_size_bytes" BIGINT NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "uploaded_by_user_id" UUID NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cv_parse_jobs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "document_id" UUID NOT NULL,
    "individual_id" UUID NOT NULL,
    "status" "CvParseStatus" NOT NULL,
    "extracted_data" JSONB,
    "confidence_scores" JSONB,
    "processing_started_at" TIMESTAMPTZ(6),
    "processing_completed_at" TIMESTAMPTZ(6),
    "error_message" TEXT,
    "model_version" VARCHAR(50) NOT NULL,
    "bullmq_job_id" VARCHAR(100),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "cv_parse_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "lra_registration_number" VARCHAR(50) NOT NULL,
    "company_name" VARCHAR(300) NOT NULL,
    "sector_id" UUID,
    "state_id" INTEGER,
    "primary_contact_name" VARCHAR(200) NOT NULL,
    "primary_contact_email" VARCHAR(255) NOT NULL,
    "primary_contact_phone" VARCHAR(20) NOT NULL,
    "compliance_status" "ComplianceStatus" NOT NULL DEFAULT 'PENDING',
    "certificate_expiry_date" DATE,
    "vacation_job_hosting" BOOLEAN NOT NULL DEFAULT false,
    "vacation_job_donating" BOOLEAN NOT NULL DEFAULT false,
    "total_employees_last_return" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "employers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employer_users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "employer_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" "EmployerUserRole" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "invited_by_user_id" UUID,
    "invited_at" TIMESTAMPTZ(6),
    "accepted_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "employer_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employer_invite_tokens" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "employer_id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "role" "EmployerUserRole" NOT NULL,
    "token_hash" VARCHAR(255) NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "accepted_at" TIMESTAMPTZ(6),
    "invited_by_user_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "employer_invite_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workforce_employees" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "employer_id" UUID NOT NULL,
    "full_name" VARCHAR(200) NOT NULL,
    "gender" "Gender",
    "nationality" VARCHAR(100) NOT NULL,
    "position" VARCHAR(200) NOT NULL,
    "department" VARCHAR(200),
    "employment_type" "EmploymentType" NOT NULL,
    "hire_date" DATE NOT NULL,
    "termination_date" DATE,
    "email" VARCHAR(255),
    "phone" VARCHAR(20),
    "salary" DECIMAL(12,2),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "workforce_employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vacancies" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "employer_id" UUID NOT NULL,
    "title" VARCHAR(300) NOT NULL,
    "description" TEXT NOT NULL,
    "occupation_id" UUID,
    "vacancy_type" "VacancyType" NOT NULL,
    "state_id" INTEGER NOT NULL,
    "sector_id" UUID,
    "minimum_education_level_id" UUID,
    "slots_available" SMALLINT NOT NULL,
    "deadline" DATE NOT NULL,
    "is_mandatory_advertised" BOOLEAN NOT NULL DEFAULT false,
    "status" "VacancyStatus" NOT NULL DEFAULT 'DRAFT',
    "posted_at" TIMESTAMPTZ(6),
    "application_form" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "vacancies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "applications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "individual_id" UUID NOT NULL,
    "vacancy_id" UUID NOT NULL,
    "channel" "ApplicationChannel" NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'APPLIED',
    "status_changed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status_changed_by_user_id" UUID,
    "applied_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "responses" JSONB,
    "status_note" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_permit_applications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "reference_number" VARCHAR(30) NOT NULL,
    "employer_id" UUID NOT NULL,
    "vacancy_id" UUID NOT NULL,
    "occupation_id" UUID,
    "foreign_worker_name" VARCHAR(200) NOT NULL,
    "nationality_id" INTEGER NOT NULL,
    "passport_number" VARCHAR(50) NOT NULL,
    "prior_liberia_work_history" TEXT,
    "role_justification" TEXT NOT NULL,
    "proposed_salary_usd" DECIMAL(12,2),
    "benefits_summary" TEXT,
    "contract_duration_months" SMALLINT,
    "status" "WorkPermitStatus" NOT NULL DEFAULT 'DRAFT',
    "submitted_at" TIMESTAMPTZ(6),
    "decided_at" TIMESTAMPTZ(6),
    "decided_by_user_id" UUID,
    "decision_notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "work_permit_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_permit_status_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "work_permit_application_id" UUID NOT NULL,
    "from_status" "WorkPermitStatus",
    "to_status" "WorkPermitStatus" NOT NULL,
    "changed_by_user_id" UUID NOT NULL,
    "reason_code" VARCHAR(50),
    "notes" TEXT,
    "changed_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "work_permit_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "disputes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "reference_number" VARCHAR(30) NOT NULL,
    "employer_id" UUID NOT NULL,
    "submitted_by_user_id" UUID NOT NULL,
    "category" "DisputeCategory" NOT NULL,
    "related_reference_id" VARCHAR(100),
    "description" TEXT NOT NULL,
    "status" "DisputeStatus" NOT NULL DEFAULT 'SUBMITTED',
    "assigned_to_user_id" UUID,
    "mol_response_text" TEXT,
    "submitted_at" TIMESTAMPTZ(6) NOT NULL,
    "sla_due_at" TIMESTAMPTZ(6) NOT NULL,
    "responded_at" TIMESTAMPTZ(6),
    "responded_by_user_id" UUID,
    "closed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "disputes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "program_cycles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "type" "ProgramType" NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "year" SMALLINT NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "status" "ProgramCycleStatus" NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "program_cycles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "program_hosting_capacity" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "employer_id" UUID NOT NULL,
    "cycle_id" UUID NOT NULL,
    "slots_offered" SMALLINT NOT NULL,
    "preferred_sectors" UUID[] DEFAULT ARRAY[]::UUID[],
    "preferred_education_level_id" UUID,
    "state_id" INTEGER NOT NULL,
    "contact_name" VARCHAR(200) NOT NULL,
    "contact_phone" VARCHAR(20) NOT NULL,
    "placement_instructions" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "program_hosting_capacity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "program_placements" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "individual_id" UUID NOT NULL,
    "employer_id" UUID NOT NULL,
    "cycle_id" UUID NOT NULL,
    "match_date" DATE NOT NULL,
    "report_date" DATE,
    "contact_name" VARCHAR(200) NOT NULL,
    "contact_phone" VARCHAR(20) NOT NULL,
    "confirmation_code" VARCHAR(20) NOT NULL,
    "status" "ProgramPlacementStatus" NOT NULL DEFAULT 'MATCHED',
    "confirmed_at" TIMESTAMPTZ(6),
    "confirmation_deadline" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "program_placements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "program_opt_ins" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "individual_id" UUID NOT NULL,
    "program_cycle_id" UUID NOT NULL,
    "status" "ProgramOptInStatus" NOT NULL DEFAULT 'PENDING',
    "preferred_sectors" UUID[] DEFAULT ARRAY[]::UUID[],
    "preferred_counties" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "preferred_education_level_id" UUID,
    "additional_notes" TEXT,
    "matched_employer_id" UUID,
    "matched_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "program_opt_ins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workforce_returns" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "employer_id" UUID NOT NULL,
    "return_period" VARCHAR(10) NOT NULL,
    "total_employees" INTEGER NOT NULL,
    "liberian_nationals" INTEGER NOT NULL,
    "foreign_nationals" INTEGER NOT NULL,
    "female_employees" INTEGER NOT NULL,
    "male_employees" INTEGER NOT NULL,
    "status" "WorkforceReturnStatus" NOT NULL DEFAULT 'DRAFT',
    "submitted_by_user_id" UUID,
    "submitted_at" TIMESTAMPTZ(6),
    "validated_by_user_id" UUID,
    "validated_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "workforce_returns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compliance_certificates" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "employer_id" UUID NOT NULL,
    "serial_number" VARCHAR(50) NOT NULL,
    "issued_at" TIMESTAMPTZ(6) NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "revoked_at" TIMESTAMPTZ(6),
    "revoked_by_user_id" UUID,
    "revocation_reason" TEXT,
    "pdf_storage_key" VARCHAR(500) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "compliance_certificates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID,
    "phone_number" VARCHAR(20) NOT NULL,
    "direction" "MessageDirection" NOT NULL,
    "channel" "MessageChannel" NOT NULL,
    "template_name" VARCHAR(100),
    "message_body" TEXT,
    "external_message_id" VARCHAR(100),
    "delivery_status" "MessageDeliveryStatus",
    "delivered_at" TIMESTAMPTZ(6),
    "retention_expires_at" TIMESTAMPTZ(6) NOT NULL,
    "provider" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "type" VARCHAR(100) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "body" TEXT NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "read_at" TIMESTAMPTZ(6),
    "channels_dispatched" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "actor_user_id" UUID,
    "actor_role" VARCHAR(30) NOT NULL,
    "action" VARCHAR(100) NOT NULL,
    "target_table" VARCHAR(100),
    "target_id" UUID,
    "before_data" JSONB,
    "after_data" JSONB,
    "ip_address" TEXT,
    "user_agent" VARCHAR(500),
    "request_id" UUID,
    "timestamp" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sectors_isic_code_key" ON "sectors"("isic_code");

-- CreateIndex
CREATE UNIQUE INDEX "occupations_isco_code_key" ON "occupations"("isco_code");

-- CreateIndex
CREATE INDEX "loc_region_wikidata_idx" ON "location_region"("wikidata_id");

-- CreateIndex
CREATE INDEX "loc_subregion_wikidata_idx" ON "location_subregion"("wikidata_id");

-- CreateIndex
CREATE UNIQUE INDEX "location_country_iso2_key" ON "location_country"("iso2");

-- CreateIndex
CREATE INDEX "loc_country_iso2_idx" ON "location_country"("iso2");

-- CreateIndex
CREATE INDEX "loc_country_iso3_idx" ON "location_country"("iso3");

-- CreateIndex
CREATE INDEX "loc_country_name_idx" ON "location_country"("name");

-- CreateIndex
CREATE INDEX "loc_country_wikidata_idx" ON "location_country"("wikidata_id");

-- CreateIndex
CREATE INDEX "loc_state_country_code_idx" ON "location_state"("country_id", "state_code");

-- CreateIndex
CREATE INDEX "loc_state_name_idx" ON "location_state"("name");

-- CreateIndex
CREATE INDEX "loc_state_wikidata_idx" ON "location_state"("wikidata_id");

-- CreateIndex
CREATE INDEX "loc_city_country_state_idx" ON "location_city"("country_id", "state_id");

-- CreateIndex
CREATE INDEX "loc_city_name_idx" ON "location_city"("name");

-- CreateIndex
CREATE INDEX "loc_city_wikidata_idx" ON "location_city"("wikidata_id");

-- CreateIndex
CREATE UNIQUE INDEX "education_levels_isced_code_key" ON "education_levels"("isced_code");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_number_key" ON "users"("phone_number");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "idx_otp_destination_purpose" ON "otp_codes"("destination", "purpose", "consumed_at");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_refresh_token_hash_key" ON "sessions"("refresh_token_hash");

-- CreateIndex
CREATE INDEX "idx_pwd_history_user" ON "password_history"("user_id", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "addresses_user_id_key" ON "addresses"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "addresses_employer_id_key" ON "addresses"("employer_id");

-- CreateIndex
CREATE UNIQUE INDEX "individuals_user_id_key" ON "individuals"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "individual_sector_interests_individual_id_sector_id_key" ON "individual_sector_interests"("individual_id", "sector_id");

-- CreateIndex
CREATE INDEX "individual_skills_individual_id_skill_name_idx" ON "individual_skills"("individual_id", "skill_name");

-- CreateIndex
CREATE UNIQUE INDEX "cv_parse_jobs_document_id_key" ON "cv_parse_jobs"("document_id");

-- CreateIndex
CREATE UNIQUE INDEX "employers_lra_registration_number_key" ON "employers"("lra_registration_number");

-- CreateIndex
CREATE UNIQUE INDEX "employer_users_employer_id_user_id_key" ON "employer_users"("employer_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "employer_invite_tokens_token_hash_key" ON "employer_invite_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "idx_invite_token_employer_email" ON "employer_invite_tokens"("employer_id", "email");

-- CreateIndex
CREATE INDEX "idx_workforce_employee_employer_active" ON "workforce_employees"("employer_id", "is_active");

-- CreateIndex
CREATE INDEX "idx_vacancy_status_deadline" ON "vacancies"("status", "deadline");

-- CreateIndex
CREATE INDEX "idx_vacancy_state_status" ON "vacancies"("state_id", "status");

-- CreateIndex
CREATE INDEX "idx_vacancy_employer_status" ON "vacancies"("employer_id", "status");

-- CreateIndex
CREATE INDEX "idx_vacancy_mandatory_advertised" ON "vacancies"("is_mandatory_advertised", "posted_at");

-- CreateIndex
CREATE INDEX "idx_application_vacancy_status" ON "applications"("vacancy_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "applications_individual_id_vacancy_id_key" ON "applications"("individual_id", "vacancy_id");

-- CreateIndex
CREATE UNIQUE INDEX "work_permit_applications_reference_number_key" ON "work_permit_applications"("reference_number");

-- CreateIndex
CREATE UNIQUE INDEX "disputes_reference_number_key" ON "disputes"("reference_number");

-- CreateIndex
CREATE INDEX "idx_dispute_status_sla" ON "disputes"("status", "sla_due_at");

-- CreateIndex
CREATE UNIQUE INDEX "program_hosting_capacity_employer_id_cycle_id_state_id_key" ON "program_hosting_capacity"("employer_id", "cycle_id", "state_id");

-- CreateIndex
CREATE UNIQUE INDEX "program_placements_confirmation_code_key" ON "program_placements"("confirmation_code");

-- CreateIndex
CREATE UNIQUE INDEX "program_opt_ins_individual_id_program_cycle_id_key" ON "program_opt_ins"("individual_id", "program_cycle_id");

-- CreateIndex
CREATE UNIQUE INDEX "workforce_returns_employer_id_return_period_key" ON "workforce_returns"("employer_id", "return_period");

-- CreateIndex
CREATE UNIQUE INDEX "compliance_certificates_serial_number_key" ON "compliance_certificates"("serial_number");

-- CreateIndex
CREATE INDEX "idx_message_user_created" ON "message_events"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_message_external_id" ON "message_events"("external_message_id");

-- CreateIndex
CREATE INDEX "idx_message_retention" ON "message_events"("retention_expires_at");

-- CreateIndex
CREATE INDEX "idx_audit_target" ON "audit_log"("target_table", "target_id", "timestamp" DESC);

-- CreateIndex
CREATE INDEX "idx_audit_actor" ON "audit_log"("actor_user_id", "timestamp" DESC);

-- CreateIndex
CREATE INDEX "idx_audit_action" ON "audit_log"("action", "timestamp" DESC);

-- AddForeignKey
ALTER TABLE "sectors" ADD CONSTRAINT "sectors_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "sectors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "location_subregion" ADD CONSTRAINT "location_subregion_region_id_fkey" FOREIGN KEY ("region_id") REFERENCES "location_region"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "location_country" ADD CONSTRAINT "location_country_region_id_fkey" FOREIGN KEY ("region_id") REFERENCES "location_region"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "location_country" ADD CONSTRAINT "location_country_subregion_id_fkey" FOREIGN KEY ("subregion_id") REFERENCES "location_subregion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "location_state" ADD CONSTRAINT "location_state_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "location_country"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "location_state" ADD CONSTRAINT "location_state_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "location_state"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "location_city" ADD CONSTRAINT "location_city_state_id_fkey" FOREIGN KEY ("state_id") REFERENCES "location_state"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "location_city" ADD CONSTRAINT "location_city_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "location_country"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "location_city" ADD CONSTRAINT "location_city_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "location_city"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "otp_codes" ADD CONSTRAINT "otp_codes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_history" ADD CONSTRAINT "password_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_employer_id_fkey" FOREIGN KEY ("employer_id") REFERENCES "employers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "location_country"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_state_id_fkey" FOREIGN KEY ("state_id") REFERENCES "location_state"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "location_city"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "individuals" ADD CONSTRAINT "individuals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "individuals" ADD CONSTRAINT "individuals_education_level_id_fkey" FOREIGN KEY ("education_level_id") REFERENCES "education_levels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "individual_sector_interests" ADD CONSTRAINT "individual_sector_interests_individual_id_fkey" FOREIGN KEY ("individual_id") REFERENCES "individuals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "individual_sector_interests" ADD CONSTRAINT "individual_sector_interests_sector_id_fkey" FOREIGN KEY ("sector_id") REFERENCES "sectors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "individual_education" ADD CONSTRAINT "individual_education_individual_id_fkey" FOREIGN KEY ("individual_id") REFERENCES "individuals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "individual_education" ADD CONSTRAINT "individual_education_education_level_id_fkey" FOREIGN KEY ("education_level_id") REFERENCES "education_levels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "individual_work_history" ADD CONSTRAINT "individual_work_history_individual_id_fkey" FOREIGN KEY ("individual_id") REFERENCES "individuals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "individual_work_history" ADD CONSTRAINT "individual_work_history_occupation_id_fkey" FOREIGN KEY ("occupation_id") REFERENCES "occupations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "individual_skills" ADD CONSTRAINT "individual_skills_individual_id_fkey" FOREIGN KEY ("individual_id") REFERENCES "individuals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_individual_id_fkey" FOREIGN KEY ("individual_id") REFERENCES "individuals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_employer_id_fkey" FOREIGN KEY ("employer_id") REFERENCES "employers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_work_permit_application_id_fkey" FOREIGN KEY ("work_permit_application_id") REFERENCES "work_permit_applications"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_dispute_id_fkey" FOREIGN KEY ("dispute_id") REFERENCES "disputes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploaded_by_user_id_fkey" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cv_parse_jobs" ADD CONSTRAINT "cv_parse_jobs_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cv_parse_jobs" ADD CONSTRAINT "cv_parse_jobs_individual_id_fkey" FOREIGN KEY ("individual_id") REFERENCES "individuals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employers" ADD CONSTRAINT "employers_sector_id_fkey" FOREIGN KEY ("sector_id") REFERENCES "sectors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employers" ADD CONSTRAINT "employers_state_id_fkey" FOREIGN KEY ("state_id") REFERENCES "location_state"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employer_users" ADD CONSTRAINT "employer_users_employer_id_fkey" FOREIGN KEY ("employer_id") REFERENCES "employers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employer_users" ADD CONSTRAINT "employer_users_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employer_users" ADD CONSTRAINT "employer_users_invited_by_user_id_fkey" FOREIGN KEY ("invited_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employer_invite_tokens" ADD CONSTRAINT "employer_invite_tokens_employer_id_fkey" FOREIGN KEY ("employer_id") REFERENCES "employers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employer_invite_tokens" ADD CONSTRAINT "employer_invite_tokens_invited_by_user_id_fkey" FOREIGN KEY ("invited_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workforce_employees" ADD CONSTRAINT "workforce_employees_employer_id_fkey" FOREIGN KEY ("employer_id") REFERENCES "employers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vacancies" ADD CONSTRAINT "vacancies_employer_id_fkey" FOREIGN KEY ("employer_id") REFERENCES "employers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vacancies" ADD CONSTRAINT "vacancies_occupation_id_fkey" FOREIGN KEY ("occupation_id") REFERENCES "occupations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vacancies" ADD CONSTRAINT "vacancies_state_id_fkey" FOREIGN KEY ("state_id") REFERENCES "location_state"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vacancies" ADD CONSTRAINT "vacancies_sector_id_fkey" FOREIGN KEY ("sector_id") REFERENCES "sectors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vacancies" ADD CONSTRAINT "vacancies_minimum_education_level_id_fkey" FOREIGN KEY ("minimum_education_level_id") REFERENCES "education_levels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_individual_id_fkey" FOREIGN KEY ("individual_id") REFERENCES "individuals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_vacancy_id_fkey" FOREIGN KEY ("vacancy_id") REFERENCES "vacancies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_status_changed_by_user_id_fkey" FOREIGN KEY ("status_changed_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_permit_applications" ADD CONSTRAINT "work_permit_applications_employer_id_fkey" FOREIGN KEY ("employer_id") REFERENCES "employers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_permit_applications" ADD CONSTRAINT "work_permit_applications_vacancy_id_fkey" FOREIGN KEY ("vacancy_id") REFERENCES "vacancies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_permit_applications" ADD CONSTRAINT "work_permit_applications_occupation_id_fkey" FOREIGN KEY ("occupation_id") REFERENCES "occupations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_permit_applications" ADD CONSTRAINT "work_permit_applications_nationality_id_fkey" FOREIGN KEY ("nationality_id") REFERENCES "location_country"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_permit_applications" ADD CONSTRAINT "work_permit_applications_decided_by_user_id_fkey" FOREIGN KEY ("decided_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_permit_status_history" ADD CONSTRAINT "work_permit_status_history_work_permit_application_id_fkey" FOREIGN KEY ("work_permit_application_id") REFERENCES "work_permit_applications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_permit_status_history" ADD CONSTRAINT "work_permit_status_history_changed_by_user_id_fkey" FOREIGN KEY ("changed_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_employer_id_fkey" FOREIGN KEY ("employer_id") REFERENCES "employers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_submitted_by_user_id_fkey" FOREIGN KEY ("submitted_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_assigned_to_user_id_fkey" FOREIGN KEY ("assigned_to_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_responded_by_user_id_fkey" FOREIGN KEY ("responded_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_hosting_capacity" ADD CONSTRAINT "program_hosting_capacity_employer_id_fkey" FOREIGN KEY ("employer_id") REFERENCES "employers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_hosting_capacity" ADD CONSTRAINT "program_hosting_capacity_cycle_id_fkey" FOREIGN KEY ("cycle_id") REFERENCES "program_cycles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_hosting_capacity" ADD CONSTRAINT "program_hosting_capacity_preferred_education_level_id_fkey" FOREIGN KEY ("preferred_education_level_id") REFERENCES "education_levels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_hosting_capacity" ADD CONSTRAINT "program_hosting_capacity_state_id_fkey" FOREIGN KEY ("state_id") REFERENCES "location_state"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_placements" ADD CONSTRAINT "program_placements_individual_id_fkey" FOREIGN KEY ("individual_id") REFERENCES "individuals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_placements" ADD CONSTRAINT "program_placements_employer_id_fkey" FOREIGN KEY ("employer_id") REFERENCES "employers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_placements" ADD CONSTRAINT "program_placements_cycle_id_fkey" FOREIGN KEY ("cycle_id") REFERENCES "program_cycles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_opt_ins" ADD CONSTRAINT "program_opt_ins_individual_id_fkey" FOREIGN KEY ("individual_id") REFERENCES "individuals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_opt_ins" ADD CONSTRAINT "program_opt_ins_program_cycle_id_fkey" FOREIGN KEY ("program_cycle_id") REFERENCES "program_cycles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_opt_ins" ADD CONSTRAINT "program_opt_ins_preferred_education_level_id_fkey" FOREIGN KEY ("preferred_education_level_id") REFERENCES "education_levels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_opt_ins" ADD CONSTRAINT "program_opt_ins_matched_employer_id_fkey" FOREIGN KEY ("matched_employer_id") REFERENCES "employers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workforce_returns" ADD CONSTRAINT "workforce_returns_employer_id_fkey" FOREIGN KEY ("employer_id") REFERENCES "employers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workforce_returns" ADD CONSTRAINT "workforce_returns_submitted_by_user_id_fkey" FOREIGN KEY ("submitted_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workforce_returns" ADD CONSTRAINT "workforce_returns_validated_by_user_id_fkey" FOREIGN KEY ("validated_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_certificates" ADD CONSTRAINT "compliance_certificates_employer_id_fkey" FOREIGN KEY ("employer_id") REFERENCES "employers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_certificates" ADD CONSTRAINT "compliance_certificates_revoked_by_user_id_fkey" FOREIGN KEY ("revoked_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_events" ADD CONSTRAINT "message_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
