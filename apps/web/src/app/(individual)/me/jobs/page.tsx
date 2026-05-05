'use client'

import { useState, useMemo, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Loader2, ArrowUpRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ListView } from '@/components/layout/list-view'
import type { ListItem, ColumnConfig, ViewMode, RenderCardFn } from '@/components/layout/list-view'
import { useJobListings } from '@/hooks/jobs'
import type { PublicVacancyListItem } from '@/lib/api'
import { cn } from '@/lib/utils'

const TYPE_TABS = [
  { label: 'All', value: undefined },
  { label: 'Permanent', value: 'PERMANENT' },
  { label: 'Contract', value: 'CONTRACT' },
  { label: 'Internship', value: 'INTERNSHIP' },
  { label: 'Vacation Job', value: 'VACATION_JOB' },
] as const

const TYPE_LABELS: Record<string, string> = {
  PERMANENT: 'Permanent',
  CONTRACT: 'Contract',
  INTERNSHIP: 'Internship',
  VACATION_JOB: 'Vacation Job',
}

const TYPE_COLORS: Record<string, string> = {
  PERMANENT: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  CONTRACT: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
  INTERNSHIP: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
  VACATION_JOB: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
}

const AVATAR_COLORS = [
  'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
]

function getInitials(title: string): string {
  const words = title.trim().split(/\s+/)
  if (words.length === 1) return words[0]!.charAt(0).toUpperCase()
  return (words[0]!.charAt(0) + words[1]!.charAt(0)).toUpperCase()
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function JobCardContent({ item, onOpen }: { item: ListItem; onOpen?: () => void }) {
  const vacancyType = item.metadata.vacancyType as string
  const deadline = item.metadata.deadline as string
  const slotsAvailable = item.metadata.slotsAvailable as number
  const companyName = item.metadata.companyName as string
  const initials = getInitials(item.name)
  const avatarColor = AVATAR_COLORS[item.id.charCodeAt(0) % AVATAR_COLORS.length]!

  return (
    <div className="flex flex-col gap-3 p-4 h-full min-h-[160px]">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'size-10 rounded-lg font-bold text-sm flex items-center justify-center shrink-0',
            avatarColor
          )}
        >
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-sm leading-snug line-clamp-2">{item.name}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{companyName}</p>
        </div>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-1.5">
        <span
          className={cn(
            'inline-flex items-center text-xs px-2 py-0.5 rounded-full font-medium',
            TYPE_COLORS[vacancyType] ?? 'bg-muted text-muted-foreground'
          )}
        >
          {TYPE_LABELS[vacancyType] ?? vacancyType}
        </span>
        <span className="bg-muted text-muted-foreground text-xs px-2 py-0.5 rounded-full">
          {slotsAvailable} {slotsAvailable === 1 ? 'slot' : 'slots'}
        </span>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-auto pt-3 border-t border-border">
        <span className="text-xs text-muted-foreground">Deadline: {formatDate(deadline)}</span>
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs gap-1"
          onClick={(e) => {
            e.stopPropagation()
            onOpen?.()
          }}
        >
          Open <ArrowUpRight className="size-3" />
        </Button>
      </div>
    </div>
  )
}

function toListItem(v: PublicVacancyListItem): ListItem {
  return {
    id: v.id,
    name: v.title,
    metadata: {
      companyName: v.companyName,
      vacancyType: v.vacancyType,
      deadline: v.deadline,
      slotsAvailable: v.slotsAvailable,
    },
  }
}

function JobsInner() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [view, setView] = useState<ViewMode>('card')
  const [vacancyType, setVacancyType] = useState<string | undefined>(
    searchParams.get('vacancyType') ?? undefined
  )
  const [cursor, setCursor] = useState<string | undefined>(
    searchParams.get('cursor') ?? undefined
  )
  const [cursorStack, setCursorStack] = useState<string[]>([])
  const [pageOffset, setPageOffset] = useState(0)

  const { data: page, isLoading } = useJobListings({ cursor, vacancyType })
  const jobs = useMemo<PublicVacancyListItem[]>(() => page?.data ?? [], [page])
  const pagination = page?.pagination

  const columns: ColumnConfig[] = useMemo(
    () => [
      { key: 'name', label: 'Title', sortable: false, width: '30%' },
      {
        key: 'companyName',
        label: 'Company',
        sortable: false,
        render: (value) => (
          <span className="text-muted-foreground text-sm">{value as string}</span>
        ),
      },
      {
        key: 'vacancyType',
        label: 'Type',
        sortable: false,
        render: (value) => (
          <span
            className={cn(
              'inline-flex items-center text-xs px-2 py-0.5 rounded-full font-medium',
              TYPE_COLORS[value as string] ?? 'bg-muted text-muted-foreground'
            )}
          >
            {TYPE_LABELS[value as string] ?? (value as string)}
          </span>
        ),
      },
      {
        key: 'deadline',
        label: 'Deadline',
        sortable: false,
        render: (value) => (
          <span className="text-muted-foreground">{formatDate(value as string)}</span>
        ),
      },
      {
        key: 'slotsAvailable',
        label: 'Slots Available',
        sortable: false,
        render: (value) => <span>{value as number}</span>,
      },
    ],
    []
  )

  const renderCard: RenderCardFn = useCallback(
    (item, { onOpen }) => <JobCardContent item={item} onOpen={onOpen} />,
    []
  )

  function navigate(newType?: string, newCursor?: string) {
    const q = new URLSearchParams()
    if (newType) q.set('vacancyType', newType)
    if (newCursor) q.set('cursor', newCursor)
    router.push(`?${q.toString()}`, { scroll: false })
  }

  function handleTabChange(value?: string) {
    setVacancyType(value)
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
    navigate(vacancyType, pagination.nextCursor)
  }

  function handlePrev() {
    const stack = [...cursorStack]
    const prev = stack.pop()
    setCursorStack(stack)
    setPageOffset((o) => o - 20)
    const prevCursor = prev === '' ? undefined : prev
    setCursor(prevCursor)
    navigate(vacancyType, prevCursor)
  }

  const start = pageOffset + 1
  const end = pageOffset + jobs.length
  const total = pagination?.total ?? 0

  const items: ListItem[] = useMemo(() => jobs.map(toListItem), [jobs])

  const paginationFooter = total > 0 ? (
    <div className="flex items-center justify-between px-3 py-2 border-t border-border">
      <p className="text-xs text-muted-foreground">
        Showing {start}–{end} of {total}{' '}
        {total === 1 ? 'job' : 'jobs'}
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

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold">Jobs</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Browse available job listings</p>
      </div>

      <div className="flex gap-1 border-b border-border mb-2">
        {TYPE_TABS.map((tab) => (
          <button
            key={tab.label}
            onClick={() => handleTabChange(tab.value)}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
              vacancyType === tab.value
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
        onItemOpen={(item) => router.push(`/me/jobs/${item.id}`)}
        searchPlaceholder="Search jobs..."
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

export default function SeekerJobsPage() {
  return (
    <Suspense>
      <JobsInner />
    </Suspense>
  )
}
