/**
 * Reference data seeder — idempotent, keyed on ISO/ISIC/ISCO codes.
 * Run: pnpm --filter @liberia-works/api db:seed
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding reference data...')

  // ── 15 Liberian counties (ISO 3166-2:LR) ─────────────────────────────────
  const counties = [
    { isoCode: 'LR-BM', name: 'Bomi', region: 'Western' },
    { isoCode: 'LR-BN', name: 'Bong', region: 'Central' },
    { isoCode: 'LR-GA', name: 'Gbarpolu', region: 'Western' },
    { isoCode: 'LR-GB', name: 'Grand Bassa', region: 'Southcentral' },
    { isoCode: 'LR-GC', name: 'Grand Cape Mount', region: 'Western' },
    { isoCode: 'LR-GG', name: 'Grand Gedeh', region: 'Southeastern' },
    { isoCode: 'LR-GK', name: 'Grand Kru', region: 'Southeastern' },
    { isoCode: 'LR-LO', name: 'Lofa', region: 'Northern' },
    { isoCode: 'LR-MA', name: 'Margibi', region: 'Southcentral' },
    { isoCode: 'LR-MY', name: 'Maryland', region: 'Southeastern' },
    { isoCode: 'LR-MO', name: 'Montserrado', region: 'Western' },
    { isoCode: 'LR-NI', name: 'Nimba', region: 'Northern' },
    { isoCode: 'LR-RG', name: 'River Gee', region: 'Southeastern' },
    { isoCode: 'LR-RI', name: 'Rivercess', region: 'Southcentral' },
    { isoCode: 'LR-SI', name: 'Sinoe', region: 'Southeastern' },
  ]

  for (const county of counties) {
    await prisma.county.upsert({
      where: { isoCode: county.isoCode },
      update: { name: county.name, region: county.region },
      create: county,
    })
  }
  console.log(`  ✓ ${counties.length} counties`)

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

  // ── Liberia as a country (ISO 3166-1) ─────────────────────────────────────
  // Full country list should be loaded from a CSV/JSON in production.
  // Stub with the most common ones for Phase 1.
  const countries = [
    { alpha2: 'LR', alpha3: 'LBR', name: 'Liberia' },
    { alpha2: 'NG', alpha3: 'NGA', name: 'Nigeria' },
    { alpha2: 'GH', alpha3: 'GHA', name: 'Ghana' },
    { alpha2: 'SL', alpha3: 'SLE', name: 'Sierra Leone' },
    { alpha2: 'GN', alpha3: 'GIN', name: 'Guinea' },
    { alpha2: 'CI', alpha3: 'CIV', name: "Côte d'Ivoire" },
    { alpha2: 'SN', alpha3: 'SEN', name: 'Senegal' },
    { alpha2: 'IN', alpha3: 'IND', name: 'India' },
    { alpha2: 'CN', alpha3: 'CHN', name: 'China' },
    { alpha2: 'LB', alpha3: 'LBN', name: 'Lebanon' },
    { alpha2: 'US', alpha3: 'USA', name: 'United States' },
    { alpha2: 'GB', alpha3: 'GBR', name: 'United Kingdom' },
  ]

  for (const country of countries) {
    await prisma.country.upsert({
      where: { alpha2: country.alpha2 },
      update: { alpha3: country.alpha3, name: country.name },
      create: country,
    })
  }
  console.log(`  ✓ ${countries.length} countries (stub — expand to ISO 3166-1 full list)`)

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
