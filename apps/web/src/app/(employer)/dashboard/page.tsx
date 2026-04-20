import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Employer Dashboard' }

export default function EmployerDashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      {/* TODO: ComplianceStatusWidget, VacancyStats, RecentApplications, WorkPermitSummary */}
    </div>
  )
}
