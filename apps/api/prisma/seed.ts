/**
 * Reference data seeder — idempotent, keyed on ISO/ISIC/ISCO codes.
 * Run: pnpm --filter @liberia-works/api db:seed
 */

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const prisma = new PrismaClient({ adapter: new PrismaPg(new pg.Pool({ connectionString: process.env.DATABASE_URL })) })

async function main() {
  console.log('Seeding reference data...')

  // ── ISCED 2011 education levels ───────────────────────────────────────────
  const educationLevels = [
    { iscedCode: '0', name: 'None / Early childhood', levelOrder: 0 },
    { iscedCode: '1', name: 'Primary', levelOrder: 1 },
    { iscedCode: '2', name: 'Junior Secondary (JSS)', levelOrder: 2 },
    { iscedCode: '3', name: 'Senior Secondary (SSS)', levelOrder: 3 },
    { iscedCode: '4', name: 'Vocational / Technical', levelOrder: 4 },
    { iscedCode: '5', name: 'Diploma / Associate', levelOrder: 5 },
    { iscedCode: '6', name: "Bachelor's Degree", levelOrder: 6 },
    { iscedCode: '7', name: "Master's / Postgraduate", levelOrder: 7 },
    { iscedCode: '8', name: 'Doctoral / PhD', levelOrder: 8 },
  ]

  for (const level of educationLevels) {
    await prisma.educationLevel.upsert({
      where: { iscedCode: level.iscedCode },
      update: { name: level.name, levelOrder: level.levelOrder },
      create: level,
    })
  }
  console.log(`  ✓ ${educationLevels.length} education levels`)

  // ── ISIC Rev.4 sectors (top-level sections only — expand to full taxonomy) ─
  // Full 400-entry taxonomy should be loaded from the official ISIC spreadsheet.
  const sectors = [
    { isicCode: 'A', name: 'Agriculture, Forestry and Fishing', level: 1 },
    { isicCode: 'B', name: 'Mining and Quarrying', level: 1 },
    { isicCode: 'C', name: 'Manufacturing', level: 1 },
    { isicCode: 'D', name: 'Electricity, Gas, Steam and Air Conditioning Supply', level: 1 },
    { isicCode: 'E', name: 'Water Supply; Sewerage, Waste Management', level: 1 },
    { isicCode: 'F', name: 'Construction', level: 1 },
    { isicCode: 'G', name: 'Wholesale and Retail Trade', level: 1 },
    { isicCode: 'H', name: 'Transportation and Storage', level: 1 },
    { isicCode: 'I', name: 'Accommodation and Food Service Activities', level: 1 },
    { isicCode: 'J', name: 'Information and Communication', level: 1 },
    { isicCode: 'K', name: 'Financial and Insurance Activities', level: 1 },
    { isicCode: 'L', name: 'Real Estate Activities', level: 1 },
    { isicCode: 'M', name: 'Professional, Scientific and Technical Activities', level: 1 },
    { isicCode: 'N', name: 'Administrative and Support Service Activities', level: 1 },
    { isicCode: 'O', name: 'Public Administration and Defence', level: 1 },
    { isicCode: 'P', name: 'Education', level: 1 },
    { isicCode: 'Q', name: 'Human Health and Social Work Activities', level: 1 },
    { isicCode: 'R', name: 'Arts, Entertainment and Recreation', level: 1 },
    { isicCode: 'S', name: 'Other Service Activities', level: 1 },
    { isicCode: 'T', name: 'Activities of Households as Employers', level: 1 },
    { isicCode: 'U', name: 'Activities of Extraterritorial Organisations', level: 1 },
  ]

  for (const sector of sectors) {
    await prisma.sector.upsert({
      where: { isicCode: sector.isicCode },
      update: { name: sector.name },
      create: sector,
    })
  }
  console.log(`  ✓ ${sectors.length} ISIC sections (stub — expand to full Rev.4 taxonomy)`)

  // ── ISCO-08 occupations — stub with major group headers ───────────────────
  // Full 430-entry 4-digit unit group list should be loaded from the ILO spreadsheet.
  const occupations = [
    { iscoCode: '1000', name: 'Managers', majorGroup: 'Managers' },
    { iscoCode: '2000', name: 'Professionals', majorGroup: 'Professionals' },
    { iscoCode: '3000', name: 'Technicians and Associate Professionals', majorGroup: 'Technicians' },
    { iscoCode: '4000', name: 'Clerical Support Workers', majorGroup: 'Clerical' },
    { iscoCode: '5000', name: 'Services and Sales Workers', majorGroup: 'Services' },
    { iscoCode: '6000', name: 'Skilled Agricultural, Forestry and Fishery Workers', majorGroup: 'Agriculture' },
    { iscoCode: '7000', name: 'Craft and Related Trades Workers', majorGroup: 'Craft' },
    { iscoCode: '8000', name: 'Plant and Machine Operators and Assemblers', majorGroup: 'Operators' },
    { iscoCode: '9000', name: 'Elementary Occupations', majorGroup: 'Elementary' },
    { iscoCode: '0000', name: 'Armed Forces Occupations', majorGroup: 'Armed Forces' },
  ]

  for (const occ of occupations) {
    await prisma.occupation.upsert({
      where: { iscoCode: occ.iscoCode },
      update: { name: occ.name, majorGroup: occ.majorGroup },
      create: occ,
    })
  }
  console.log(`  ✓ ${occupations.length} ISCO major groups (stub — expand to full 4-digit unit groups)`)

  console.log('\nDone. Reference data seeded successfully.')
}

main()
  .catch((err) => {
    console.error('Seed failed:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
