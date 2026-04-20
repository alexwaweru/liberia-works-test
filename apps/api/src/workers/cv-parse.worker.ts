/**
 * CV Parse Worker — GPT-4o extraction.
 *
 * Queue: cv-parse
 * Typical duration: 10–60s
 * On success: updates CvParseJob.status → COMPLETED, writes extractedData
 * On failure: updates CvParseJob.status → FAILED, writes errorMessage
 *
 * Run as a separate Node process:
 *   node dist/workers/cv-parse.worker.js
 */

import { Worker } from 'bullmq'
import { PrismaClient } from '@prisma/client'
import { Redis } from 'ioredis'

const redis = new Redis(process.env['REDIS_URL'] ?? 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
})

const prisma = new PrismaClient()

export interface CvParseJobData {
  cvParseJobId: string
  documentId: string
  individualId: string
  storageKey: string
  requestId?: string
}

const worker = new Worker<CvParseJobData>(
  'cv-parse',
  async (job) => {
    const { cvParseJobId, storageKey, requestId } = job.data

    console.log({ cvParseJobId, storageKey, requestId }, 'Processing CV parse job')

    await prisma.cvParseJob.update({
      where: { id: cvParseJobId },
      data: { status: 'PROCESSING', processingStartedAt: new Date() },
    })

    // TODO: download CV from DO Spaces, send to GPT-4o, parse structured output
    // See modules/ai/ for prompt templates and confidence score logic

    throw new Error('CV parse worker not yet implemented')
  },
  { connection: redis, concurrency: 3 },
)

worker.on('failed', async (job, err) => {
  if (!job) return
  await prisma.cvParseJob.update({
    where: { id: job.data.cvParseJobId },
    data: {
      status: 'FAILED',
      errorMessage: err.message,
      processingCompletedAt: new Date(),
    },
  })
  console.error({ jobId: job.id, err }, 'CV parse job failed')
})

process.on('SIGTERM', async () => {
  await worker.close()
  await prisma.$disconnect()
  await redis.quit()
})
