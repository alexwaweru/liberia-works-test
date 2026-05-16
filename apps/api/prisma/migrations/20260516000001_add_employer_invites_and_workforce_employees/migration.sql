-- CreateEnum
CREATE TYPE "EmploymentType" AS ENUM ('PERMANENT', 'CONTRACT', 'CASUAL', 'INTERN');

-- AlterTable: add reverse relation columns (no DDL needed — handled by Prisma relations)

-- CreateTable: employer_invite_tokens
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

-- CreateTable: workforce_employees
CREATE TABLE "workforce_employees" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "employer_id" UUID NOT NULL,
    "full_name" VARCHAR(200) NOT NULL,
    "gender" "Gender",
    "nationality" VARCHAR(100) NOT NULL,
    "position" VARCHAR(200) NOT NULL,
    "department" VARCHAR(200) NOT NULL,
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

-- CreateIndex: unique token_hash
CREATE UNIQUE INDEX "employer_invite_tokens_token_hash_key" ON "employer_invite_tokens"("token_hash");

-- CreateIndex: employer + email lookup
CREATE INDEX "idx_invite_token_employer_email" ON "employer_invite_tokens"("employer_id", "email");

-- CreateIndex: employer + isActive for workforce
CREATE INDEX "idx_workforce_employee_employer_active" ON "workforce_employees"("employer_id", "is_active");

-- AddForeignKey: invite tokens → employers
ALTER TABLE "employer_invite_tokens" ADD CONSTRAINT "employer_invite_tokens_employer_id_fkey"
    FOREIGN KEY ("employer_id") REFERENCES "employers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: invite tokens → users (inviter)
ALTER TABLE "employer_invite_tokens" ADD CONSTRAINT "employer_invite_tokens_invited_by_user_id_fkey"
    FOREIGN KEY ("invited_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: workforce employees → employers
ALTER TABLE "workforce_employees" ADD CONSTRAINT "workforce_employees_employer_id_fkey"
    FOREIGN KEY ("employer_id") REFERENCES "employers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
