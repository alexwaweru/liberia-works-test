import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Work Permits — MoL' }

export default function MolWorkPermitsPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold">Work Permit Applications</h1>
      {/* TODO: PermitTable, ReviewPanel (approve/reject/request-info), StatusHistory */}
    </div>
  )
}
