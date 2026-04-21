import fp from 'fastify-plugin'
import swagger from '@fastify/swagger'
import { jsonSchemaTransform } from 'fastify-type-provider-zod'
import type { FastifyPluginAsync } from 'fastify'

const scalarPlugin: FastifyPluginAsync = async (app) => {
  await app.register(swagger, {
    openapi: {
      openapi: '3.0.3',
      info: {
        title: 'Liberia Works API',
        description: 'Ministry of Labour workforce management platform',
        version: '1.0.0',
      },
      servers: [{ url: '/api/v1', description: 'v1' }],
      components: {
        securitySchemes: {
          cookieAuth: {
            type: 'apiKey',
            in: 'cookie',
            name: 'access_token',
          },
        },
      },
      security: [{ cookieAuth: [] }],
      tags: [
        { name: 'auth', description: 'Authentication & sessions' },
        { name: 'individuals', description: 'Individual profiles' },
        { name: 'employers', description: 'Employer management' },
        { name: 'vacancies', description: 'Vacancy listings' },
        { name: 'applications', description: 'Job applications' },
        { name: 'work-permits', description: 'Work permit applications' },
        { name: 'disputes', description: 'Dispute submissions' },
        { name: 'programs', description: 'Programs (vacation jobs and future programme types)' },
        { name: 'mol', description: 'MoL dashboard (read-only)' },
        { name: 'reference', description: 'Reference data (sectors, occupations, countries, education levels, regions, subregions, states, cities)' },
      ],
    },
    transform: jsonSchemaTransform,
  })

  await app.register(import('@scalar/fastify-api-reference'), {
    routePrefix: '/api/docs',
  })

  // Helmet's default CSP blocks Scalar's inline bootstrap script.
  // Relax only for the docs path — other routes are unaffected.
  app.addHook('onSend', async (request, reply) => {
    if (request.url.startsWith('/api/docs')) {
      reply.header(
        'content-security-policy',
        [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline'",
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data: https:",
          "font-src 'self' data:",
          "worker-src blob:",
          "connect-src *",
        ].join('; '),
      )
    }
  })
}

export default fp(scalarPlugin, { name: 'scalar' })
