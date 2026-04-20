// Employer portal layout — requires EMPLOYER_ADMIN or EMPLOYER_HR (enforced by middleware.ts)
export default function EmployerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      {/* TODO: EmployerSidebar — Dashboard, Vacancies, Applicants, Work Permits, Disputes, Compliance */}
      <main className="flex-1 p-6">{children}</main>
    </div>
  )
}
