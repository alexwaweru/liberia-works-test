import fp from 'fastify-plugin'
import type { FastifyPluginAsync, FastifyError } from 'fastify'
import { ZodError } from 'zod'

const errorHandlerPlugin: FastifyPluginAsync = async (app) => {
  app.setErrorHandler((error: FastifyError | Error, request, reply) => {
    // Zod validation errors → 400
    if (error instanceof ZodError) {
      return reply.code(400).send({
        success: false,
        error: 'Validation error',
        code: 'VALIDATION_ERROR',
        issues: error.flatten().fieldErrors,
      })
    }

    // Fastify HTTP errors (statusCode set by @fastify/sensible helpers)
    const statusCode = 'statusCode' in error ? (error as FastifyError).statusCode : undefined
    if (statusCode && statusCode < 500) {
      return reply.code(statusCode).send({
        success: false,
        error: error.message,
        code: 'code' in error ? (error as FastifyError).code : 'HTTP_ERROR',
      })
    }

    // Unexpected errors → 500
    request.log.error({ err: error }, 'Unhandled error')
    return reply.code(500).send({
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
    })
  })
}

export default fp(errorHandlerPlugin, { name: 'error-handler' })
