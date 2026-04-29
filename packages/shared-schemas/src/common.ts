import { z } from 'zod'

// ── Cursor pagination ─────────────────────────────────────────────────────────

export const CursorQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export const CursorPaginationMetaSchema = z.object({
  nextCursor: z.string().nullable(),
  hasMore: z.boolean(),
  total: z.number().int(),
})

export function CursorPageSchema<T extends z.ZodTypeAny>(itemSchema: T) {
  return z.object({
    data: z.array(itemSchema),
    pagination: CursorPaginationMetaSchema,
  })
}

// ── Standard response envelopes ───────────────────────────────────────────────

export const ErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  code: z.string().optional(),
})

export type CursorQuery = z.infer<typeof CursorQuerySchema>
