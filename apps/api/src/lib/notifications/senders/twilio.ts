import type twilioLib from 'twilio'
import type { Sender, DeliveryType, Message } from '../types.js'

export interface TwilioConfig {
  accountSid: string
  authToken: string
  fromSms: string       // E.164 e.g. +15551234567
  fromWhatsapp: string  // E.164 e.g. +14155238886 (Twilio sandbox/number)
}

export class TwilioSender implements Sender {
  name = 'twilio'
  supports: DeliveryType[] = ['SMS', 'WHATSAPP']

  private config: TwilioConfig
  private _client: ReturnType<typeof twilioLib> | null = null

  constructor(config: TwilioConfig) {
    this.config = config
  }

  private async getClient(): Promise<ReturnType<typeof twilioLib>> {
    if (!this._client) {
      const { default: init } = await import('twilio')
      this._client = init(this.config.accountSid, this.config.authToken)
    }
    return this._client
  }

  async send(type: DeliveryType, message: Message): Promise<void> {
    const client = await this.getClient()
    const isWhatsApp = type === 'WHATSAPP'
    const from = isWhatsApp ? `whatsapp:${this.config.fromWhatsapp}` : this.config.fromSms
    const to = isWhatsApp ? `whatsapp:${message.to}` : message.to
    await client.messages.create({ from, to, body: message.body })
  }
}
