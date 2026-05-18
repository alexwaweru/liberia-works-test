import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import { env } from '../config/env.js'

// Single PrismaClient instance shared by the Fastify request handlers and the
// Inngest function handlers. On Vercel serverless, the module is cached
// per-instance — instantiating once avoids exhausting Supabase's connection
// pool when many cold starts collide.
let _prisma: PrismaClient | null = null

export function getPrisma(): PrismaClient {
  if (_prisma) return _prisma
  const pool = new pg.Pool({ connectionString: env.DATABASE_URL })
  const adapter = new PrismaPg(pool)
  _prisma = new PrismaClient({ adapter })
  return _prisma
}
