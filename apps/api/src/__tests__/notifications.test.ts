import { describe, it, expect, vi } from 'vitest'
import Fastify from 'fastify'
import { SenderRegistry } from '../lib/notifications/registry.js'
import notifyPlugin from '../lib/notifications/plugin.js'
import type { Sender, DeliveryType, Message } from '../lib/notifications/types.js'

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeSender(name: string, supports: DeliveryType[]): Sender & { send: ReturnType<typeof vi.fn> } {
  return {
    name,
    supports,
    send: vi.fn().mockResolvedValue(undefined),
  }
}

// ── SenderRegistry tests ──────────────────────────────────────────────────────

describe('SenderRegistry', () => {
  it('register() maps sender to its supported delivery types', () => {
    const registry = new SenderRegistry()
    const sender = makeSender('test', ['SMS', 'WHATSAPP'])
    registry.register(sender)

    expect(registry.resolve('SMS')).toBe(sender)
    expect(registry.resolve('WHATSAPP')).toBe(sender)
  })

  it('resolve() returns the correct sender for a type', () => {
    const registry = new SenderRegistry()
    const smsSender = makeSender('sms-only', ['SMS'])
    const emailSender = makeSender('email-only', ['EMAIL'])
    registry.register(smsSender)
    registry.register(emailSender)

    expect(registry.resolve('SMS')).toBe(smsSender)
    expect(registry.resolve('EMAIL')).toBe(emailSender)
  })

  it("resolve() throws 'No sender registered for delivery type: X' when none registered", () => {
    const registry = new SenderRegistry()

    expect(() => registry.resolve('SMS')).toThrow('No sender registered for delivery type: SMS')
    expect(() => registry.resolve('EMAIL')).toThrow('No sender registered for delivery type: EMAIL')
    expect(() => registry.resolve('WHATSAPP')).toThrow('No sender registered for delivery type: WHATSAPP')
  })

  it('first-registered wins: registering a second sender for the same type does NOT override the first', () => {
    const registry = new SenderRegistry()
    const first = makeSender('first', ['SMS'])
    const second = makeSender('second', ['SMS'])
    registry.register(first)
    registry.register(second)

    expect(registry.resolve('SMS')).toBe(first)
  })

  it('registerFallback() returns the fallback only for unclaimed types', () => {
    const registry = new SenderRegistry()
    const real = makeSender('real', ['SMS'])
    const fallback = makeSender('fallback', ['SMS', 'WHATSAPP', 'EMAIL'])
    registry.register(real)
    registry.registerFallback(fallback)

    // SMS was already claimed — real sender wins
    expect(registry.resolve('SMS')).toBe(real)
    // WHATSAPP and EMAIL were unclaimed — fallback takes them
    expect(registry.resolve('WHATSAPP')).toBe(fallback)
    expect(registry.resolve('EMAIL')).toBe(fallback)
  })
})

// ── notifyPlugin tests ────────────────────────────────────────────────────────

describe('notifyPlugin', () => {
  it('app.notify("SMS", ...) calls the registered SMS sender', async () => {
    const app = Fastify({ logger: false })
    await app.register(notifyPlugin)

    const smsSender = makeSender('sms', ['SMS'])
    app.senders.register(smsSender)

    const msg: Message = { to: '+231771234567', body: 'test' }
    await app.notify('SMS', msg)

    expect(smsSender.send).toHaveBeenCalledOnce()
    expect(smsSender.send).toHaveBeenCalledWith('SMS', msg)
  })

  it('app.notify("EMAIL", ...) calls the registered EMAIL sender', async () => {
    const app = Fastify({ logger: false })
    await app.register(notifyPlugin)

    const emailSender = makeSender('email', ['EMAIL'])
    app.senders.register(emailSender)

    const msg: Message = { to: 'user@example.com', body: 'hello', subject: 'Test' }
    await app.notify('EMAIL', msg)

    expect(emailSender.send).toHaveBeenCalledOnce()
    expect(emailSender.send).toHaveBeenCalledWith('EMAIL', msg)
  })

  it('app.notify("SMS", ...) throws when no SMS sender registered', async () => {
    const app = Fastify({ logger: false })
    await app.register(notifyPlugin)

    await expect(
      app.notify('SMS', { to: '+231771234567', body: 'test' }),
    ).rejects.toThrow('No sender registered for delivery type: SMS')
  })
})
