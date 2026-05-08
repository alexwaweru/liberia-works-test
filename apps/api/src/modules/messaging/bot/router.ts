import { PrismaClient } from '@prisma/client'
import { SessionManager, BotSession } from './session.js'
import { sendWhatsApp } from '../index.js'

import { env } from '../../../config/env.js'

import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const pool = new pg.Pool({ connectionString: env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

export class BotRouter {
  static async handle(phone: string, text: string) {
    const session = await SessionManager.get(phone)
    const command = text.trim().toUpperCase()

    // 1. Global Commands
    if (command === 'STOP') return this.handleStop(phone)
    if (command === 'JOIN') return this.handleJoin(phone)
    if (command.startsWith('APPLY')) return this.handleApply(phone, command)
    if (command === 'STATUS') return this.handleStatus(phone)
    if (command === 'VACJOB') return this.handleVacJob(phone)

    // 2. Active Session Handling (Multi-step flows)
    if (session) {
      return this.processSession(phone, session, text)
    }

    // 3. Fallback / Welcome
    return this.sendWelcome(phone)
  }

  private static async handleStop(phone: string) {
    await SessionManager.delete(phone)
    // TODO: Mark user as unsubscribed in DB
    await sendWhatsApp({ 
      to: phone, 
      body: "You have been unsubscribed from all non-essential messages. Send JOIN to restart.", 
      prisma 
    })
  }

  private static async handleJoin(phone: string) {
    const session: BotSession = { step: 'REG_NAME', data: {}, updatedAt: Date.now() }
    await SessionManager.set(phone, session)
    await sendWhatsApp({ 
      to: phone, 
      body: "Welcome to LiberiaWorks! Let's get you registered. What is your full name?", 
      prisma 
    })
  }

  private static async handleStatus(phone: string) {
    const user = await prisma.user.findUnique({ 
      where: { phoneNumber: phone },
      include: { individual: { include: { applications: { include: { vacancy: true } } } } }
    })

    if (!user || !user.individual) {
      return sendWhatsApp({ to: phone, body: "No account found. Send JOIN to register.", prisma })
    }

    const apps = user.individual.applications
    if (apps.length === 0) {
      return sendWhatsApp({ to: phone, body: "You haven't applied for any jobs yet.", prisma })
    }

    const report = apps.map(a => `- ${a.vacancy.title}: ${a.status}`).join('\n')
    await sendWhatsApp({ to: phone, body: `Your Application Statuses:\n${report}`, prisma })
  }

  private static async handleApply(phone: string, command: string) {
    const vacancyId = command.replace('APPLY', '').trim()
    if (!vacancyId) {
      return sendWhatsApp({ to: phone, body: "Please provide a Vacancy ID. Example: APPLY 123", prisma })
    }
    // TODO: Implement actual application logic
    await sendWhatsApp({ to: phone, body: `Application for Job ${vacancyId} received! We will notify you of any updates.`, prisma })
  }

  private static async handleVacJob(phone: string) {
    await sendWhatsApp({ to: phone, body: "You have been opted into the Vacation Job Program! We will match you when a cycle opens.", prisma })
  }

  private static async processSession(phone: string, session: BotSession, text: string) {
    switch (session.step) {
      case 'REG_NAME':
        session.data.name = text
        session.step = 'REG_COUNTY'
        await SessionManager.set(phone, session)
        await sendWhatsApp({ to: phone, body: "Thanks! Which county do you live in?", prisma })
        break;
      case 'REG_COUNTY':
        session.data.county = text
        session.step = 'IDLE' // Simplified for now
        await SessionManager.delete(phone)
        await sendWhatsApp({ to: phone, body: "Registration complete! You can now use STATUS or APPLY <ID>.", prisma })
        break;
    }
  }

  private static async sendWelcome(phone: string) {
    await sendWhatsApp({ 
      to: phone, 
      body: "Welcome to LiberiaWorks! Commands:\nJOIN - Register\nSTATUS - Check applications\nAPPLY <ID> - Apply for a job\nSTOP - Unsubscribe", 
      prisma 
    })
  }
}
