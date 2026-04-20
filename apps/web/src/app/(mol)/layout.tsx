// MoL portal layout — requires MOL_OFFICER or MOL_DIRECTOR (enforced by middleware.ts)
// Phase 1: read-only. Phase 2: data corrections + certificate issuance.
export default function MolLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      {/* TODO: MolSidebar — Overview, Employers, Individuals, Vacancies, Work Permits, Disputes */}
      <main className="flex-1 p-6">{children}</main>
    </div>
  )
}
