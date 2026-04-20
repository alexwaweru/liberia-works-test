import type { FastifyPluginAsync } from 'fastify'

/**
 * Documents module — Document Vault + DigitalOcean Spaces integration.
 *
 * Pre-signed upload flow:
 *   1. Client requests a pre-signed URL → POST /api/v1/documents/upload-url
 *   2. Client uploads directly to DO Spaces using the pre-signed URL
 *   3. Client confirms upload → POST /api/v1/documents/:id/confirm
 *
 * Endpoints:
 *   POST   /api/v1/documents/upload-url      (get pre-signed PUT URL)
 *   POST   /api/v1/documents/:id/confirm     (register confirmed upload)
 *   GET    /api/v1/documents/:id/url         (get pre-signed GET URL)
 *   DELETE /api/v1/documents/:id             (soft-delete)
 *   GET    /api/v1/individuals/me/documents  (list own documents)
 */
export const documentsModule: FastifyPluginAsync = async (_app) => {
  // TODO: implement in Sprint 0, step 8 (Documents module + S3)
}

export default documentsModule
