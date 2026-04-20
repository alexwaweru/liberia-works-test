import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Verify phone number' }

export default function VerifyOtpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <h1 className="text-2xl font-bold text-center">Enter your verification code</h1>
        {/* TODO: OtpInput (6 digits), auto-submit on complete, resend link (rate-limited) */}
        {/* On success: set JWT cookie (httpOnly via /api route handler), redirect to profile or from param */}
        {/* Rate limits: 5 OTPs/phone/hour, 3 verification attempts per code */}
      </div>
    </div>
  )
}
