import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Disputes — MoL' }

export default function MolDisputesPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold">Disputes</h1>
      {/* TODO: DisputeQueue sorted by sla_due_at, OverdueBadge, AssignAndRespondPanel */}
    </div>
  )
}
