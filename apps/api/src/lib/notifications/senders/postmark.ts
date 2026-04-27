import type * as postmarkLib from 'postmark'
import type { Sender, DeliveryType, Message } from '../types.js'

export interface PostmarkConfig {
  apiToken: string
  from: string  // e.g. noreply@quola.lr
}

export class PostmarkSender implements Sender {
  name = 'postmark'
  supports: DeliveryType[] = ['EMAIL']

  private config: PostmarkConfig
  private _client: postmarkLib.ServerClient | null = null

  constructor(config: PostmarkConfig) {
    this.config = config
  }

  private async getClient(): Promise<postmarkLib.ServerClient> {
    if (!this._client) {
      const postmark = await import('postmark')
      this._client = new postmark.ServerClient(this.config.apiToken)
    }
    return this._client
  }

  async send(_type: DeliveryType, message: Message): Promise<void> {
    const client = await this.getClient()
    await client.sendEmail({
      From: message.from ?? this.config.from,
      To: message.to,
      Subject: message.subject ?? '(no subject)',
      TextBody: message.body,
    })
  }
}
