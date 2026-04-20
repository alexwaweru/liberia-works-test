/** Liberian phone number: +231 followed by 7–8 digits */
export function isValidLiberianPhone(phone: string): boolean {
  return /^\+231[0-9]{7,8}$/.test(phone)
}

export function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (digits.startsWith('231')) return `+${digits}`
  if (digits.startsWith('0')) return `+231${digits.slice(1)}`
  return `+231${digits}`
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}
