/**
 * Matching Worker — vacation job candidate matching.
 *
 * Triggered: when a cycle transitions to MATCHING status.
 * Periodic: can be run as a repeatable BullMQ job during the matching window.
 *
 * Algorithm:
 *   1. For each opted-in individual, score against available hosting capacity slots
 *      (county preference, sector interest, education level match).
 *   2. Create VacationJobPlacement records for top matches.
 *   3. Enqueue notifications for matched individuals.
 *   4. Set confirmationDeadline = matchDate + 48h.
 *
 * Queue: matching
 */

import { Worker } from 'bullmq'
import { Redis } from 'ioredis'

const redis = new Redis(process.env['REDIS_URL'] ?? 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
})

export interface MatchingJobData {
  cycleId: string
  requestId?: string
}

const worker = new Worker<MatchingJobData>(
  'matching',
  async (job) => {
    const { cycleId } = job.data
    console.log({ cycleId }, 'Running vacation job matching')

    // TODO: implement matching algorithm
    // Phase 2 feature — Phase 1 scaffold only
    throw new Error('Matching worker not yet implemented (Phase 2)')
  },
  { connection: redis, concurrency: 1 },
)

worker.on('failed', (job, err) => {
  console.error({ jobId: job?.id, err }, 'Matching job failed')
})

process.on('SIGTERM', async () => {
  await worker.close()
  await redis.quit()
})
