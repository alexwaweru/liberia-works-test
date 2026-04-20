/**
 * LRA (Liberia Revenue Authority) registration number utilities.
 *
 * Phase 1: format validation only. Live registry check deferred to Phase 2
 * pending confirmation from MoL on §8 open question 2.
 *
 * Expected format: alphanumeric, 6–20 characters, uppercase.
 * Exact regex to be confirmed with LRA once format specification is shared.
 */

const LRA_FORMAT = /^[A-Z0-9]{6,20}$/

export function isValidLraNumber(lra: string): boolean {
  return LRA_FORMAT.test(lra.toUpperCase())
}

export function normaliseLraNumber(lra: string): string {
  return lra.trim().toUpperCase()
}
