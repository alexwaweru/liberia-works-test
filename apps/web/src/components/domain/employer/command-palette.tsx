'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  FileCheckIcon,
  BriefcaseIcon,
  ScaleIcon,
  BarChart2Icon,
  UsersIcon,
  UserPlusIcon,
  Settings2Icon,
} from 'lucide-react'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'

const ACTIONS = [
  { label: 'File for work permit',    icon: FileCheckIcon,  href: '/work-permits' },
  { label: 'Create vacancy',          icon: BriefcaseIcon,  href: '/vacancies' },
  { label: 'Raise a dispute',         icon: ScaleIcon,      href: '/disputes' },
  { label: 'Add report',              icon: BarChart2Icon,  href: '/reports' },
]

const COMPANY_ACTIONS = [
  { label: 'Invite team member',       icon: UserPlusIcon,   href: '/employees?tab=team&action=invite' },
  { label: 'Add workforce employee',   icon: UsersIcon,      href: '/employees?tab=workforce' },
  { label: 'Open company settings',    icon: Settings2Icon,  href: '/settings' },
]

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter()

  // Global ⌘K / Ctrl+K listener
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        onOpenChange(true)
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onOpenChange])

  function run(href: string) {
    onOpenChange(false)
    router.push(href)
  }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search actions…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Actions">
          {ACTIONS.map(({ label, icon: Icon, href }) => (
            <CommandItem key={label} onSelect={() => run(href)}>
              <Icon className="size-4 text-muted-foreground" />
              {label}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Company">
          {COMPANY_ACTIONS.map(({ label, icon: Icon, href }) => (
            <CommandItem key={label} onSelect={() => run(href)}>
              <Icon className="size-4 text-muted-foreground" />
              {label}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
