import fp from 'fastify-plugin'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'
import type { FastifyPluginAsync } from 'fastify'

const swaggerPlugin: FastifyPluginAsync = async (app) => {
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
        { name: 'reference', description: 'Reference data (sectors, occupations, countries, education levels)' },
      ],
    },
  })

  await app.register(swaggerUi, {
    routePrefix: '/api/docs',
    uiConfig: { docExpansion: 'list', deepLinking: false },
  })
}

export default fp(swaggerPlugin, { name: 'swagger' })
