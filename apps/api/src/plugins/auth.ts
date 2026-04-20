import fp from 'fastify-plugin'
import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify'
import type { UserRole } from '@liberia-works/shared-types'

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: {
      sub: string       // user id
      role: UserRole
      sessionId: string
    }
    user: {
      sub: string
      role: UserRole
      sessionId: string
    }
  }
}

// Augment request so downstream code can do request.authUser.id
declare module 'fastify' {
  interface FastifyRequest {
    authUser: { id: string; role: UserRole; sessionId: string } | null
  }
}

const authPlugin: FastifyPluginAsync = async (app) => {
  app.decorateRequest('authUser', null)
}

/**
 * preHandler — verifies JWT and populates request.authUser.
 * Usage: preHandler: [authenticate]
 */
export async function authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  try {
    await request.jwtVerify()
    const { sub, role, sessionId } = request.user
    request.authUser = { id: sub, role, sessionId }
  } catch {
    reply.unauthorized('Invalid or expired token')
  }
}

/**
 * preHandler factory — verifies JWT then enforces allowed roles.
 * Usage: preHandler: [requireRole(['MOL_OFFICER', 'MOL_DIRECTOR'])]
 */
export function requireRole(roles: UserRole[]) {
  return async function (request: FastifyRequest, reply: FastifyReply): Promise<void> {
    await authenticate(request, reply)
    if (reply.sent) return
    const user = request.authUser
    if (!user || !roles.includes(user.role)) {
      reply.forbidden(`Requires one of: ${roles.join(', ')}`)
    }
  }
}

export default fp(authPlugin, { name: 'auth' })
