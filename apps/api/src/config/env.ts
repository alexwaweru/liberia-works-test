import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3001),
  HOST: z.string().default('0.0.0.0'),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),

  // Database
  DATABASE_URL: z.string().url(),

  // Redis
  REDIS_URL: z.string().default('redis://localhost:6379'),

  // JWT — keep secrets in Doppler, never committed
  JWT_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),

  // Africa's Talking
  AT_API_KEY: z.string().optional(),
  AT_USERNAME: z.string().optional(),
  AT_SENDER_ID: z.string().optional(),

  // DigitalOcean Spaces (S3-compatible)
  DO_SPACES_KEY: z.string().optional(),
  DO_SPACES_SECRET: z.string().optional(),
  DO_SPACES_ENDPOINT: z.string().optional(),
  DO_SPACES_BUCKET: z.string().optional(),
  DO_SPACES_REGION: z.string().default('fra1'),

  // OpenAI (CV parsing)
  OPENAI_API_KEY: z.string().optional(),

  // Resend (email)
  RESEND_API_KEY: z.string().optional(),

  // CORS
  ALLOWED_ORIGINS: z.string().default('http://localhost:3000'),

  // Sentry
  SENTRY_DSN: z.string().optional(),
})

const _parsed = envSchema.safeParse(process.env)

if (!_parsed.success) {
  console.error('Invalid environment variables:')
  console.error(_parsed.error.flatten().fieldErrors)
  process.exit(1)
}

export const env = _parsed.data
export type Env = typeof env
