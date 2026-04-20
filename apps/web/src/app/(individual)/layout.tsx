// Individual portal layout — requires INDIVIDUAL role (enforced by middleware.ts)
export default function IndividualLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      {/* TODO: IndividualSidebar — Profile, Documents, Applications, Vacation Job */}
      <main className="flex-1 p-6">{children}</main>
    </div>
  )
}
