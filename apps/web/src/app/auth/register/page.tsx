import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Create account' }

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <h1 className="text-2xl font-bold text-center">Create your account</h1>
        {/* TODO: RegistrationTypeSelector (Individual / Employer) */}
        {/* TODO: IndividualRegistrationForm — phone + full name → OTP verification */}
        {/* TODO: EmployerRegistrationForm — email + password + company details + LRA number */}
        {/* Individual CV upload offered after registration (optional, triggers async parse) */}
      </div>
    </div>
  )
}
