import type { FastifyPluginAsync } from 'fastify'

/**
 * AI module — CV parsing service (GPT-4o).
 *
 * This module only exposes status-check endpoints.
 * Actual parsing is triggered by the documents module and runs in an Inngest
 * function (see src/lib/inngest/functions/cv-parse.ts).
 *
 * Endpoints:
 *   GET /api/v1/cv-parse-jobs/:id  (check parse job status + extracted data)
 *
 * Internal service (called from documents module):
 *   parseCv(documentId, individualId, storageKey) → sends `cv-parse/start` event
 */
export const aiModule: FastifyPluginAsync = async (_app) => {
  // TODO: implement in Sprint 0, step 8 (Documents module + S3)
}

export default aiModule
