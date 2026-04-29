import { describe, it, expect, vi } from 'vitest'
import Fastify from 'fastify'
import cookie from '@fastify/cookie'
import jwt from '@fastify/jwt'
import sensible from '@fastify/sensible'
import type { UserRole } from '@liberia-works/shared-types'
import { authenticate, requireRole } from '../plugins/auth.js'

const JWT_SECRET = 'test-secret-at-least-32-chars-long!!'

function buildApp() {
  const app = Fastify({ logger: false })

  app.register(cookie, { secret: JWT_SECRET })
  app.register(jwt, {
    secret: JWT_SECRET,
    cookie: { cookieName: 'access_token', signed: false },
    sign: { expiresIn: '15m' },
  })
  app.register(sensible)

  // Mimic what the auth plugin does
  app.decorateRequest('authUser', null)

  return app
}

function signToken(app: ReturnType<typeof buildApp>, role: UserRole) {
  return app.jwt.sign({ sub: 'user-id-001', role, sessionId: 'session-001' })
}

describe('requireRole preHandler', () => {
  it('returns 403 and does NOT call the route handler when role is wrong', async () => {
    const app = buildApp()
    const handlerSpy = vi.fn().mockResolvedValue({ ok: true })

    app.get('/protected', {
      preHandler: [requireRole(['INDIVIDUAL'])],
    }, handlerSpy)

    await app.ready()

    const token = signToken(app, 'EMPLOYER_ADMIN')

    const res = await app.inject({
      method: 'GET',
      url: '/protected',
      headers: { authorization: `Bearer ${token}` },
    })

    expect(res.statusCode).toBe(403)
    expect(handlerSpy).not.toHaveBeenCalled()
  })

  it('calls the route handler when role matches', async () => {
    const app = buildApp()
    const handlerSpy = vi.fn().mockResolvedValue({ ok: true })

    app.get('/protected', {
      preHandler: [requireRole(['INDIVIDUAL'])],
    }, handlerSpy)

    await app.ready()

    const token = signToken(app, 'INDIVIDUAL')

    const res = await app.inject({
      method: 'GET',
      url: '/protected',
      headers: { authorization: `Bearer ${token}` },
    })

    expect(res.statusCode).toBe(200)
    expect(handlerSpy).toHaveBeenCalledOnce()
  })

  it('returns 401 when no token is provided', async () => {
    const app = buildApp()
    const handlerSpy = vi.fn().mockResolvedValue({ ok: true })

    app.get('/protected', {
      preHandler: [requireRole(['INDIVIDUAL'])],
    }, handlerSpy)

    await app.ready()

    const res = await app.inject({
      method: 'GET',
      url: '/protected',
    })

    expect(res.statusCode).toBe(401)
    expect(handlerSpy).not.toHaveBeenCalled()
  })
})

describe('authenticate preHandler', () => {
  it('returns 401 and does NOT call the route handler when token is missing', async () => {
    const app = buildApp()
    const handlerSpy = vi.fn().mockResolvedValue({ ok: true })

    app.get('/authed', {
      preHandler: [authenticate],
    }, handlerSpy)

    await app.ready()

    const res = await app.inject({
      method: 'GET',
      url: '/authed',
    })

    expect(res.statusCode).toBe(401)
    expect(handlerSpy).not.toHaveBeenCalled()
  })
})
