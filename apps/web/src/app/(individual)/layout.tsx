import { IndividualSidebar } from '@/components/domain/individual/sidebar'
import { IndividualHeader } from '@/components/domain/individual/header'

export default function IndividualLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <IndividualSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <IndividualHeader />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
