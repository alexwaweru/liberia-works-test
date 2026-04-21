import { describe, it, expect } from 'vitest'
import Fastify from 'fastify'
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod'
import type { PrismaClient } from '@prisma/client'
import scalarPlugin from '../plugins/scalar.js'
import referenceModule from '../modules/reference/index.js'

const EXPECTED_PATHS = [
  '/reference/sectors',
  '/reference/occupations',
  '/reference/countries',
  '/reference/regions',
  '/reference/sub-regions',
  '/reference/states',
  '/reference/cities',
  '/reference/education-levels',
]

describe('swagger spec generation', () => {
  it('includes all 8 reference routes without throwing', async () => {
    const app = Fastify({ logger: false })
    app.setValidatorCompiler(validatorCompiler)
    app.setSerializerCompiler(serializerCompiler)

    await app.register(scalarPlugin)
    app.decorate('prisma', {} as PrismaClient)
    await app.register(referenceModule, { prefix: '/api/v1/reference' })
    await app.ready()

    const spec = app.swagger()
    const paths = Object.keys(spec.paths ?? {})

    for (const expected of EXPECTED_PATHS) {
      expect(paths, `Expected path "${expected}" to be present`).toContain(expected)
    }
    expect(paths).toHaveLength(EXPECTED_PATHS.length)
  })
})
