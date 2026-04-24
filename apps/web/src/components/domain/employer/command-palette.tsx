'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  FileCheckIcon,
  BriefcaseIcon,
  ScaleIcon,
  BarChart2Icon,
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
  { label: 'File for work permit', icon: FileCheckIcon, href: '/work-permits' },
  { label: 'Create vacancy',        icon: BriefcaseIcon,  href: '/vacancies' },
  { label: 'Raise a dispute',       icon: ScaleIcon,      href: '/disputes' },
  { label: 'Add report',            icon: BarChart2Icon,  href: '/reports' },
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
      </CommandList>
    </CommandDialog>
  )
}
