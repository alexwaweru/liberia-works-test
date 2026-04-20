import { z } from 'zod'

// ── Shared phone regex ────────────────────────────────────────────────────────
const e164Phone = z
  .string()
  .regex(/^\+[1-9]\d{6,14}$/, 'Must be a valid E.164 phone number (e.g. +231771234567)')

// ── OTP / phone auth (individuals) ───────────────────────────────────────────

export const RequestOtpSchema = z.object({
  phone: e164Phone,
  channel: z.enum(['SMS', 'WHATSAPP']).default('SMS'),
})

export const VerifyOtpSchema = z.object({
  phone: e164Phone,
  otp: z.string().length(6, 'OTP must be exactly 6 digits').regex(/^\d{6}$/),
})

// ── Email + password auth (employers, MoL) ────────────────────────────────────

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

// ── Auth responses ────────────────────────────────────────────────────────────

export const AuthTokenResponseSchema = z.object({
  userId: z.string().uuid(),
  role: z.string(),
  expiresAt: z.string().datetime(),
})

export const MessageResponseSchema = z.object({
  message: z.string(),
})

// ── Register ──────────────────────────────────────────────────────────────────

export const RegisterIndividualSchema = z.object({
  phone: e164Phone,
  fullName: z.string().min(2).max(200),
  channel: z.enum(['SMS', 'WHATSAPP']).default('SMS'),
})

export const RegisterEmployerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(2).max(200),
  companyName: z.string().min(2).max(300),
  lraRegistrationNumber: z.string().min(6).max(50),
})

export type RequestOtp = z.infer<typeof RequestOtpSchema>
export type VerifyOtp = z.infer<typeof VerifyOtpSchema>
export type Login = z.infer<typeof LoginSchema>
export type RegisterIndividual = z.infer<typeof RegisterIndividualSchema>
export type RegisterEmployer = z.infer<typeof RegisterEmployerSchema>
export type AuthTokenResponse = z.infer<typeof AuthTokenResponseSchema>
