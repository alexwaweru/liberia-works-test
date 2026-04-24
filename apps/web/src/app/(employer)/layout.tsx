import { EmployerSidebar } from '@/components/domain/employer/sidebar'
import { EmployerHeader } from '@/components/domain/employer/header'

export default function EmployerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <EmployerSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <EmployerHeader />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
