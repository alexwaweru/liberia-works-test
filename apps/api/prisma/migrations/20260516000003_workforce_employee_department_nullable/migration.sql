-- Make workforce_employees.department nullable
ALTER TABLE "workforce_employees" ALTER COLUMN "department" DROP NOT NULL;
