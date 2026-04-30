import crypto from 'crypto'

/**
 * Utility for verifying webhook signatures from providers.
 */
export class WebhookSecurity {
  /**
   * Verifies an HMAC signature from Africa's Talking.
   * Note: AT typically uses an API Key or a pre-shared secret in the header.
   */
  static verifyAfricasTalking(signature: string, secret: string, payload: string): boolean {
    const expected = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex')
    return signature === expected
  }

  /**
   * Verifies the X-Hub-Signature-256 header from Meta (WABA).
   */
  static verifyMetaSignature(signature: string, secret: string, payload: string): boolean {
    if (!signature.startsWith('sha256=')) return false
    
    const sig = signature.replace('sha256=', '')
    const expected = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex')
    
    return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
  }
}
