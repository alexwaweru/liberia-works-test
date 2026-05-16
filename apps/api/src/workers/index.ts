/**
 * Standalone worker process entrypoint.
 *
 * Each `*.worker.ts` module instantiates its BullMQ Worker as a side effect of
 * being imported. Importing them here is enough to start consuming jobs.
 *
 * Run via: `node dist/workers/index.js`
 */

import './matching.worker.js'
import './outbound-messaging.worker.js'

console.log('[workers] started:', ['matching', 'outbound-messaging'].join(', '))

// Keep the event loop alive even if every BullMQ Worker happens to be idle.
// `setInterval` returns a Timeout which is `ref`'d by default.
const heartbeat = setInterval(() => {}, 1 << 30)

function shutdown(signal: NodeJS.Signals) {
  console.log(`[workers] received ${signal}, shutting down`)
  clearInterval(heartbeat)
  // Give in-flight jobs ~25s to finish before the platform SIGKILLs us at 30s.
  setTimeout(() => process.exit(0), 25_000).unref()
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
