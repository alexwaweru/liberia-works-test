-- Add new preferred_sectors UUID[] column with empty-array default
ALTER TABLE "program_hosting_capacity"
  ADD COLUMN "preferred_sectors" UUID[] NOT NULL DEFAULT ARRAY[]::UUID[];

-- Backfill existing rows: wrap non-null preferred_sector_id into a single-element array
UPDATE "program_hosting_capacity"
   SET "preferred_sectors" = ARRAY["preferred_sector_id"]
 WHERE "preferred_sector_id" IS NOT NULL;

-- Drop the old single-sector FK + column
ALTER TABLE "program_hosting_capacity"
  DROP CONSTRAINT IF EXISTS "program_hosting_capacity_preferred_sector_id_fkey";

ALTER TABLE "program_hosting_capacity"
  DROP COLUMN "preferred_sector_id";
