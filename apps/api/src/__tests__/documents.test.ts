import { describe, it, expect, vi, beforeEach } from 'vitest'
import Fastify from 'fastify'
import cookie from '@fastify/cookie'
import jwt from '@fastify/jwt'
import sensible from '@fastify/sensible'
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod'
import type { PrismaClient } from '@prisma/client'

// Mock the @vercel/blob server SDK (for del) and the /client SDK (for handleUpload).
// `vi.hoisted` runs before the hoisted vi.mock() factories so the spies can be shared.
const { delMock, handleUploadMock } = vi.hoisted(() => ({
  delMock: vi.fn().mockResolvedValue(undefined),
  handleUploadMock: vi.fn(),
}))

vi.mock('@vercel/blob', () => ({ del: delMock }))
vi.mock('@vercel/blob/client', () => ({ handleUpload: handleUploadMock }))

vi.mock('../config/env.js', () => ({
  env: {
    NODE_ENV: 'test',
    BLOB_READ_WRITE_TOKEN: 'vercel_blob_rw_test',
    JWT_SECRET: 'test-secret-at-least-32-chars-long!!',
  },
}))

import documentsModule, { meDocumentsModule } from '../modules/documents/index.js'

const JWT_SECRET = 'test-secret-at-least-32-chars-long!!'
const INDIVIDUAL_USER_ID = 'c0000000-0000-4000-8000-000000000001'
const INDIVIDUAL_ID = 'd0000000-0000-4000-8000-000000000001'
const DOCUMENT_ID = 'e0000000-0000-4000-8000-000000000001'

function buildApp() {
  const app = Fastify({ logger: false })
  app.setValidatorCompiler(validatorCompiler)
  app.setSerializerCompiler(serializerCompiler)
  app.register(cookie, { secret: JWT_SECRET })
  app.register(jwt, {
    secret: JWT_SECRET,
    cookie: { cookieName: 'access_token', signed: false },
    sign: { expiresIn: '15m' },
  })
  app.register(sensible)
  app.decorate('prisma', {
    individual: { findUniqueOrThrow: vi.fn() },
    document: {
      create: vi.fn(),
      update: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
  } as unknown as PrismaClient)
  return app
}

function signIndividualToken(app: ReturnType<typeof buildApp>) {
  return app.jwt.sign({
    sub: INDIVIDUAL_USER_ID,
    role: 'INDIVIDUAL',
    sessionId: 'session-doc-001',
  })
}

beforeEach(() => {
  delMock.mockClear()
  handleUploadMock.mockClear()
})

describe('POST /api/v1/documents/upload', () => {
  it('without auth → 401', async () => {
    const app = buildApp()
    await app.register(documentsModule, { prefix: '/api/v1/documents' })
    await app.ready()

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/documents/upload',
      headers: { 'content-type': 'application/json' },
      payload: JSON.stringify({ type: 'blob.generate-client-token', payload: {} }),
    })
    expect(res.statusCode).toBe(401)
  })

  it('delegates to @vercel/blob handleUpload', async () => {
    const app = buildApp()
    handleUploadMock.mockResolvedValue({
      type: 'blob.generate-client-token',
      clientToken: 'fake-token',
    })

    await app.register(documentsModule, { prefix: '/api/v1/documents' })
    await app.ready()
    const token = signIndividualToken(app)

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/documents/upload',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      payload: JSON.stringify({
        type: 'blob.generate-client-token',
        payload: {
          pathname: 'cv.pdf',
          callbackUrl: 'http://localhost/api/v1/documents/upload',
          multipart: false,
          clientPayload: JSON.stringify({ documentType: 'CV' }),
        },
      }),
    })

    expect(res.statusCode).toBe(200)
    expect(handleUploadMock).toHaveBeenCalledOnce()
    expect(res.json()).toEqual({
      type: 'blob.generate-client-token',
      clientToken: 'fake-token',
    })
  })
})

