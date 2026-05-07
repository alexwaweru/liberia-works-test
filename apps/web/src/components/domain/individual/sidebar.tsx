'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import {
  BriefcaseIcon,
  FileTextIcon,
  LayersIcon,
  UserIcon,
  UserCircleIcon,
  GraduationCapIcon,
  SlidersIcon,
  ShieldIcon,
  MapPinIcon,
  ChevronDownIcon,
  MoreHorizontalIcon,
  LogOutIcon,
  CheckCircle2Icon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useCurrentUser } from '@/hooks/auth'
import { logoutAction } from '@/app/auth/logout/actions'
import { Logo } from '@/components/ui/logo'
import { useState, Suspense } from 'react'

const TOP_NAV = [
  { href: '/me/jobs',         label: 'Jobs',         icon: BriefcaseIcon },
  { href: '/me/applications', label: 'Applications', icon: FileTextIcon },
  { href: '/me/programs',     label: 'Programs',     icon: LayersIcon },
  { href: '/me/opt-ins',      label: 'My Opt-Ins',   icon: CheckCircle2Icon },
]

const PROFILE_TABS = [
  { tab: 'general',     label: 'General',     icon: UserCircleIcon },
  { tab: 'education',   label: 'Education',   icon: GraduationCapIcon },
  { tab: 'experience',  label: 'Experience',  icon: BriefcaseIcon },
  { tab: 'preferences', label: 'Preferences', icon: SlidersIcon },
  { tab: 'security',    label: 'Security',    icon: ShieldIcon },
  { tab: 'address',     label: 'Address',     icon: MapPinIcon },
  { tab: 'documents',   label: 'Documents',   icon: FileTextIcon },
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

function ProfileTabItem({ tab, label, icon: Icon }: { tab: string; label: string; icon: React.ElementType }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentTab = searchParams.get('tab') ?? 'general'
  const active = pathname === '/me/profile' && currentTab === tab

  return (
    <Link
      href={`/me/profile?tab=${tab}`}
      className={cn(
        'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ml-4',
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

function ProfileNav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(pathname === '/me/profile' || pathname.startsWith('/me/profile/'))
  const profileActive = pathname === '/me/profile' || pathname.startsWith('/me/profile/')

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger
        className={cn(
          'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors',
          profileActive
            ? 'border-l-2 border-primary bg-primary/5 text-primary font-medium'
            : 'text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground',
        )}
      >
        <UserIcon className={cn('size-4 shrink-0', profileActive ? 'text-primary' : 'text-sidebar-muted')} />
        <span className="flex-1 text-left">Profile</span>
        <ChevronDownIcon
          className={cn(
            'size-3.5 transition-transform duration-200',
            profileActive ? 'text-primary' : 'text-sidebar-muted',
            open ? 'rotate-0' : '-rotate-90',
          )}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-0.5 mt-0.5">
        <Suspense>
          {PROFILE_TABS.map((item) => (
            <ProfileTabItem key={item.tab} {...item} />
          ))}
        </Suspense>
      </CollapsibleContent>
    </Collapsible>
  )
}

export function IndividualSidebar() {
  const { data: user } = useCurrentUser()

  const initials = user?.fullName
    ? user.fullName.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase()
    : 'JS'

  const displayName = user?.fullName ?? 'Job Seeker'
  const subtitle = user?.phoneNumber ?? user?.email ?? ''

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
        <ProfileNav />
      </nav>

      <div className="border-t border-border p-3">
        <Popover>
          <PopoverTrigger asChild>
            <button className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-sidebar-accent/50 transition-colors text-left">
              <Avatar className="size-7 shrink-0">
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-sidebar-foreground truncate">{displayName}</p>
                <p className="text-[11px] text-sidebar-muted truncate">{subtitle}</p>
              </div>
              <MoreHorizontalIcon className="size-4 shrink-0 text-sidebar-muted" />
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
                <p className="text-xs text-muted-foreground">Job Seeker</p>
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
