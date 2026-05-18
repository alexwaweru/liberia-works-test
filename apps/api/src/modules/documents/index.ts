import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { del } from '@vercel/blob'
import { authenticate } from '../../plugins/auth.js'
import { env } from '../../config/env.js'

/**
 * Documents module — Vercel Blob integration.
 *
 * Upload flow (client-direct):
 *   1. Client calls `upload(pathname, file, { handleUploadUrl: '/api/v1/documents/upload' })`
 *      from '@vercel/blob/client'. The SDK first POSTs a `blob.generate-client-token`
 *      event to this endpoint to obtain a short-lived upload token, then PUTs the
 *      file straight to Vercel Blob.
 *   2. After the PUT completes, the Blob service POSTs a `blob.upload-completed`
 *      event to this same endpoint. We mark the Document row active.
 *
 * Endpoints:
 *   POST   /api/v1/documents/upload          (handles both Vercel Blob upload phases)
 *   GET    /api/v1/documents/:id/url         (returns the stored blob URL)
 *   DELETE /api/v1/documents/:id             (soft-delete + blob del)
 *   GET    /api/v1/individuals/me/documents  (mounted via meDocumentsModule)
 */

const DocumentTypeSchema = z.enum([
  'CV',
  'NATIONAL_ID',
  'PASSPORT',
  'CERTIFICATE',
  'TRAINING_RECORD',
  'PERMIT_DOC',
  'DISPUTE_ATTACHMENT',
  'OTHER',
])

const ClientPayloadSchema = z.object({
  documentType: DocumentTypeSchema,
  individualId: z.string().uuid().optional(),
  employerId: z.string().uuid().optional(),
  workPermitApplicationId: z.string().uuid().optional(),
  disputeId: z.string().uuid().optional(),
})

const ALLOWED_CONTENT_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
]

const MAX_BYTES = 10 * 1024 * 1024 // 10 MB

export const documentsModule: FastifyPluginAsync = async (app) => {
  const server = app.withTypeProvider<ZodTypeProvider>()

  server.post('/upload', { preHandler: [authenticate] }, async (req, reply) => {
    const body = req.body as HandleUploadBody
    const userId = req.authUser!.id

    const result = await handleUpload({
      body,
      request: req.raw,
      ...(env.BLOB_READ_WRITE_TOKEN ? { token: env.BLOB_READ_WRITE_TOKEN } : {}),
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const meta = ClientPayloadSchema.parse(JSON.parse(clientPayload ?? '{}'))

        const doc = await app.prisma.document.create({
          data: {
            documentType: meta.documentType,
            storageKey: '',
            fileName: pathname.split('/').pop() ?? pathname,
            fileSizeBytes: 0n,
            mimeType: '',
            uploadedByUserId: userId,
            isActive: false,
            ...(meta.individualId ? { individualId: meta.individualId } : {}),
            ...(meta.employerId ? { employerId: meta.employerId } : {}),
            ...(meta.workPermitApplicationId
              ? { workPermitApplicationId: meta.workPermitApplicationId }
              : {}),
            ...(meta.disputeId ? { disputeId: meta.disputeId } : {}),
          },
        })

        return {
          allowedContentTypes: ALLOWED_CONTENT_TYPES,
          maximumSizeInBytes: MAX_BYTES,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ documentId: doc.id }),
        }
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        const payload = JSON.parse(tokenPayload ?? '{}') as { documentId?: string }
        if (!payload.documentId) {
          app.log.warn({ blob }, 'Blob upload completed without a documentId')
          return
        }
        await app.prisma.document.update({
          where: { id: payload.documentId },
          data: {
            storageKey: blob.url,
            mimeType: blob.contentType ?? '',
            isActive: true,
          },
        })
      },
    })

    return reply.send(result)
  })

  server.get(
    '/:id/url',
    {
      preHandler: [authenticate],
      schema: { params: z.object({ id: z.string().uuid() }) },
    },
    async (req, reply) => {
      const doc = await app.prisma.document.findUnique({ where: { id: req.params.id } })
      if (!doc) return reply.notFound('Document not found')
      if (doc.uploadedByUserId !== req.authUser!.id) {
        return reply.forbidden('Not your document')
      }
      return { url: doc.storageKey }
    },
  )

  server.delete(
    '/:id',
    {
      preHandler: [authenticate],
      schema: { params: z.object({ id: z.string().uuid() }) },
    },
    async (req, reply) => {
      const doc = await app.prisma.document.findUnique({ where: { id: req.params.id } })
      if (!doc) return reply.notFound('Document not found')
      if (doc.uploadedByUserId !== req.authUser!.id) {
        return reply.forbidden('Not your document')
      }

      if (doc.storageKey && env.BLOB_READ_WRITE_TOKEN) {
        await del(doc.storageKey, { token: env.BLOB_READ_WRITE_TOKEN })
      }
      await app.prisma.document.update({
        where: { id: doc.id },
        data: { isActive: false },
      })
      return reply.status(204).send()
    },
  )
}

/**
 * Mounted at /api/v1/individuals (alongside the individuals module) to keep the
 * route shape `/api/v1/individuals/me/documents` exactly as documented.
 */
export const meDocumentsModule: FastifyPluginAsync = async (app) => {
  const server = app.withTypeProvider<ZodTypeProvider>()

  server.get('/me/documents', { preHandler: [authenticate] }, async (req) => {
    const individual = await app.prisma.individual.findUniqueOrThrow({
      where: { userId: req.authUser!.id },
      select: { id: true },
    })

    const docs = await app.prisma.document.findMany({
      where: { individualId: individual.id, isActive: true },
      orderBy: { createdAt: 'desc' },
    })

    return {
      documents: docs.map((d) => ({
        id: d.id,
        documentType: d.documentType,
        fileName: d.fileName,
        mimeType: d.mimeType,
        fileSizeBytes: d.fileSizeBytes.toString(),
        url: d.storageKey,
        createdAt: d.createdAt.toISOString(),
      })),
    }
  })
}

export default documentsModule
