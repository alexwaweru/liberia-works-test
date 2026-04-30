import type twilioLib from 'twilio'
import { MessageChannel } from '@prisma/client'
import { MessagingProvider, SendMessageOptions, SendMessageResult } from './types.js'

export interface TwilioProviderConfig {
  accountSid: string
  authToken: string
  fromSms: string
  fromWhatsapp: string
}

export class TwilioProvider implements MessagingProvider {
  readonly name = 'twilio'
  private _client: ReturnType<typeof twilioLib> | null = null

  constructor(private config: TwilioProviderConfig) {}

  private async getClient(): Promise<ReturnType<typeof twilioLib>> {
    if (!this._client) {
      const { default: init } = await import('twilio')
      this._client = init(this.config.accountSid, this.config.authToken)
    }
    return this._client
  }

  async sendMessage(options: SendMessageOptions): Promise<SendMessageResult> {
    const client = await this.getClient()
    const isWhatsApp = options.channel === MessageChannel.WHATSAPP
    
    const from = isWhatsApp 
      ? `whatsapp:${this.config.fromWhatsapp}` 
      : this.config.fromSms
    
    const to = isWhatsApp 
      ? `whatsapp:${options.to}` 
      : options.to

    const response = await client.messages.create({
      from,
      to,
      body: options.body,
    })

    return {
      externalMessageId: response.sid,
    }
  }
}
