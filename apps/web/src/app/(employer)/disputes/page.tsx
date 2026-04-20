import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Disputes' }

export default function DisputesPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold">Disputes</h1>
      {/* TODO: DisputeList, NewDisputeButton, SLABadge */}
    </div>
  )
}