describe('GET /api/v1/documents/:id', () => {
  it('returns the document URL for the uploader', async () => {
    const app = buildApp()
    ;(app.prisma.document.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: DOCUMENT_ID,
      uploadedByUserId: INDIVIDUAL_USER_ID,
      storageKey: 'https://blob.vercel-storage.com/cv-abc123.pdf',
      fileName: 'cv.pdf',
      mimeType: 'application/pdf',
      documentType: 'CV',
      isActive: true,
    })

    await app.register(documentsModule, { prefix: '/api/v1/documents' })
    await app.ready()
    const token = signIndividualToken(app)

    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/documents/${DOCUMENT_ID}/url`,
      headers: { authorization: `Bearer ${token}` },
    })

    expect(res.statusCode).toBe(200)
    expect(res.json()).toEqual({ url: 'https://blob.vercel-storage.com/cv-abc123.pdf' })
  })

  it('404 when document not found', async () => {
    const app = buildApp()
    ;(app.prisma.document.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null)

    await app.register(documentsModule, { prefix: '/api/v1/documents' })
    await app.ready()
    const token = signIndividualToken(app)

    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/documents/${DOCUMENT_ID}/url`,
      headers: { authorization: `Bearer ${token}` },
    })

    expect(res.statusCode).toBe(404)
  })

  it('403 when caller is not the uploader', async () => {
    const app = buildApp()
    ;(app.prisma.document.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: DOCUMENT_ID,
      uploadedByUserId: 'someone-else',
      storageKey: 'https://blob.vercel-storage.com/cv-abc123.pdf',
      isActive: true,
    })

    await app.register(documentsModule, { prefix: '/api/v1/documents' })
    await app.ready()
    const token = signIndividualToken(app)

    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/documents/${DOCUMENT_ID}/url`,
      headers: { authorization: `Bearer ${token}` },
    })

    expect(res.statusCode).toBe(403)
  })
})

describe('DELETE /api/v1/documents/:id', () => {
  it('soft-deletes and calls @vercel/blob del', async () => {
    const app = buildApp()
    ;(app.prisma.document.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: DOCUMENT_ID,
      uploadedByUserId: INDIVIDUAL_USER_ID,
      storageKey: 'https://blob.vercel-storage.com/cv-abc123.pdf',
      isActive: true,
    })
    ;(app.prisma.document.update as ReturnType<typeof vi.fn>).mockResolvedValue({})

    await app.register(documentsModule, { prefix: '/api/v1/documents' })
    await app.ready()
    const token = signIndividualToken(app)

    const res = await app.inject({
      method: 'DELETE',
      url: `/api/v1/documents/${DOCUMENT_ID}`,
      headers: { authorization: `Bearer ${token}` },
    })

    expect(res.statusCode).toBe(204)
    expect(delMock).toHaveBeenCalledWith(
      'https://blob.vercel-storage.com/cv-abc123.pdf',
      { token: 'vercel_blob_rw_test' },
    )
    expect(app.prisma.document.update).toHaveBeenCalledWith({
      where: { id: DOCUMENT_ID },
      data: { isActive: false },
    })
  })

  it('403 when caller is not the uploader', async () => {
    const app = buildApp()
    ;(app.prisma.document.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: DOCUMENT_ID,
      uploadedByUserId: 'someone-else',
      storageKey: 'https://blob.vercel-storage.com/cv-abc123.pdf',
      isActive: true,
    })

    await app.register(documentsModule, { prefix: '/api/v1/documents' })
    await app.ready()
    const token = signIndividualToken(app)

    const res = await app.inject({
      method: 'DELETE',
      url: `/api/v1/documents/${DOCUMENT_ID}`,
      headers: { authorization: `Bearer ${token}` },
    })

    expect(res.statusCode).toBe(403)
    expect(delMock).not.toHaveBeenCalled()
  })
})

describe('GET /api/v1/individuals/me/documents', () => {
  it('returns only the caller\'s active documents', async () => {
    const app = buildApp()
    ;(app.prisma.individual.findUniqueOrThrow as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: INDIVIDUAL_ID,
    })
    ;(app.prisma.document.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      {
        id: DOCUMENT_ID,
        documentType: 'CV',
        fileName: 'cv.pdf',
        mimeType: 'application/pdf',
        fileSizeBytes: 12345n,
        storageKey: 'https://blob.vercel-storage.com/cv-abc123.pdf',
        createdAt: new Date('2025-01-01T00:00:00Z'),
      },
    ])

    await app.register(meDocumentsModule, { prefix: '/api/v1/individuals' })
    await app.ready()
    const token = signIndividualToken(app)

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/individuals/me/documents',
      headers: { authorization: `Bearer ${token}` },
    })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.documents).toHaveLength(1)
    expect(body.documents[0]).toMatchObject({
      id: DOCUMENT_ID,
      documentType: 'CV',
      fileName: 'cv.pdf',
      url: 'https://blob.vercel-storage.com/cv-abc123.pdf',
    })
    expect(app.prisma.document.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { individualId: INDIVIDUAL_ID, isActive: true },
      }),
    )
  })
})
