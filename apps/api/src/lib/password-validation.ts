import bcrypt from 'bcryptjs'
import type { PrismaClient } from '@prisma/client'

// ── Character requirement ─────────────────────────────────────────────────────

interface CharacterRequirement {
  name: string
  pattern: RegExp
  minCount: number
}

function countMatches(password: string, pattern: RegExp): number {
  return (password.match(pattern) ?? []).length
}

// ── ComplexityValidator ───────────────────────────────────────────────────────

interface ComplexityOptions {
  minLength?: number
  minUppercase?: number
  minLowercase?: number
  minNumeric?: number
  minSpecial?: number
}

export class ComplexityValidator {
  private readonly minLength: number
  private readonly requirements: CharacterRequirement[]

  constructor({
    minLength = 12,
    minUppercase = 1,
    minLowercase = 1,
    minNumeric = 1,
    minSpecial = 1,
  }: ComplexityOptions = {}) {
    this.minLength = minLength
    this.requirements = [
      { name: 'uppercase letter', pattern: /[A-Z]/g, minCount: minUppercase },
      { name: 'lowercase letter', pattern: /[a-z]/g, minCount: minLowercase },
      { name: 'number',           pattern: /[0-9]/g, minCount: minNumeric },
      { name: 'special character', pattern: /[^A-Za-z0-9]/g, minCount: minSpecial },
    ]
  }

  // Returns a list of unmet requirement messages; empty means valid.
  validate(password: string): string[] {
    const errors: string[] = []

    if (password.length < this.minLength) {
      const word = this.minLength === 1 ? 'character' : 'characters'
      errors.push(`at least ${this.minLength} ${word}`)
    }

    for (const req of this.requirements) {
      if (countMatches(password, req.pattern) < req.minCount) {
        const word = req.minCount === 1 ? req.name : `${req.name}s`
        errors.push(`at least ${req.minCount} ${word}`)
      }
    }

    return errors
  }

  isValid(password: string): boolean {
    return this.validate(password).length === 0
  }

  helpText(): string {
    const parts = [`at least ${this.minLength} characters`]
    for (const req of this.requirements) {
      const word = req.minCount === 1 ? req.name : `${req.name}s`
      parts.push(`at least ${req.minCount} ${word}`)
    }
    return `Password must contain: ${parts.join('; ')}.`
  }
}

// ── ReusedPasswordValidator ───────────────────────────────────────────────────

export class ReusedPasswordValidator {
  private readonly recordLength: number

  constructor(recordLength = 5) {
    if (recordLength <= 0) throw new Error('recordLength must be greater than 0')
    this.recordLength = recordLength
  }

  // Returns an error message if reused, or null if the password is acceptable.
  async validate(
    password: string,
    userId: string | null,
    prisma: PrismaClient,
  ): Promise<string | null> {
    if (!userId) return null

    const history = await prisma.passwordHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: this.recordLength,
      select: { passwordHash: true },
    })

    for (const record of history) {
      if (await bcrypt.compare(password, record.passwordHash)) {
        return `Password cannot be the same as any of your last ${this.recordLength} passwords`
      }
    }

    return null
  }

  helpText(): string {
    return `Password cannot be the same as any of your last ${this.recordLength} passwords.`
  }
}

// ── Default instances ─────────────────────────────────────────────────────────

export const complexityValidator = new ComplexityValidator()
export const reusedPasswordValidator = new ReusedPasswordValidator()
