'use client'

import { useState, useMemo, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Loader2, CalendarDays } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ListView } from '@/components/layout/list-view'
import type { ListItem, ColumnConfig, ViewMode, RenderCardFn } from '@/components/layout/list-view'
import { usePrograms } from '@/hooks/programs'
import type { ProgramCycleListItem } from '@/lib/api'
import { cn } from '@/lib/utils'

const STATUS_TABS = [
  { label: 'All', value: undefined },
  { label: 'Open', value: 'OPEN' },
  { label: 'Planned', value: 'PLANNED' },
  { label: 'Matching', value: 'MATCHING' },
  { label: 'Completed', value: 'COMPLETED' },
] as const

const STATUS_COLORS: Record<string, string> = {
  PLANNED: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
  OPEN: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  MATCHING: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
  COMPLETED: 'bg-muted text-muted-foreground',
}

const TYPE_LABELS: Record<string, string> = {
  VACATION_JOB: 'Vacation Job',
}

const CYCLE_COLORS = [
  'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
]

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function ProgramCardContent({ item, onOpen }: { item: ListItem; onOpen?: () => void }) {
  const status = item.metadata.status as string
  const type = item.metadata.type as string
  const year = item.metadata.year as number
  const startDate = item.metadata.startDate as string
  const endDate = item.metadata.endDate as string
  const avatarColor = CYCLE_COLORS[item.id.charCodeAt(0) % CYCLE_COLORS.length]!

  return (
    <div onClick={onOpen} className="flex flex-col gap-3 p-4 h-full min-h-[160px] cursor-pointer">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'size-10 rounded-lg font-bold text-sm flex items-center justify-center shrink-0',
            avatarColor
          )}
        >
          {year}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-sm leading-snug line-clamp-2">{item.name}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {TYPE_LABELS[type] ?? type}
          </p>
        </div>
      </div>

      {/* Status */}
      <div className="flex flex-wrap gap-1.5">
        <span
          className={cn(
            'inline-flex items-center text-xs px-2 py-0.5 rounded-full font-medium',
            STATUS_COLORS[status] ?? STATUS_COLORS.COMPLETED
          )}
        >
          {status.charAt(0) + status.slice(1).toLowerCase()}
        </span>
      </div>

      {/* Footer */}
      <div className="flex items-center gap-1.5 mt-auto pt-3 border-t border-border text-xs text-muted-foreground">
        <CalendarDays className="size-3 shrink-0" />
        <span>{formatDate(startDate)} – {formatDate(endDate)}</span>
      </div>
    </div>
  )
}

function toListItem(c: ProgramCycleListItem): ListItem {
  return {
    id: c.id,
    name: c.name,
    metadata: {
      type: c.type,
      status: c.status,
      year: c.year,
      startDate: c.startDate,
      endDate: c.endDate,
      description: c.description,
    },
  }
}

