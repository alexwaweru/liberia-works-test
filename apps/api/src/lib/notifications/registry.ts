import type { DeliveryType, Sender } from './types.js'

export class SenderRegistry {
  private map = new Map<DeliveryType, Sender>()

  register(sender: Sender): void {
    for (const type of sender.supports) {
      if (!this.map.has(type)) this.map.set(type, sender)
    }
  }

  // Only registers sender for types not yet claimed — use for dev fallback
  registerFallback(sender: Sender): void {
    for (const type of sender.supports) {
      if (!this.map.has(type)) this.map.set(type, sender)
    }
  }

  resolve(type: DeliveryType): Sender {
    const sender = this.map.get(type)
    if (!sender) throw new Error(`No sender registered for delivery type: ${type}`)
    return sender
  }
}
