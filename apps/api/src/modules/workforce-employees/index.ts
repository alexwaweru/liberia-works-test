import type { FastifyPluginAsync, FastifyReply } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import {
  CreateWorkforceEmployeeSchema,
  UpdateWorkforceEmployeeSchema,
  WorkforceEmployeeResponseSchema,
  WorkforceEmployeeListResponseSchema,
  WorkforceEmployeeListFilterSchema,
  MessageResponseSchema,
} from '@liberia-works/shared-schemas'
import { EMPLOYER_ROLES } from '@liberia-works/shared-types'
import { requireRole } from '../../plugins/auth.js'
import { encodeCursor, decodeCursor } from '../../lib/cursor.js'
import type { WorkforceEmployee } from '@prisma/client'

type WFEGender = 'MALE' | 'FEMALE' | 'PREFER_NOT_TO_SAY'
type WFEEmploymentType = 'PERMANENT' | 'CONTRACT' | 'CASUAL' | 'INTERN'

function formatEmployee(e: WorkforceEmployee) {
  return {
    id: e.id,
    employerId: e.employerId,
    fullName: e.fullName,
    gender: (e.gender ?? null) as WFEGender | null,
    nationality: e.nationality,
    position: e.position,
    department: e.department,
    employmentType: e.employmentType as WFEEmploymentType,
    hireDate: e.hireDate instanceof Date ? e.hireDate.toISOString().split('T')[0]! : String(e.hireDate),
    terminationDate: e.terminationDate
      ? e.terminationDate instanceof Date
        ? e.terminationDate.toISOString().split('T')[0]!
        : String(e.terminationDate)
      : null,
    email: e.email ?? null,
    phone: e.phone ?? null,
    // Decimal serialised as string to avoid JS float precision loss
    salary: e.salary != null ? e.salary.toString() : null,
    isActive: e.isActive,
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
  }
}

async function getEmployerId(
  app: Parameters<FastifyPluginAsync>[0],
  userId: string,
  reply: FastifyReply,
): Promise<string | null> {
  const eu = await app.prisma.employerUser.findFirst({
    where: { userId, isActive: true },
    select: { employerId: true },
  })
  if (!eu) {
    reply.notFound('No employer found for this user')
    return null
  }
  return eu.employerId
}

