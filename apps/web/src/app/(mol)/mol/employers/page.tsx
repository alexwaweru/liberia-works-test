import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Employers — MoL' }

export default function MolEmployersPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold">Employers</h1>
      {/* TODO: EmployerTable with county/sector/compliance filters, export button (triggers audit log) */}
    </div>
  )
}
