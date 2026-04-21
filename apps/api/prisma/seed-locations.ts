/**
 * Location data seeder — imports from dr5hn/countries-states-cities-database.
 *
 * Usage:
 *   pnpm --filter @liberia-works/api db:seed:locations
 *   pnpm --filter @liberia-works/api db:seed:locations -- --clear
 *   pnpm --filter @liberia-works/api db:seed:locations -- --only regions
 *   pnpm --filter @liberia-works/api db:seed:locations -- --only subregions
 *   pnpm --filter @liberia-works/api db:seed:locations -- --only countries
 *   pnpm --filter @liberia-works/api db:seed:locations -- --only states
 *   pnpm --filter @liberia-works/api db:seed:locations -- --only cities
 *
 * Note: --only must be run in dependency order: regions → subregions → countries → states → cities
 */

import { PrismaClient, Prisma } from '@prisma/client'
import { gunzipSync } from 'zlib'

const BASE_URL =
  'https://raw.githubusercontent.com/dr5hn/countries-states-cities-database/master/json'

const BATCH_SIZE = 500
const MAX_RETRIES = 3
const RETRY_DELAY_MS = 5_000

const VALID_ONLY = ['regions', 'subregions', 'countries', 'states', 'cities'] as const
type OnlyValue = (typeof VALID_ONLY)[number]

const prisma = new PrismaClient()

// ── CLI args ───────────────────────────────────────────────────────────────────

const args = process.argv.slice(2)
const clearData = args.includes('--clear')
const onlyRaw = (() => {
  const i = args.indexOf('--only')
  return i !== -1 ? args[i + 1] : undefined
})()
const only = VALID_ONLY.includes(onlyRaw as OnlyValue) ? (onlyRaw as OnlyValue) : undefined

if (onlyRaw && !only) {
  console.error(`Unknown --only value: "${onlyRaw}". Valid: ${VALID_ONLY.join(', ')}`)
  process.exit(1)
}

// ── Fetch helpers ──────────────────────────────────────────────────────────────

async function fetchJson(filename: string): Promise<unknown[]> {
  const url = `${BASE_URL}/${filename}`
  console.log(`  Fetching ${url}...`)

  let lastError: unknown
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(300_000) })
      if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`)
      return (await res.json()) as unknown[]
    } catch (err) {
      lastError = err
      if (attempt < MAX_RETRIES - 1) {
        console.warn(
          `    Attempt ${attempt + 1}/${MAX_RETRIES} failed: ${(err as Error).message}. ` +
            `Retrying in ${RETRY_DELAY_MS / 1000}s...`,
        )
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS))
      }
    }
  }
  throw lastError
}

async function fetchGzippedJson(filename: string): Promise<unknown[]> {
  const url = `${BASE_URL}/${filename}`
  console.log(`  Fetching ${url} (gzipped)...`)

  let lastError: unknown
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(600_000) })
      if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`)
      const buf = Buffer.from(await res.arrayBuffer())
      return JSON.parse(gunzipSync(buf).toString('utf-8')) as unknown[]
    } catch (err) {
      lastError = err
      if (attempt < MAX_RETRIES - 1) {
        console.warn(
          `    Attempt ${attempt + 1}/${MAX_RETRIES} failed: ${(err as Error).message}. ` +
            `Retrying in ${RETRY_DELAY_MS / 1000}s...`,
        )
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS))
      }
    }
  }
  throw lastError
}

// ── SQL helpers ────────────────────────────────────────────────────────────────

function jsonSql(val: unknown): string | null {
  return val != null ? JSON.stringify(val) : null
}

function pointSql(lat: unknown, lng: unknown): Prisma.Sql {
  const latF = lat != null && lat !== '' ? parseFloat(String(lat)) : NaN
  const lngF = lng != null && lng !== '' ? parseFloat(String(lng)) : NaN
  if (!isNaN(latF) && !isNaN(lngF)) {
    return Prisma.sql`ST_SetSRID(ST_MakePoint(${lngF}::float8, ${latF}::float8), 4326)::geography`
  }
  return Prisma.sql`NULL::geography`
}

// ── Clear helpers ──────────────────────────────────────────────────────────────

async function clearAll(target: OnlyValue | undefined) {
  if (!target || target === 'cities') {
    await prisma.$executeRaw`TRUNCATE location_city RESTART IDENTITY CASCADE`
    console.log('  Cleared cities')
  }
  if (!target || target === 'states') {
    await prisma.$executeRaw`TRUNCATE location_state RESTART IDENTITY CASCADE`
    console.log('  Cleared states')
  }
  if (!target || target === 'countries') {
    await prisma.$executeRaw`TRUNCATE location_country RESTART IDENTITY CASCADE`
    console.log('  Cleared countries')
  }
  if (!target || target === 'subregions') {
    await prisma.$executeRaw`TRUNCATE location_subregion RESTART IDENTITY CASCADE`
    console.log('  Cleared subregions')
  }
  if (!target || target === 'regions') {
    await prisma.$executeRaw`TRUNCATE location_region RESTART IDENTITY CASCADE`
    console.log('  Cleared regions')
  }
}

