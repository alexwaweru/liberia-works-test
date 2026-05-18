import { inngest } from '../client.js'
import { getPrisma } from '../../prisma.js'

export const cvParseFn = inngest.createFunction(
  {
    id: 'cv-parse',
    name: 'CV parse (GPT-4o extraction)',
    concurrency: { limit: 3 },
    onFailure: async ({ event, error }) => {
      await getPrisma().cvParseJob.update({
        where: { id: event.data.event.data.cvParseJobId },
        data: {
          status: 'FAILED',
          errorMessage: error.message,
          processingCompletedAt: new Date(),
        },
      })
    },
  },
  { event: 'cv-parse/start' },
  async ({ event, logger }) => {
    const prisma = getPrisma()
    const { cvParseJobId, storageKey, requestId } = event.data
    logger.info({ cvParseJobId, storageKey, requestId }, 'Processing CV parse job')

    await prisma.cvParseJob.update({
      where: { id: cvParseJobId },
      data: { status: 'PROCESSING', processingStartedAt: new Date() },
    })

    // TODO: download CV from Vercel Blob, send to GPT-4o, parse structured output.
    // See modules/ai/ for prompt templates and confidence score logic.
    throw new Error('CV parse function not yet implemented')
  },
)
