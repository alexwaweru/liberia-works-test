import type { Sender, DeliveryType, Message } from '../types.js'

export class ConsoleSender implements Sender {
  name = 'console'
  constructor(public supports: DeliveryType[] = ['SMS', 'WHATSAPP', 'EMAIL']) {}

  async send(type: DeliveryType, message: Message): Promise<void> {
    // In production this should never run — it means a real sender wasn't configured
    process.stdout.write(`[notify:${type}] to=${message.to} body=${message.body}\n`)
  }
}