// ── Raw data shapes (dr5hn JSON structure) ─────────────────────────────────────

interface RawRegion {
  id: number
  name: string
  translations?: Record<string, string> | null
  wikiDataId?: string | null
}

interface RawSubregion {
  id: number
  name: string
  region_id: number
  translations?: Record<string, string> | null
  wikiDataId?: string | null
}

interface RawCountry {
  id: number
  name: string
  iso3?: string | null
  numeric_code?: string | null
  iso2?: string | null
  phonecode?: string | null
  capital?: string | null
  currency?: string | null
  currency_name?: string | null
  currency_symbol?: string | null
  tld?: string | null
  native?: string | null
  region_id?: number | null
  subregion_id?: number | null
  nationality?: string | null
  timezones?: unknown
  translations?: unknown
  latitude?: string | number | null
  longitude?: string | number | null
  emoji?: string | null
  emojiU?: string | null
  wikiDataId?: string | null
  population?: number | null
  gdp?: number | null
  area_sq_km?: number | null
  postal_code_format?: string | null
  postal_code_regex?: string | null
}

interface RawState {
  id: number
  name: string
  country_id: number
  country_code: string
  fips_code?: string | null
  iso2?: string | null
  iso3166_2?: string | null
  state_code?: string | null
  type?: string | null
  level?: number | null
  parent_id?: number | null
  native?: string | null
  latitude?: string | number | null
  longitude?: string | number | null
  timezone?: string | null
  translations?: unknown
  wikiDataId?: string | null
  population?: number | null
}

interface RawCity {
  id: number
  name: string
  state_id: number
  state_code?: string | null
  country_id: number
  country_code: string
  latitude?: string | number | null
  longitude?: string | number | null
  type?: string | null
  level?: number | null
  parent_id?: number | null
  native?: string | null
  population?: number | null
  timezone?: string | null
  translations?: unknown
  wikiDataId?: string | null
}

// ── Import functions ───────────────────────────────────────────────────────────

async function importRegions() {
  console.log('\nImporting regions...')
  const data = (await fetchJson('regions.json')) as RawRegion[]

  for (let i = 0; i < data.length; i += BATCH_SIZE) {
    const rows = data.slice(i, i + BATCH_SIZE).map(
      (r) => Prisma.sql`(
        ${r.id}, ${r.name}, ${jsonSql(r.translations)}::jsonb,
        ${r.wikiDataId ?? null}, true, NOW(), NOW()
      )`,
    )
    await prisma.$executeRaw`
      INSERT INTO location_region (id, name, translations, wikidata_id, flag, created_at, updated_at)
      VALUES ${Prisma.join(rows)}
      ON CONFLICT (id) DO UPDATE SET
        name         = EXCLUDED.name,
        translations = EXCLUDED.translations,
        wikidata_id  = EXCLUDED.wikidata_id,
        updated_at   = NOW()
    `
  }
  console.log(`  ✓ ${data.length} regions`)
}

async function importSubregions() {
  console.log('\nImporting subregions...')
  const data = (await fetchJson('subregions.json')) as RawSubregion[]

  for (let i = 0; i < data.length; i += BATCH_SIZE) {
    const rows = data.slice(i, i + BATCH_SIZE).map(
      (r) => Prisma.sql`(
        ${r.id}, ${r.name}, ${r.region_id}, ${jsonSql(r.translations)}::jsonb,
        ${r.wikiDataId ?? null}, true, NOW(), NOW()
      )`,
    )
    await prisma.$executeRaw`
      INSERT INTO location_subregion (id, name, region_id, translations, wikidata_id, flag, created_at, updated_at)
      VALUES ${Prisma.join(rows)}
      ON CONFLICT (id) DO UPDATE SET
        name         = EXCLUDED.name,
        region_id    = EXCLUDED.region_id,
        translations = EXCLUDED.translations,
        wikidata_id  = EXCLUDED.wikidata_id,
        updated_at   = NOW()
    `
  }
  console.log(`  ✓ ${data.length} subregions`)
}

