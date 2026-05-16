'use client'

import { usePathname } from 'next/navigation'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { useCurrentEmployer } from '@/hooks/employer'

const TITLES: Record<string, string> = {
  '/dashboard':    'Dashboard',
  '/vacancies':    'Vacancies',
  '/host-programs': 'Programs',
  '/work-permits': 'Work Permits',
  '/disputes':     'Disputes',
  '/employees':    'Employees',
  '/settings':     'Settings',
  '/reports':      'Reports',
}

function getTitle(pathname: string): string {
  const match = Object.keys(TITLES)
    .sort((a, b) => b.length - a.length)
    .find((prefix) => pathname === prefix || pathname.startsWith(prefix + '/'))
  return match ? TITLES[match] : 'Dashboard'
}

export function EmployerHeader() {
  const pathname = usePathname()
  const { data: employer } = useCurrentEmployer()
  const pageTitle = getTitle(pathname)

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-background px-6">
      <div className="flex items-center gap-2 text-sm">
        {employer && (
          <>
            <span className="font-medium text-foreground">{employer.companyName}</span>
            <span className="text-muted-foreground">/</span>
          </>
        )}
        <span className={employer ? 'text-muted-foreground' : 'font-medium text-foreground'}>
          {pageTitle}
        </span>
      </div>
      <ThemeToggle />
    </header>
  )
}
