-- CreateEnum
CREATE TYPE "ProgramOptInStatus" AS ENUM ('PENDING', 'MATCHED', 'DECLINED', 'WITHDRAWN');

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

-- CreateIndex
CREATE UNIQUE INDEX "program_opt_ins_individual_id_program_cycle_id_key" ON "program_opt_ins"("individual_id", "program_cycle_id");

-- AddForeignKey
ALTER TABLE "program_opt_ins" ADD CONSTRAINT "program_opt_ins_individual_id_fkey" FOREIGN KEY ("individual_id") REFERENCES "individuals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_opt_ins" ADD CONSTRAINT "program_opt_ins_program_cycle_id_fkey" FOREIGN KEY ("program_cycle_id") REFERENCES "program_cycles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_opt_ins" ADD CONSTRAINT "program_opt_ins_preferred_education_level_id_fkey" FOREIGN KEY ("preferred_education_level_id") REFERENCES "education_levels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_opt_ins" ADD CONSTRAINT "program_opt_ins_matched_employer_id_fkey" FOREIGN KEY ("matched_employer_id") REFERENCES "employers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
