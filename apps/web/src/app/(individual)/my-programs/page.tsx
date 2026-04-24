import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Programs' }

export default function ProgramsPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold">Programs</h1>
      {/* TODO: OptInToggle, CurrentCycleInfo, PlacementCard (if matched), ConfirmationFlow */}
    </div>
  )
}
