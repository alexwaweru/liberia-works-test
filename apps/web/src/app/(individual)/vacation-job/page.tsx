import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Vacation Job Programme' }

export default function VacationJobPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold">Vacation Job Programme</h1>
      {/* TODO: OptInToggle, CurrentCycleInfo, PlacementCard (if matched), ConfirmationFlow */}
    </div>
  )
}
