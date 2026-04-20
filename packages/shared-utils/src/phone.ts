/**
 * Liberian phone number utilities — E.164 format (+231XXXXXXXX)
 * Country code: 231 | Subscriber numbers: 7–8 digits
 */

const LIBERIA_E164 = /^\+231[0-9]{7,8}$/

export function isValidLiberianPhone(phone: string): boolean {
  return LIBERIA_E164.test(phone)
}

/**
 * Normalise a raw phone number to E.164 (+231XXXXXXXX).
 * Handles:
 *  - "0771234567"   → "+231771234567"
 *  - "231771234567" → "+231771234567"
 *  - "+231771234567" → "+231771234567" (no-op)
 */
export function normalisePhone(raw: string): string {
  const digits = raw.replaceAll(/\D/g, '')
  if (digits.startsWith('231')) return `+${digits}`
  if (digits.startsWith('0')) return `+231${digits.slice(1)}`
  return `+231${digits}`
}