function ProgramsInner() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [view, setView] = useState<ViewMode>('card')
  const [status, setStatus] = useState<string | undefined>(
    searchParams.get('status') ?? undefined
  )
  const [cursor, setCursor] = useState<string | undefined>(
    searchParams.get('cursor') ?? undefined
  )
  const [cursorStack, setCursorStack] = useState<string[]>([])
  const [pageOffset, setPageOffset] = useState(0)

  const { data: page, isLoading, isError, error } = usePrograms({ cursor, status })
  const cycles = useMemo<ProgramCycleListItem[]>(() => page?.data ?? [], [page])
  const pagination = page?.pagination

  const columns: ColumnConfig[] = useMemo(
    () => [
      { key: 'name', label: 'Name', sortable: false, width: '40%' },
      {
        key: 'type',
        label: 'Type',
        sortable: false,
        render: (value) => (
          <span className="text-muted-foreground text-sm">
            {TYPE_LABELS[value as string] ?? (value as string)}
          </span>
        ),
      },
      { key: 'year', label: 'Year', sortable: false, render: (value) => <span>{value as number}</span> },
      {
        key: 'startDate',
        label: 'Start Date',
        sortable: false,
        render: (value) => <span className="text-muted-foreground">{formatDate(value as string)}</span>,
      },
      {
        key: 'endDate',
        label: 'End Date',
        sortable: false,
        render: (value) => <span className="text-muted-foreground">{formatDate(value as string)}</span>,
      },
      {
        key: 'status',
        label: 'Status',
        sortable: false,
        render: (value) => (
          <span
            className={cn(
              'inline-flex items-center text-xs px-2 py-0.5 rounded-full font-medium',
              STATUS_COLORS[value as string] ?? STATUS_COLORS.COMPLETED
            )}
          >
            {(value as string).charAt(0) + (value as string).slice(1).toLowerCase()}
          </span>
        ),
      },
    ],
    []
  )

  const renderCard: RenderCardFn = useCallback(
    (item, { onOpen }) => <ProgramCardContent item={item} onOpen={onOpen} />,
    []
  )

  function navigate(newStatus?: string, newCursor?: string) {
    const q = new URLSearchParams()
    if (newStatus) q.set('status', newStatus)
    if (newCursor) q.set('cursor', newCursor)
    router.push(`?${q.toString()}`, { scroll: false })
  }

  function handleTabChange(value?: string) {
    setStatus(value)
    setCursor(undefined)
    setCursorStack([])
    setPageOffset(0)
    navigate(value)
  }

  function handleNext() {
    if (!pagination?.nextCursor) return
    setCursorStack((s) => [...s, cursor ?? ''])
    setPageOffset((o) => o + 20)
    setCursor(pagination.nextCursor)
    navigate(status, pagination.nextCursor)
  }

  function handlePrev() {
    const stack = [...cursorStack]
    const prev = stack.pop()
    setCursorStack(stack)
    setPageOffset((o) => o - 20)
    const prevCursor = prev === '' ? undefined : prev
    setCursor(prevCursor)
    navigate(status, prevCursor)
  }

  const start = pageOffset + 1
  const end = pageOffset + cycles.length
  const total = pagination?.total ?? 0

  const items: ListItem[] = useMemo(() => cycles.map(toListItem), [cycles])

  const paginationFooter = total > 0 ? (
    <div className="flex items-center justify-between px-3 py-2 border-t border-border">
      <p className="text-xs text-muted-foreground">
        Showing {start}–{end} of {total}{' '}
        {total === 1 ? 'program' : 'programs'}
      </p>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={handlePrev} disabled={cursorStack.length === 0}>
          Previous
        </Button>
        <Button variant="outline" size="sm" onClick={handleNext} disabled={!pagination?.hasMore}>
          Next
        </Button>
      </div>
    </div>
  ) : null

  if (isError) {
    return (
      <div className="flex flex-col h-full min-h-0">
        <div className="mb-4">
          <h1 className="text-2xl font-semibold">Programs</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Employment programs managed by the Ministry of Labour</p>
        </div>
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          Failed to load programs: {error instanceof Error ? error.message : 'Unknown error'}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-semibold">Programs</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Employment programs managed by the Ministry of Labour</p>
        </div>
      </div>

      <div className="flex gap-1 border-b border-border mb-2">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.label}
            onClick={() => handleTabChange(tab.value)}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
              status === tab.value
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <ListView
        items={items}
        view={view}
        onViewChange={setView}
        columns={columns}
        renderCard={renderCard}
        onItemOpen={(item) => router.push(`/programs/${item.id}`)}
        searchPlaceholder="Search programs..."
        emptyState={
          isLoading
            ? () => (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="size-5 animate-spin text-muted-foreground" />
                </div>
              )
            : undefined
        }
        footer={paginationFooter}
        className="flex-1 min-h-0 rounded-lg border border-border overflow-hidden"
      />
    </div>
  )
}

export default function EmployerProgramsPage() {
  return (
    <Suspense>
      <ProgramsInner />
    </Suspense>
  )
}
