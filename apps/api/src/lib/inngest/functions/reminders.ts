import { inngest } from '../client.js'

/**
 * Reminders — scheduled jobs (replaces BullMQ repeatable jobs).
 *
 * Cron-triggered functions use Inngest's cron trigger directly; ad-hoc
 * reminders can also be triggered via `reminders/run` events.
 */

export const messageRetentionPurgeFn = inngest.createFunction(
  { id: 'reminders-message-retention-purge', name: 'Message retention purge' },
  { cron: '0 2 * * *' }, // 02:00 UTC daily
  async ({ logger }) => {
    logger.info('Running daily message retention purge')
    // TODO: anonymise MessageEvent.messageBody where retentionExpiresAt < now()
  },
)

export const remindersFn = inngest.createFunction(
  { id: 'reminders-adhoc', name: 'Ad-hoc reminder dispatch' },
  { event: 'reminders/run' },
  async ({ event, logger }) => {
    const { type } = event.data
    logger.info({ type }, 'Running reminder job')

    switch (type) {
      case 'MESSAGE_RETENTION_PURGE':
        // Same body as the cron version; the event form lets us trigger manually.
        break
      default:
        // Phase 2 reminder types
        break
    }
  },
)
