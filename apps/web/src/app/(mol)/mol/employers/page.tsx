'use client'

import { useState, useRef, useMemo, useCallback } from 'react'
import { Search, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ListView } from '@/components/layout/list-view'
import type { ListItem, ColumnConfig, ViewMode, RenderCardFn } from '@/components/layout/list-view'
import { useMolEmployers } from '@/hooks/mol'
import { cn } from '@/lib/utils'
import type { MolEmployerItem } from '@/lib/api'

const AVATAR_COLORS = [
  'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
]

function avatarColor(id: string): string {
  return AVATAR_COLORS[id.charCodeAt(0) % AVATAR_COLORS.length]!
}

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/)
  if (words.length === 1) return words[0]!.charAt(0).toUpperCase()
  return (words[0]!.charAt(0) + words[1]!.charAt(0)).toUpperCase()
}

function toListItem(employer: MolEmployerItem): ListItem {
  return {
    id: employer.id,
    name: employer.companyName,
    metadata: { raw: employer },
  }
}

function EmployerCard({ item }: { item: ListItem }) {
  const employer = item.metadata.raw as MolEmployerItem
  const m = employer.metrics
  const color = avatarColor(employer.id)
  const initials = getInitials(employer.companyName)

  return (
    <div className="flex flex-col gap-3 p-4 min-h-[160px]">
      <div className="flex items-start gap-3">
        <Avatar className="size-10 shrink-0">
          <AvatarFallback className={cn('text-sm font-bold', color)}>{initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-sm leading-snug truncate">{employer.companyName}</p>
          <p className="text-xs text-muted-foreground truncate">{employer.stateName ?? '—'}</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-x-3 gap-y-1.5 text-xs mt-auto pt-3 border-t border-border">
        <div>
          <p className="text-muted-foreground">Active Vac.</p>
          <p className="font-medium">{m.vacanciesActive}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Total Vac.</p>
          <p className="font-medium">{m.vacanciesTotal}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Employees</p>
          <p className="font-medium">{m.employees}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Permits</p>
          <p className="font-medium">{m.workPermits}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Disputes</p>
          <p className="font-medium">{m.disputes}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Placements</p>
          <p className="font-medium">{m.placements}</p>
        </div>
      </div>
    </div>
  )
}

export default function MolEmployersPage() {
  const [inputValue, setInputValue] = useState('')
  const [search, setSearch] = useState('')
  const [view, setView] = useState<ViewMode>('table')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleSearchChange(value: string) {
    setInputValue(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setSearch(value.trim()), 400)
  }

  const { data, isLoading, isError, error, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useMolEmployers({ search: search || undefined })

  const employers = useMemo(
    () => data?.pages.flatMap((p) => p.items) ?? [],
    [data]
  )

  const items: ListItem[] = useMemo(() => employers.map(toListItem), [employers])

  const columns: ColumnConfig[] = useMemo(
    () => [
      {
        key: 'name',
        label: 'Company',
        sortable: false,
        width: '25%',
        render: (_, item) => {
          const employer = item.metadata.raw as MolEmployerItem
          const color = avatarColor(employer.id)
          const initials = getInitials(employer.companyName)
          return (
            <div className="flex items-center gap-2.5">
              <Avatar className="size-7 shrink-0">
                <AvatarFallback className={cn('text-xs font-bold', color)}>{initials}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">{employer.companyName}</p>
                <p className="text-xs text-muted-foreground truncate">{employer.primaryContactEmail}</p>
              </div>
            </div>
          )
        },
      },
      {
        key: 'lra',
        label: 'LRA #',
        sortable: false,
        render: (_, item) => {
          const employer = item.metadata.raw as MolEmployerItem
          return <span className="text-sm text-muted-foreground">{employer.lraRegistrationNumber}</span>
        },
      },
      {
        key: 'state',
        label: 'State',
        sortable: false,
        render: (_, item) => {
          const employer = item.metadata.raw as MolEmployerItem
          return <span className="text-sm text-muted-foreground">{employer.stateName ?? '—'}</span>
        },
      },
      {
        key: 'vacanciesActive',
        label: 'Active Vacancies',
        sortable: false,
        render: (_, item) => {
          const { metrics: m } = item.metadata.raw as MolEmployerItem
          return m.vacanciesActive > 0 ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
              {m.vacanciesActive}
            </span>
          ) : (
            <span className="text-sm text-muted-foreground">0</span>
          )
        },
      },
      {
        key: 'vacanciesTotal',
        label: 'Total Vacancies',
        sortable: false,
        render: (_, item) => {
          const { metrics: m } = item.metadata.raw as MolEmployerItem
          return <span className="text-sm text-muted-foreground">{m.vacanciesTotal}</span>
        },
      },
      {
        key: 'employees',
        label: 'Employees',
        sortable: false,
        render: (_, item) => {
          const { metrics: m } = item.metadata.raw as MolEmployerItem
          return <span className="text-sm text-muted-foreground">{m.employees}</span>
        },
      },
      {
        key: 'workPermits',
        label: 'Work Permits',
        sortable: false,
        render: (_, item) => {
          const { metrics: m } = item.metadata.raw as MolEmployerItem
          return <span className="text-sm text-muted-foreground">{m.workPermits}</span>
        },
      },
      {
        key: 'disputes',
        label: 'Disputes',
        sortable: false,
        render: (_, item) => {
          const { metrics: m } = item.metadata.raw as MolEmployerItem
          return <span className="text-sm text-muted-foreground">{m.disputes}</span>
        },
      },
      {
        key: 'placements',
        label: 'Placements',
        sortable: false,
        render: (_, item) => {
          const { metrics: m } = item.metadata.raw as MolEmployerItem
          return <span className="text-sm text-muted-foreground">{m.placements}</span>
        },
      },
    ],
    []
  )

  const renderCard: RenderCardFn = useCallback(
    (item) => <EmployerCard item={item} />,
    []
  )

  return (
    <div className="flex flex-col h-full min-h-0 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Employers</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            All employers registered on the platform.
          </p>
        </div>
        <div className="relative w-64 shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            className="pl-9"
            placeholder="Search employers..."
            value={inputValue}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
      </div>

      {isError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          Failed to load employers: {error instanceof Error ? error.message : 'Unknown error'}
        </div>
      )}

      <ListView
        items={items}
        view={view}
        onViewChange={setView}
        columns={columns}
        renderCard={renderCard}
        emptyState={
          isLoading
            ? () => (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="size-5 animate-spin text-muted-foreground" />
                </div>
              )
            : undefined
        }
        className="flex-1 min-h-0 rounded-lg border border-border overflow-hidden"
      />

      {hasNextPage && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage && <Loader2 className="size-4 animate-spin mr-2" />}
            Load more
          </Button>
        </div>
      )}
    </div>
  )
}
