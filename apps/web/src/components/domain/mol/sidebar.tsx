'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Building2Icon,
  LayersIcon,
  FileCheckIcon,
  ScaleIcon,
  MoreHorizontalIcon,
  LogOutIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useCurrentUser } from '@/hooks/auth'
import { logoutAction } from '@/app/auth/logout/actions'
import { Logo } from '@/components/ui/logo'

const TOP_NAV = [
  { href: '/mol/employers',     label: 'Employers',     icon: Building2Icon },
  { href: '/mol/programs',      label: 'Programs',      icon: LayersIcon },
]

const BOTTOM_NAV = [
  { href: '/mol/work-permits',  label: 'Work Permits',  icon: FileCheckIcon },
  { href: '/mol/disputes',      label: 'Disputes',      icon: ScaleIcon },
]

function NavItem({ href, label, icon: Icon }: { href: string; label: string; icon: React.ElementType }) {
  const pathname = usePathname()
  const active = pathname === href || pathname.startsWith(href + '/')

  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors',
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

export function MolSidebar() {
  const { data: user } = useCurrentUser()

  const initials = user?.fullName
    ? user.fullName.split(' ').map((p: string) => p[0]).join('').slice(0, 2).toUpperCase()
    : 'ML'

  const displayName = user?.fullName ?? 'MoL Admin'
  const subtitle = user?.email ?? ''

  const roleLabel =
    user?.role === 'MOL_DIRECTOR' ? 'MoL Director'
    : 'MoL Officer'

  return (
    <aside className="flex h-screen w-56 shrink-0 flex-col border-r border-border bg-sidebar-background">
      <div className="flex h-14 items-center px-4 border-b border-border">
        <Logo />
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
        {TOP_NAV.map((item) => (
          <NavItem key={item.href} {...item} />
        ))}
        <Separator className="my-3" />
        {BOTTOM_NAV.map((item) => (
          <NavItem key={item.href} {...item} />
        ))}
      </nav>

      <div className="border-t border-border p-3">
        <Popover>
          <PopoverTrigger asChild>
            <button
              aria-label={`${displayName}, ${roleLabel}, open user menu`}
              className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-sidebar-accent/50 transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
            >
              <Avatar className="size-7 shrink-0">
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">{displayName}</p>
                <p className="text-[11px] text-foreground/70 truncate">{subtitle}</p>
              </div>
              <MoreHorizontalIcon className="size-4 shrink-0 text-foreground/50" />
            </button>
          </PopoverTrigger>
          <PopoverContent side="top" align="start" className="w-72 p-0 overflow-hidden">
            <div className="flex items-center gap-3 p-4">
              <Avatar className="size-10 shrink-0">
                <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">{initials}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{displayName}</p>
                <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
                <p className="text-xs text-muted-foreground">{roleLabel}</p>
              </div>
            </div>
            <Separator />
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
  )
}