async function importCountries() {
  console.log('\nImporting countries...')
  const data = (await fetchJson('countries.json')) as RawCountry[]

  for (let i = 0; i < data.length; i += BATCH_SIZE) {
    const rows = data.slice(i, i + BATCH_SIZE).map(
      (c) => Prisma.sql`(
        ${c.id}, ${c.name}, ${c.iso3 ?? null}, ${c.numeric_code ?? null},
        ${c.iso2 ?? null}, ${c.phonecode ?? null}, ${c.capital ?? null},
        ${c.currency ?? null}, ${c.currency_name ?? null}, ${c.currency_symbol ?? null},
        ${c.tld ?? null}, ${c.native ?? null},
        ${c.region_id ?? null}, ${c.subregion_id ?? null},
        ${c.nationality ?? null}, ${jsonSql(c.timezones)}::jsonb, ${jsonSql(c.translations)}::jsonb,
        ${pointSql(c.latitude, c.longitude)},
        ${c.emoji ?? null}, ${c.emojiU ?? null}, ${c.wikiDataId ?? null}, true,
        ${c.population ?? null}, ${c.gdp ?? null}, ${c.area_sq_km ?? null},
        ${c.postal_code_format ?? null}, ${c.postal_code_regex ?? null},
        NOW(), NOW()
      )`,
    )
    await prisma.$executeRaw`
      INSERT INTO location_country (
        id, name, iso3, numeric_code, iso2, phonecode, capital,
        currency, currency_name, currency_symbol, tld, native,
        region_id, subregion_id, nationality, timezones, translations,
        location, emoji, emoji_u, wikidata_id, flag,
        population, gdp, area_sq_km, postal_code_format, postal_code_regex,
        created_at, updated_at
      )
      VALUES ${Prisma.join(rows)}
      ON CONFLICT (id) DO UPDATE SET
        name               = EXCLUDED.name,
        iso3               = EXCLUDED.iso3,
        numeric_code       = EXCLUDED.numeric_code,
        iso2               = EXCLUDED.iso2,
        phonecode          = EXCLUDED.phonecode,
        capital            = EXCLUDED.capital,
        currency           = EXCLUDED.currency,
        currency_name      = EXCLUDED.currency_name,
        currency_symbol    = EXCLUDED.currency_symbol,
        tld                = EXCLUDED.tld,
        native             = EXCLUDED.native,
        region_id          = EXCLUDED.region_id,
        subregion_id       = EXCLUDED.subregion_id,
        nationality        = EXCLUDED.nationality,
        timezones          = EXCLUDED.timezones,
        translations       = EXCLUDED.translations,
        location           = EXCLUDED.location,
        emoji              = EXCLUDED.emoji,
        emoji_u            = EXCLUDED.emoji_u,
        wikidata_id        = EXCLUDED.wikidata_id,
        population         = EXCLUDED.population,
        gdp                = EXCLUDED.gdp,
        area_sq_km         = EXCLUDED.area_sq_km,
        postal_code_format = EXCLUDED.postal_code_format,
        postal_code_regex  = EXCLUDED.postal_code_regex,
        updated_at         = NOW()
    `
  }
  console.log(`  ✓ ${data.length} countries`)
}

// Two-pass: first insert all rows with parent_id = NULL, then back-fill parent refs.
async function importStates() {
  console.log('\nImporting states...')
  const data = (await fetchJson('states.json')) as RawState[]
  const parentUpdates: { id: number; parentId: number }[] = []
  let imported = 0

  for (let i = 0; i < data.length; i += BATCH_SIZE) {
    const batch = data.slice(i, i + BATCH_SIZE)

    for (const s of batch) {
      if (s.parent_id) parentUpdates.push({ id: s.id, parentId: s.parent_id })
    }

    const rows = batch.map(
      (s) => Prisma.sql`(
        ${s.id}, ${s.name}, ${s.country_id}, ${s.country_code},
        ${s.fips_code ?? null}, ${s.iso2 ?? null}, ${s.iso3166_2 ?? null},
        ${s.state_code ?? ''}, ${s.type ?? null}, ${s.level ?? null},
        NULL,
        ${s.native ?? null}, ${pointSql(s.latitude, s.longitude)},
        ${s.timezone ?? null}, ${jsonSql(s.translations)}::jsonb,
        ${s.wikiDataId ?? null}, true, ${s.population ?? null},
        NOW(), NOW()
      )`,
    )

    await prisma.$executeRaw`
      INSERT INTO location_state (
        id, name, country_id, country_code, fips_code, iso2, iso3166_2,
        state_code, state_type, level, parent_id, native, location,
        timezone, translations, wikidata_id, flag, population, created_at, updated_at
      )
      VALUES ${Prisma.join(rows)}
      ON CONFLICT (id) DO UPDATE SET
        name         = EXCLUDED.name,
        country_id   = EXCLUDED.country_id,
        country_code = EXCLUDED.country_code,
        fips_code    = EXCLUDED.fips_code,
        iso2         = EXCLUDED.iso2,
        iso3166_2    = EXCLUDED.iso3166_2,
        state_code   = EXCLUDED.state_code,
        state_type   = EXCLUDED.state_type,
        level        = EXCLUDED.level,
        native       = EXCLUDED.native,
        location     = EXCLUDED.location,
        timezone     = EXCLUDED.timezone,
        translations = EXCLUDED.translations,
        wikidata_id  = EXCLUDED.wikidata_id,
        population   = EXCLUDED.population,
        updated_at   = NOW()
    `

    imported += batch.length
    process.stdout.write(`  ${imported}/${data.length} states...\r`)
  }

  if (parentUpdates.length > 0) {
    console.log(`\n  Resolving ${parentUpdates.length} parent references...`)
    for (let i = 0; i < parentUpdates.length; i += BATCH_SIZE) {
      await Promise.all(
        parentUpdates.slice(i, i + BATCH_SIZE).map(({ id, parentId }) =>
          prisma.$executeRaw`UPDATE location_state SET parent_id = ${parentId} WHERE id = ${id}`,
        ),
      )
    }
  }

  console.log(`  ✓ ${data.length} states`)
}