export const workforceEmployeesModule: FastifyPluginAsync = async (app) => {
  const server = app.withTypeProvider<ZodTypeProvider>()

  // GET /workforce-employees — cursor-paginated list with filters
  server.get('/', {
    schema: {
      tags: ['workforce-employees'],
      summary: 'List workforce employees',
      querystring: WorkforceEmployeeListFilterSchema,
      response: { 200: WorkforceEmployeeListResponseSchema },
    },
    preHandler: [requireRole(EMPLOYER_ROLES)],
  }, async (req, reply) => {
    const employerId = await getEmployerId(app, req.authUser!.id, reply)
    if (!employerId) return

    const { cursor, search, isActive, employmentType, department } = req.query
    const PAGE_SIZE = 20

    const where = {
      employerId,
      ...(isActive !== undefined ? { isActive: isActive === 'true' } : {}),
      ...(employmentType ? { employmentType } : {}),
      ...(department ? { department: { contains: department, mode: 'insensitive' as const } } : {}),
      ...(search ? { fullName: { contains: search, mode: 'insensitive' as const } } : {}),
    }

    const decodedCursor = cursor ? decodeCursor(cursor) : undefined

    const [total, rows] = await Promise.all([
      app.prisma.workforceEmployee.count({ where }),
      app.prisma.workforceEmployee.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        ...(decodedCursor ? { cursor: { id: decodedCursor }, skip: 1 } : {}),
        take: PAGE_SIZE + 1,
      }),
    ])

    const hasMore = rows.length > PAGE_SIZE
    const data = hasMore ? rows.slice(0, PAGE_SIZE) : rows
    const nextCursor = hasMore ? encodeCursor(data[data.length - 1]!.id) : null

    return { data: data.map(formatEmployee), pagination: { nextCursor, hasMore, total } }
  })

  // GET /workforce-employees/:id
  server.get('/:id', {
    schema: {
      tags: ['workforce-employees'],
      summary: 'Get a workforce employee by ID',
      response: { 200: WorkforceEmployeeResponseSchema },
    },
    preHandler: [requireRole(EMPLOYER_ROLES)],
  }, async (req, reply) => {
    const employerId = await getEmployerId(app, req.authUser!.id, reply)
    if (!employerId) return

    const { id } = req.params as { id: string }
    const employee = await app.prisma.workforceEmployee.findFirst({
      where: { id, employerId },
    })
    if (!employee) return reply.notFound('Workforce employee not found')
    return formatEmployee(employee)
  })

  // POST /workforce-employees
  server.post('/', {
    schema: {
      tags: ['workforce-employees'],
      summary: 'Create a workforce employee record',
      body: CreateWorkforceEmployeeSchema,
      response: { 201: WorkforceEmployeeResponseSchema },
    },
    preHandler: [requireRole(EMPLOYER_ROLES)],
  }, async (req, reply) => {
    const employerId = await getEmployerId(app, req.authUser!.id, reply)
    if (!employerId) return

    const b = req.body
    const created = await app.prisma.workforceEmployee.create({
      data: {
        employerId,
        fullName: b.fullName,
        nationality: b.nationality,
        position: b.position,
        department: b.department ?? null,
        employmentType: b.employmentType,
        hireDate: new Date(b.hireDate),
        ...(b.gender !== undefined ? { gender: b.gender } : {}),
        ...(b.terminationDate !== undefined ? { terminationDate: new Date(b.terminationDate) } : {}),
        ...(b.email !== undefined ? { email: b.email } : {}),
        ...(b.phone !== undefined ? { phone: b.phone } : {}),
        ...(b.salary !== undefined ? { salary: b.salary } : {}),
      },
    })
    return reply.status(201).send(formatEmployee(created))
  })

  // PATCH /workforce-employees/:id
  server.patch('/:id', {
    schema: {
      tags: ['workforce-employees'],
      summary: 'Update a workforce employee record',
      body: UpdateWorkforceEmployeeSchema,
      response: { 200: WorkforceEmployeeResponseSchema },
    },
    preHandler: [requireRole(EMPLOYER_ROLES)],
  }, async (req, reply) => {
    const employerId = await getEmployerId(app, req.authUser!.id, reply)
    if (!employerId) return

    const { id } = req.params as { id: string }
    const existing = await app.prisma.workforceEmployee.findFirst({
      where: { id, employerId },
    })
    if (!existing) return reply.notFound('Workforce employee not found')

    const b = req.body
    const updated = await app.prisma.workforceEmployee.update({
      where: { id },
      data: {
        ...(b.fullName !== undefined ? { fullName: b.fullName } : {}),
        ...(b.nationality !== undefined ? { nationality: b.nationality } : {}),
        ...(b.position !== undefined ? { position: b.position } : {}),
        ...(b.department !== undefined ? { department: b.department } : {}),
        ...(b.employmentType !== undefined ? { employmentType: b.employmentType } : {}),
        ...(b.hireDate !== undefined ? { hireDate: new Date(b.hireDate) } : {}),
        ...(b.gender !== undefined ? { gender: b.gender } : {}),
        ...(b.terminationDate !== undefined ? { terminationDate: new Date(b.terminationDate) } : {}),
        ...(b.email !== undefined ? { email: b.email } : {}),
        ...(b.phone !== undefined ? { phone: b.phone } : {}),
        ...(b.salary !== undefined ? { salary: b.salary } : {}),
      },
    })
    return formatEmployee(updated)
  })

  // DELETE /workforce-employees/:id — soft delete
  server.delete('/:id', {
    schema: {
      tags: ['workforce-employees'],
      summary: 'Soft-delete a workforce employee record',
      response: { 200: MessageResponseSchema },
    },
    preHandler: [requireRole(EMPLOYER_ROLES)],
  }, async (req, reply) => {
    const employerId = await getEmployerId(app, req.authUser!.id, reply)
    if (!employerId) return

    const { id } = req.params as { id: string }
    const existing = await app.prisma.workforceEmployee.findFirst({
      where: { id, employerId },
    })
    if (!existing) return reply.notFound('Workforce employee not found')

    await app.prisma.workforceEmployee.update({
      where: { id },
      data: { isActive: false },
    })
    return { message: 'Employee deactivated' }
  })
}

export default workforceEmployeesModule
