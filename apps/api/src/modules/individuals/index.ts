import type { FastifyPluginAsync } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { requireRole } from '../../plugins/auth.js'

function formatDate(d: Date | null | undefined): string | null {
  if (!d) return null
  return d instanceof Date ? d.toISOString().split('T')[0]! : String(d)
}

function mapGender(gender: 'male' | 'female' | 'unspecified'): 'MALE' | 'FEMALE' | 'PREFER_NOT_TO_SAY' {
  if (gender === 'male') return 'MALE'
  if (gender === 'female') return 'FEMALE'
  return 'PREFER_NOT_TO_SAY'
}

export const individualsModule: FastifyPluginAsync = async (app) => {
  const server = app.withTypeProvider<ZodTypeProvider>()

  async function getIndividual(userId: string) {
    return app.prisma.individual.findUniqueOrThrow({ where: { userId } })
  }

  async function buildProfile(userId: string) {
    const user = await app.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phoneNumber: true,
        fullName: true,
        dateOfBirth: true,
        gender: true,
        individual: {
          select: {
            id: true,
            userId: true,
            nin: true,
          },
        },
        address: {
          select: {
            id: true,
            countryId: true,
            stateId: true,
            cityId: true,
            addressLine1: true,
            addressLine2: true,
          },
        },
      },
    })

    return {
      id: user.individual!.id,
      userId: user.individual!.userId,
      fullName: user.fullName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      dateOfBirth: formatDate(user.dateOfBirth),
      gender: user.gender as string | null,
      nin: user.individual!.nin,
      address: user.address
        ? {
            id: user.address.id,
            countryId: user.address.countryId,
            stateId: user.address.stateId,
            cityId: user.address.cityId,
            addressLine1: user.address.addressLine1,
            addressLine2: user.address.addressLine2,
          }
        : null,
    }
  }

  // GET /me — combined user + individual + address
  server.get('/me', {
    schema: {
      tags: ['individuals'],
      summary: 'Get current individual profile',
    },
    preHandler: [requireRole(['INDIVIDUAL'])],
  }, async (req) => {
    return buildProfile(req.authUser!.id)
  })

  // PATCH /me — update general profile fields
  server.patch('/me', {
    schema: {
      tags: ['individuals'],
      summary: 'Update current individual profile',
      body: z.object({
        fullName: z.string().optional(),
        dateOfBirth: z.string().optional(),
        gender: z.enum(['male', 'female', 'unspecified']).optional(),
        nin: z.string().optional(),
      }),
    },
    preHandler: [requireRole(['INDIVIDUAL'])],
  }, async (req) => {
    const userId = req.authUser!.id
    const { fullName, dateOfBirth, gender, nin } = req.body

    await app.prisma.user.update({
      where: { id: userId },
      data: {
        ...(fullName !== undefined ? { fullName } : {}),
        ...(dateOfBirth !== undefined ? { dateOfBirth: new Date(dateOfBirth) } : {}),
        ...(gender !== undefined ? { gender: mapGender(gender) } : {}),
      },
    })

    if (nin !== undefined) {
      const individual = await getIndividual(userId)
      await app.prisma.individual.update({
        where: { id: individual.id },
        data: { nin },
      })
    }

    return buildProfile(userId)
  })

  // GET /me/education
  server.get('/me/education', {
    schema: {
      tags: ['individuals'],
      summary: 'List education records',
    },
    preHandler: [requireRole(['INDIVIDUAL'])],
  }, async (req) => {
    const individual = await getIndividual(req.authUser!.id)
    const rows = await app.prisma.individualEducation.findMany({
      where: { individualId: individual.id },
      orderBy: { startDate: 'desc' },
    })
    return rows.map((r) => ({
      id: r.id,
      institutionName: r.institutionName,
      qualification: r.qualification,
      fieldOfStudy: r.fieldOfStudy,
      startDate: formatDate(r.startDate),
      endDate: formatDate(r.endDate),
      isCurrent: r.isCurrent,
    }))
  })

  // POST /me/education
  server.post('/me/education', {
    schema: {
      tags: ['individuals'],
      summary: 'Add education record',
      body: z.object({
        institutionName: z.string(),
        qualification: z.string().optional(),
        fieldOfStudy: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        isCurrent: z.boolean().optional(),
      }),
    },
    preHandler: [requireRole(['INDIVIDUAL'])],
  }, async (req, reply) => {
    const individual = await getIndividual(req.authUser!.id)
    const { institutionName, qualification, fieldOfStudy, startDate, endDate, isCurrent } = req.body
    const record = await app.prisma.individualEducation.create({
      data: {
        individualId: individual.id,
        institutionName,
        qualification: qualification ?? null,
        fieldOfStudy: fieldOfStudy ?? null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        isCurrent: isCurrent ?? false,
        source: 'MANUAL',
      },
    })
    return reply.status(201).send({
      id: record.id,
      institutionName: record.institutionName,
      qualification: record.qualification,
      fieldOfStudy: record.fieldOfStudy,
      startDate: formatDate(record.startDate),
      endDate: formatDate(record.endDate),
      isCurrent: record.isCurrent,
    })
  })

  // DELETE /me/education/:id
  server.delete('/me/education/:id', {
    schema: {
      tags: ['individuals'],
      summary: 'Delete education record',
    },
    preHandler: [requireRole(['INDIVIDUAL'])],
  }, async (req, reply) => {
    const individual = await getIndividual(req.authUser!.id)
    const { id } = req.params as { id: string }
    const record = await app.prisma.individualEducation.findFirst({
      where: { id, individualId: individual.id },
    })
    if (!record) return reply.notFound('Education record not found')
    await app.prisma.individualEducation.delete({ where: { id } })
    return reply.status(204).send()
  })

  // GET /me/work-history
  server.get('/me/work-history', {
    schema: {
      tags: ['individuals'],
      summary: 'List work history records',
    },
    preHandler: [requireRole(['INDIVIDUAL'])],
  }, async (req) => {
    const individual = await getIndividual(req.authUser!.id)
    const rows = await app.prisma.individualWorkHistory.findMany({
      where: { individualId: individual.id },
      orderBy: { startDate: 'desc' },
    })
    return rows.map((r) => ({
      id: r.id,
      employerName: r.employerName,
      title: r.title,
      startDate: formatDate(r.startDate),
      endDate: formatDate(r.endDate),
      isCurrent: r.isCurrent,
      description: r.description,
    }))
  })

  // POST /me/work-history
  server.post('/me/work-history', {
    schema: {
      tags: ['individuals'],
      summary: 'Add work history record',
      body: z.object({
        employerName: z.string(),
        title: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        isCurrent: z.boolean().optional(),
        description: z.string().optional(),
      }),
    },
    preHandler: [requireRole(['INDIVIDUAL'])],
  }, async (req, reply) => {
    const individual = await getIndividual(req.authUser!.id)
    const { employerName, title, startDate, endDate, isCurrent, description } = req.body
    const record = await app.prisma.individualWorkHistory.create({
      data: {
        individualId: individual.id,
        employerName,
        title: title ?? null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        isCurrent: isCurrent ?? false,
        description: description ?? null,
        source: 'MANUAL',
      },
    })
    return reply.status(201).send({
      id: record.id,
      employerName: record.employerName,
      title: record.title,
      startDate: formatDate(record.startDate),
      endDate: formatDate(record.endDate),
      isCurrent: record.isCurrent,
      description: record.description,
    })
  })

  // DELETE /me/work-history/:id
  server.delete('/me/work-history/:id', {
    schema: {
      tags: ['individuals'],
      summary: 'Delete work history record',
    },
    preHandler: [requireRole(['INDIVIDUAL'])],
  }, async (req, reply) => {
    const individual = await getIndividual(req.authUser!.id)
    const { id } = req.params as { id: string }
    const record = await app.prisma.individualWorkHistory.findFirst({
      where: { id, individualId: individual.id },
    })
    if (!record) return reply.notFound('Work history record not found')
    await app.prisma.individualWorkHistory.delete({ where: { id } })
    return reply.status(204).send()
  })

  // PATCH /me/address
  server.patch('/me/address', {
    schema: {
      tags: ['individuals'],
      summary: 'Upsert address',
      body: z.object({
        countryId: z.number().int().optional(),
        stateId: z.number().int().optional(),
        cityId: z.number().int().optional(),
        addressLine1: z.string().optional(),
        addressLine2: z.string().optional(),
      }),
    },
    preHandler: [requireRole(['INDIVIDUAL'])],
  }, async (req, reply) => {
    const userId = req.authUser!.id
    const { countryId, stateId, cityId, addressLine1, addressLine2 } = req.body

    const existing = await app.prisma.address.findUnique({ where: { userId } })

    const data = {
      ...(countryId !== undefined ? { countryId } : {}),
      ...(stateId !== undefined ? { stateId } : {}),
      ...(cityId !== undefined ? { cityId } : {}),
      ...(addressLine1 !== undefined ? { addressLine1 } : {}),
      ...(addressLine2 !== undefined ? { addressLine2 } : {}),
    }

    if (existing) {
      await app.prisma.address.update({ where: { userId }, data })
    } else {
      let resolvedCountryId = countryId
      if (!resolvedCountryId && stateId) {
        const state = await app.prisma.state.findUnique({ where: { id: stateId }, select: { countryId: true } })
        if (!state) return reply.badRequest('Invalid stateId')
        resolvedCountryId = state.countryId
      }
      if (!resolvedCountryId) return reply.badRequest('countryId is required when creating an address')
      await app.prisma.address.create({
        data: { userId, countryId: resolvedCountryId, ...data },
      })
    }

    return reply.status(204).send()
  })
}

export default individualsModule
