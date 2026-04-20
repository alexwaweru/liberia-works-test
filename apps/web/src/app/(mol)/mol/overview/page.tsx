import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'MoL Overview' }

export default function MolOverviewPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold">Ministry of Labour — Overview</h1>
      {/* TODO: KPI cards (total employers, compliant %, individuals, vacancies, pending permits, overdue disputes) */}
      {/* TODO: ComplianceBreakdownChart, DisputeSLAQueue, RecentActivityFeed */}
    </div>
  )
}
