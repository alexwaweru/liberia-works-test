'use client'

import { usePathname } from 'next/navigation'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { useCurrentUser } from '@/hooks/auth'

const SEGMENT_LABELS: Record<string, string> = {
  jobs:         'Jobs',
  applications: 'Applications',
  programs:     'Programs',
  profile:      'Profile',
  general:      'General Information',
  education:    'Education',
  experience:   'Work Experience',
  preferences:  'Job Preferences',
  security:     'Security',
  address:      'Address',
  documents:    'Documents',
}

function getBreadcrumbs(pathname: string): string[] {
  // Strip the /me prefix and split into segments
  const segments = pathname.replace(/^\/me\/?/, '').split('/').filter(Boolean)
  return segments.map((s) => SEGMENT_LABELS[s] ?? s)
}

export function IndividualHeader() {
  const pathname = usePathname()
  const { data: user } = useCurrentUser()
  const crumbs = getBreadcrumbs(pathname)

  const parts = [
    ...(user?.fullName ? [user.fullName] : []),
    ...crumbs,
  ]

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-background px-6">
      <div className="flex items-center gap-2 text-sm">
        {parts.map((part, i) => (
          <span key={i} className="flex items-center gap-2">
            {i > 0 && <span className="text-muted-foreground">/</span>}
            <span className={i === parts.length - 1 ? 'font-medium text-foreground' : 'text-muted-foreground'}>
              {part}
            </span>
          </span>
        ))}
      </div>
      <ThemeToggle />
    </header>
  )
}
