import { MessageChannel } from '@prisma/client'

export interface SendMessageOptions {
  to: string
  body: string
  channel: MessageChannel
  templateName?: string
  templateParams?: Record<string, string>
}

export interface SendMessageResult {
  externalMessageId: string
  deliveredAt?: Date
}

/**
 * MessagingProvider defines the contract for sending messages via different vendors.
 * This follows the Strategy Pattern to ensure the system is provider-agnostic.
 */
export interface MessagingProvider {
  readonly name: string
  
  /**
   * Sends a message (SMS or WhatsApp) via the provider.
   * @throws Error if the send fails.
   */
  sendMessage(options: SendMessageOptions): Promise<SendMessageResult>
}
