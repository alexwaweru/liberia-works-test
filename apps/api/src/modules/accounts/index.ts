import type { FastifyPluginAsync } from 'fastify'

/**
 * Accounts module — users, OTP codes, sessions, RBAC.
 *
 * Endpoints:
 *   POST /api/v1/auth/register/individual
 *   POST /api/v1/auth/register/employer
 *   POST /api/v1/auth/otp/request
 *   POST /api/v1/auth/otp/verify
 *   POST /api/v1/auth/login
 *   POST /api/v1/auth/refresh
 *   POST /api/v1/auth/logout
 *   GET  /api/v1/auth/me
 */
export const accountsModule: FastifyPluginAsync = async (_app) => {
  // TODO: implement in Sprint 0, step 4 (Accounts module)
}

export default accountsModule
