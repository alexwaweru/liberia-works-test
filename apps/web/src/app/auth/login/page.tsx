import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Log in' }

// Login routes to either:
//   - Phone OTP flow (individuals)
//   - Email + password flow (employers, MoL)
// The UI detects intent from the "as" query param or lets the user choose.
export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <h1 className="text-2xl font-bold text-center">Log in to Liberia Works</h1>
        {/* TODO: LoginTypeSelector (Individual / Employer or MoL) */}
        {/* TODO: PhoneLoginForm (→ /auth/verify-otp) */}
        {/* TODO: EmailLoginForm (→ dashboard or mol/overview based on role) */}
      </div>
    </div>
  )
}
