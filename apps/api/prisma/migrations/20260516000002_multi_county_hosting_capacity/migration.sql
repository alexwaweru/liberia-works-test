-- Drop the old unique constraint on (employer_id, cycle_id)
DROP INDEX IF EXISTS "program_hosting_capacity_employer_id_cycle_id_key";

-- Add the new unique constraint on (employer_id, cycle_id, state_id)
ALTER TABLE "program_hosting_capacity" ADD CONSTRAINT "program_hosting_capacity_employer_id_cycle_id_state_id_key" UNIQUE ("employer_id", "cycle_id", "state_id");
