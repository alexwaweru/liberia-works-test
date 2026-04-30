import { MessageChannel } from '@prisma/client'
import { MessagingProvider, SendMessageOptions, SendMessageResult } from './types.js'

export interface AfricasTalkingConfig {
  apiKey: string
  username: string
  senderId?: string
}

export class AfricasTalkingProvider implements MessagingProvider {
  readonly name = 'africastalking'
  private _at: any = null

  constructor(private config: AfricasTalkingConfig) {}

  private async getAt() {
    if (!this._at) {
      // Dynamic import to handle cases where the SDK isn't installed yet during build
      const { default: AfricasTalking } = await import('africastalking')
      this._at = AfricasTalking({
        apiKey: this.config.apiKey,
        username: this.config.username,
      })
    }
    return this._at
  }

  async sendMessage(options: SendMessageOptions): Promise<SendMessageResult> {
    const at = await this.getAt()
    
    if (options.channel === MessageChannel.SMS) {
      const response = await at.SMS.send({
        to: [options.to],
        message: options.body,
        from: this.config.senderId,
      })
      
      const recipient = response.SMSMessageData.Recipients[0]
      if (recipient.status !== 'Success' && recipient.status !== 'Pending') {
        throw new Error(`Africa's Talking SMS failed: ${recipient.status}`)
      }
      
      return {
        externalMessageId: recipient.messageId,
      }
    } else {
      // WhatsApp via Africa's Talking (Meta WABA)
      // Note: AT uses a different internal API or a specific channel for WABA
      // For now, we'll implement the standard pattern expected by AT
      throw new Error("Africa's Talking WhatsApp (WABA) implementation requires specific template approval.")
    }
  }
}