// Two-pass: City.location is NOT NULL so cities without coordinates are skipped.
async function importCities() {
  console.log('\nImporting cities (this may take a while)...')
  const data = (await fetchGzippedJson('cities.json.gz')) as RawCity[]
  const parentUpdates: { id: number; parentId: number }[] = []
  let imported = 0
  let skipped = 0

  for (let i = 0; i < data.length; i += BATCH_SIZE) {
    const batch = data.slice(i, i + BATCH_SIZE)
    const rows: Prisma.Sql[] = []

    for (const c of batch) {
      const latF = c.latitude != null && c.latitude !== '' ? parseFloat(String(c.latitude)) : NaN
      const lngF = c.longitude != null && c.longitude !== '' ? parseFloat(String(c.longitude)) : NaN

      if (isNaN(latF) || isNaN(lngF)) {
        skipped++
        continue
      }

      if (c.parent_id) parentUpdates.push({ id: c.id, parentId: c.parent_id })

      rows.push(
        Prisma.sql`(
          ${c.id}, ${c.name}, ${c.state_id}, ${c.state_code ?? ''}, ${c.country_id}, ${c.country_code},
          ST_SetSRID(ST_MakePoint(${lngF}::float8, ${latF}::float8), 4326)::geography,
          ${c.type ?? null}, ${c.level ?? null}, NULL,
          ${c.native ?? null}, ${c.population ?? null}, ${c.timezone ?? null},
          ${jsonSql(c.translations)}::jsonb, ${c.wikiDataId ?? null}, true,
          NOW(), NOW()
        )`,
      )
    }

    if (rows.length === 0) continue

    await prisma.$executeRaw`
      INSERT INTO location_city (
        id, name, state_id, state_code, country_id, country_code,
        location, city_type, level, parent_id,
        native, population, timezone, translations, wikidata_id, flag,
        created_at, updated_at
      )
      VALUES ${Prisma.join(rows)}
      ON CONFLICT (id) DO UPDATE SET
        name         = EXCLUDED.name,
        state_id     = EXCLUDED.state_id,
        state_code   = EXCLUDED.state_code,
        country_id   = EXCLUDED.country_id,
        country_code = EXCLUDED.country_code,
        location     = EXCLUDED.location,
        city_type    = EXCLUDED.city_type,
        level        = EXCLUDED.level,
        native       = EXCLUDED.native,
        population   = EXCLUDED.population,
        timezone     = EXCLUDED.timezone,
        translations = EXCLUDED.translations,
        wikidata_id  = EXCLUDED.wikidata_id,
        updated_at   = NOW()
    `

    imported += rows.length
    process.stdout.write(`  ${imported + skipped}/${data.length} cities processed...\r`)
  }

  if (parentUpdates.length > 0) {
    console.log(`\n  Resolving ${parentUpdates.length} parent references...`)
    for (let i = 0; i < parentUpdates.length; i += BATCH_SIZE) {
      await Promise.all(
        parentUpdates.slice(i, i + BATCH_SIZE).map(({ id, parentId }) =>
          prisma.$executeRaw`UPDATE location_city SET parent_id = ${parentId} WHERE id = ${id}`,
        ),
      )
    }
  }

  console.log(`  ✓ ${imported} cities imported (${skipped} skipped — no coordinates)`)
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Location data seeder')
  if (only) console.log(`  (only: ${only})`)

  if (clearData) {
    console.log('\nClearing existing data...')
    await clearAll(only)
  }

  if (!only || only === 'regions') await importRegions()
  if (!only || only === 'subregions') await importSubregions()
  if (!only || only === 'countries') await importCountries()
  if (!only || only === 'states') await importStates()
  if (!only || only === 'cities') await importCities()

  console.log('\nDone. Location data seeded successfully.')
}

main()
  .catch((err) => {
    console.error('\nSeed failed:', err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
