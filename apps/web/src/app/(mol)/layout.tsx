// MoL portal layout — requires MOL_OFFICER or MOL_DIRECTOR (enforced by middleware.ts)
import { MolSidebar } from '@/components/domain/mol/sidebar'

export default function MolLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <MolSidebar />
      <main className="flex-1 overflow-y-auto p-6 md:p-8">{children}</main>
    </div>
  )
}
