import { Redis } from 'ioredis'
import { env } from '../../../config/env.js'

const redis = new Redis(env.REDIS_URL)

export interface BotSession {
  step: 'IDLE' | 'REG_NAME' | 'REG_COUNTY' | 'REG_EDUCATION' | 'REG_INTERESTS'
  data: Record<string, any>
  updatedAt: number
}

/**
 * Manages conversation state in Redis with a 30-minute timeout.
 */
export class SessionManager {
  private static PREFIX = 'waba:session:'

  static async get(phone: string): Promise<BotSession | null> {
    const data = await redis.get(this.PREFIX + phone)
    return data ? JSON.parse(data) : null
  }

  static async set(phone: string, session: BotSession): Promise<void> {
    session.updatedAt = Date.now()
    await redis.set(
      this.PREFIX + phone, 
      JSON.stringify(session), 
      'EX', 
      30 * 60 // 30 minutes
    )
  }

  static async delete(phone: string): Promise<void> {
    await redis.del(this.PREFIX + phone)
  }
}
