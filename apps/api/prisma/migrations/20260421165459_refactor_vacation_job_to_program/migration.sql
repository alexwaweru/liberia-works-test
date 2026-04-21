/*
  Warnings:

  - You are about to drop the column `attempts` on the `otp_codes` table. All the data in the column will be lost.
  - You are about to drop the `vacation_job_cycles` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `vacation_job_hosting_capacity` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `vacation_job_placements` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "ProgramType" AS ENUM ('VACATION_JOB');

-- CreateEnum
CREATE TYPE "ProgramCycleStatus" AS ENUM ('PLANNED', 'OPEN', 'MATCHING', 'COMPLETED');

-- CreateEnum
CREATE TYPE "ProgramPlacementStatus" AS ENUM ('MATCHED', 'CONFIRMED', 'COMPLETED', 'NO_SHOW', 'CANCELLED');

-- DropForeignKey
ALTER TABLE "vacation_job_hosting_capacity" DROP CONSTRAINT "vacation_job_hosting_capacity_county_id_fkey";

-- DropForeignKey
ALTER TABLE "vacation_job_hosting_capacity" DROP CONSTRAINT "vacation_job_hosting_capacity_cycle_id_fkey";

-- DropForeignKey
ALTER TABLE "vacation_job_hosting_capacity" DROP CONSTRAINT "vacation_job_hosting_capacity_employer_id_fkey";

-- DropForeignKey
ALTER TABLE "vacation_job_hosting_capacity" DROP CONSTRAINT "vacation_job_hosting_capacity_preferred_education_level_id_fkey";

-- DropForeignKey
ALTER TABLE "vacation_job_hosting_capacity" DROP CONSTRAINT "vacation_job_hosting_capacity_preferred_sector_id_fkey";

-- DropForeignKey
ALTER TABLE "vacation_job_placements" DROP CONSTRAINT "vacation_job_placements_cycle_id_fkey";

-- DropForeignKey
ALTER TABLE "vacation_job_placements" DROP CONSTRAINT "vacation_job_placements_employer_id_fkey";

-- DropForeignKey
ALTER TABLE "vacation_job_placements" DROP CONSTRAINT "vacation_job_placements_individual_id_fkey";

-- AlterTable
ALTER TABLE "otp_codes" DROP COLUMN "attempts";

-- DropTable
DROP TABLE "vacation_job_cycles";

-- DropTable
DROP TABLE "vacation_job_hosting_capacity";

-- DropTable
DROP TABLE "vacation_job_placements";

-- DropEnum
DROP TYPE "PlacementStatus";

-- DropEnum
DROP TYPE "VacationJobCycleStatus";

-- CreateTable
CREATE TABLE "program_cycles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "type" "ProgramType" NOT NULL,
    "name" VARCHAR(100) NOT NULL,
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
    "preferred_sector_id" UUID,
    "preferred_education_level_id" UUID,
    "county_id" UUID NOT NULL,
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

-- CreateIndex
CREATE UNIQUE INDEX "program_hosting_capacity_employer_id_cycle_id_key" ON "program_hosting_capacity"("employer_id", "cycle_id");

-- CreateIndex
CREATE UNIQUE INDEX "program_placements_confirmation_code_key" ON "program_placements"("confirmation_code");

-- AddForeignKey
ALTER TABLE "program_hosting_capacity" ADD CONSTRAINT "program_hosting_capacity_employer_id_fkey" FOREIGN KEY ("employer_id") REFERENCES "employers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_hosting_capacity" ADD CONSTRAINT "program_hosting_capacity_cycle_id_fkey" FOREIGN KEY ("cycle_id") REFERENCES "program_cycles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_hosting_capacity" ADD CONSTRAINT "program_hosting_capacity_preferred_sector_id_fkey" FOREIGN KEY ("preferred_sector_id") REFERENCES "sectors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_hosting_capacity" ADD CONSTRAINT "program_hosting_capacity_preferred_education_level_id_fkey" FOREIGN KEY ("preferred_education_level_id") REFERENCES "education_levels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_hosting_capacity" ADD CONSTRAINT "program_hosting_capacity_county_id_fkey" FOREIGN KEY ("county_id") REFERENCES "counties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_placements" ADD CONSTRAINT "program_placements_individual_id_fkey" FOREIGN KEY ("individual_id") REFERENCES "individuals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_placements" ADD CONSTRAINT "program_placements_employer_id_fkey" FOREIGN KEY ("employer_id") REFERENCES "employers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_placements" ADD CONSTRAINT "program_placements_cycle_id_fkey" FOREIGN KEY ("cycle_id") REFERENCES "program_cycles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
