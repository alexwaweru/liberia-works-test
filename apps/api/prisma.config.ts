import { defineConfig } from 'prisma/config'

// Prisma 7 moved connection URLs out of schema.prisma. The runtime PrismaClient
// uses `@prisma/adapter-pg` (see src/lib/prisma.ts) and reads DATABASE_URL
// directly, so the URL below is consulted only by Prisma CLI commands —
// `prisma migrate`, `prisma db pull`, etc.
//
// On Supabase, those CLI commands must NOT go through the pgBouncer pooler
// (transaction mode breaks prepared statements), so we prefer DIRECT_URL and
// fall back to DATABASE_URL for local dev where the two are the same.
export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: process.env['DIRECT_URL'] ?? process.env['DATABASE_URL'] ?? '',
  },
})
