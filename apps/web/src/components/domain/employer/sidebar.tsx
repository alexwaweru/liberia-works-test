'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BriefcaseIcon,
  FileCheckIcon,
  ScaleIcon,
  UsersIcon,
  Settings2Icon,
  BarChart2Icon,
  ChevronDownIcon,
  SearchIcon,
  MoreHorizontalIcon,
  KeyboardIcon,
  LogOutIcon,
  LayersIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useCurrentUser } from '@/hooks/auth'
import { logoutAction } from '@/app/auth/logout/actions'
import { CommandPalette } from './command-palette'
import { Logo } from '@/components/ui/logo'

const TOP_NAV = [
  { href: '/vacancies',    label: 'Vacancies',    icon: BriefcaseIcon },
  { href: '/host-programs', label: 'Programs',    icon: LayersIcon },
  { href: '/work-permits', label: 'Work Permits',  icon: FileCheckIcon },
  { href: '/disputes',     label: 'Disputes',      icon: ScaleIcon },
]

const COMPANY_NAV = [
  { href: '/employees', label: 'Employees', icon: UsersIcon },
  { href: '/settings',  label: 'Settings',  icon: Settings2Icon },
  { href: '/reports',   label: 'Reports',   icon: BarChart2Icon },
]

function NavItem({
  href,
  label,
  icon: Icon,
  indent = false,
}: {
  href: string
  label: string
  icon: React.ElementType
  indent?: boolean
}) {
  const pathname = usePathname()
  const active = pathname === href || pathname.startsWith(href + '/')

  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors',
        indent && 'ml-4',
        active
          ? 'border-l-2 border-primary bg-primary/5 text-primary font-medium'
          : 'text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground',
      )}
    >
      <Icon className={cn('size-4 shrink-0', active ? 'text-primary' : 'text-sidebar-muted')} />
      {label}
    </Link>
  )
}

export function EmployerSidebar() {
  const [companyOpen, setCompanyOpen] = useState(true)
  const [commandOpen, setCommandOpen] = useState(false)
  const { data: user } = useCurrentUser()

  const initials = user?.fullName
    ? user.fullName
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'EM'

  const displayName = user?.fullName
    ? user.fullName
    : 'Employer'

  const roleLabel =
    user?.role === 'EMPLOYER_ADMIN' ? 'Admin'
    : user?.role === 'EMPLOYER_HR'  ? 'HR'
    : 'Member'

  return (
    <>
    <aside className="flex h-screen w-56 shrink-0 flex-col border-r border-border bg-sidebar-background">
      {/* Brand */}
      <div className="flex h-14 items-center px-4 border-b border-border">
        <Logo />
      </div>

      {/* Search */}
      <div className="px-3 pt-4 pb-2">
        <button
          onClick={() => setCommandOpen(true)}
          className="flex w-full items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 hover:bg-muted/50 transition-colors"
        >
          <SearchIcon className="size-3.5 shrink-0 text-muted-foreground" />
          <span className="flex-1 text-left text-xs text-muted-foreground">Search…</span>
          <kbd className="text-[10px] text-muted-foreground bg-muted border border-border rounded px-1 py-0.5">⌘K</kbd>
        </button>
      </div>

      {/* Top nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
        {TOP_NAV.map((item) => (
          <NavItem key={item.href} {...item} />
        ))}

        <Separator className="my-3" />

        {/* Company section */}
        <Collapsible open={companyOpen} onOpenChange={setCompanyOpen}>
          <CollapsibleTrigger className="flex w-full items-center justify-between px-3 py-1 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-sidebar-muted">
              Company
            </span>
            <ChevronDownIcon
              className={cn(
                'size-3.5 text-sidebar-muted transition-transform duration-200',
                companyOpen ? 'rotate-0' : '-rotate-90',
              )}
            />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-0.5">
            {COMPANY_NAV.map((item) => (
              <NavItem key={item.href} {...item} indent />
            ))}
          </CollapsibleContent>
        </Collapsible>
      </nav>

      {/* User */}
      <div className="border-t border-border p-3">
        <Popover>
          <PopoverTrigger asChild>
            <button
              aria-label={`${displayName}, ${roleLabel}, open user menu`}
              className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-muted/60 transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
            >
              <Avatar className="size-7 shrink-0">
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">
                  {user?.email ?? 'Employer'}
                </p>
                <p className="text-[11px] text-foreground/70">{roleLabel}</p>
              </div>
              <MoreHorizontalIcon className="size-4 shrink-0 text-foreground/50" />
            </button>
          </PopoverTrigger>

          <PopoverContent side="top" align="start" className="w-72 p-0 overflow-hidden">
            {/* User info */}
            <div className="flex items-center gap-3 p-4">
              <Avatar className="size-10 shrink-0">
                <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{displayName}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email ?? ''}</p>
              </div>
            </div>

            <Separator />

            {/* Menu items */}
            <div className="p-1.5 space-y-0.5">
              <button className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors">
                <Settings2Icon className="size-4 text-muted-foreground" />
                Account Settings
              </button>
              <button
                onClick={() => setCommandOpen(true)}
                className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
              >
                <KeyboardIcon className="size-4 text-muted-foreground" />
                Keyboard Shortcuts
              </button>
            </div>

            <Separator />

            {/* Sign out */}
            <div className="p-1.5">
              <button
                onClick={() => logoutAction()}
                className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-primary hover:bg-primary/5 transition-colors"
              >
                <LogOutIcon className="size-4" />
                Sign Out
              </button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </aside>

    <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
    </>
  )
}
