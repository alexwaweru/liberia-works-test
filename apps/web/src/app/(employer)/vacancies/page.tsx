'use client'

import { useState, useMemo, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, Loader2, ArrowUpRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ListView } from '@/components/layout/list-view'
import type { ListItem, ColumnConfig, ContextMenuAction, ViewMode, RenderCardFn } from '@/components/layout/list-view'
import { useVacancies, usePublishVacancy, useDeleteVacancy } from '@/hooks/vacancies'
import { toast } from '@/lib/toast'
import type { VacancyListItem } from '@/lib/api'
import { cn } from '@/lib/utils'

const STATUS_TABS = [
  { label: 'All', value: undefined },
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Draft', value: 'DRAFT' },
  { label: 'Closed', value: 'CLOSED' },
] as const

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  ACTIVE: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  CLOSED: 'bg-muted text-muted-foreground',
  ARCHIVED: 'bg-destructive/10 text-destructive',
}

const TYPE_LABELS: Record<string, string> = {
  PERMANENT: 'Permanent',
  CONTRACT: 'Contract',
  INTERNSHIP: 'Internship',
  VACATION_JOB: 'Vacation Job',
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

function relativeDate(dateStr: string | null): string {
  if (!dateStr) return 'Not posted yet'
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000)
  if (days === 0) return 'Posted today'
  if (days === 1) return 'Posted yesterday'
  return `Posted ${days}d ago`
}

function VacancyCardContent({
  item,
  onOpen,
}: {
  item: ListItem
  onOpen: () => void
}) {
  const status = item.metadata.status as string
  const postedAt = item.metadata.postedAt as string | null
  const vacancyType = item.metadata.vacancyType as string
  const applicationsCount = item.metadata.applicationsCount as number
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
          <p className="text-xs text-muted-foreground mt-0.5">
            {TYPE_LABELS[vacancyType] ?? vacancyType}
          </p>
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5">
        <span
          className={cn(
            'inline-flex items-center text-xs px-2 py-0.5 rounded-full font-medium',
            STATUS_COLORS[status] ?? STATUS_COLORS.CLOSED
          )}
        >
          {status.charAt(0) + status.slice(1).toLowerCase()}
        </span>
        <span className="bg-muted text-muted-foreground text-xs px-2 py-0.5 rounded-full">
          {applicationsCount} {applicationsCount === 1 ? 'application' : 'applications'}
        </span>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-auto pt-3 border-t border-border">
        <span className="text-xs text-muted-foreground">{relativeDate(postedAt)}</span>
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs gap-1"
          onClick={(e) => {
            e.stopPropagation()
            onOpen()
          }}
        >
          View job <ArrowUpRight className="size-3" />
        </Button>
      </div>
    </div>
  )
}

function toListItem(v: VacancyListItem): ListItem {
  return {
    id: v.id,
    name: v.title,
    metadata: {
      status: v.status,
      vacancyType: v.vacancyType,
      postedAt: v.postedAt,
      deadline: v.deadline,
      applicationsCount: v.applicationsCount,
    },
  }
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function VacanciesInner() {
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

  const { data: page, isLoading } = useVacancies({ cursor, status })
  const vacancies = useMemo<VacancyListItem[]>(() => page?.data ?? [], [page])
  const pagination = page?.pagination

  const publish = usePublishVacancy()
  const archive = useDeleteVacancy()

  const handlePublish = useCallback(
    async (id: string) => {
      try {
        await publish.mutateAsync(id)
        toast.success('Vacancy published')
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : 'Failed to publish')
      }
    },
    [publish]
  )

  const handleArchive = useCallback(
    async (id: string) => {
      try {
        await archive.mutateAsync(id)
        toast.success('Vacancy archived')
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : 'Failed to archive')
      }
    },
    [archive]
  )

  const columns: ColumnConfig[] = useMemo(
    () => [
      { key: 'name', label: 'Title', sortable: true, width: '35%' },
      {
        key: 'postedAt',
        label: 'Posted Date',
        sortable: true,
        render: (value) => (
          <span className="text-muted-foreground">
            {formatDate(value as string | null)}
          </span>
        ),
      },
      {
        key: 'deadline',
        label: 'Deadline',
        sortable: true,
        render: (value) => (
          <span className="text-muted-foreground">
            {formatDate(value as string)}
          </span>
        ),
      },
      {
        key: 'applicationsCount',
        label: 'Applications',
        sortable: true,
        render: (value) => <span>{value as number}</span>,
      },
      {
        key: 'status',
        label: 'Status',
        sortable: false,
        render: (value) => (
          <span
            className={cn(
              'inline-flex items-center text-xs px-2 py-0.5 rounded-full font-medium',
              STATUS_COLORS[value as string] ?? STATUS_COLORS.CLOSED
            )}
          >
            {(value as string).charAt(0) + (value as string).slice(1).toLowerCase()}
          </span>
        ),
      },
      {
        key: 'actions',
        label: '',
        sortable: false,
        render: (_, item) => (
          <div
            className="flex items-center justify-end gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            {item.metadata.status === 'DRAFT' && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                onClick={() => handlePublish(item.id)}
                disabled={publish.isPending && publish.variables === item.id}
              >
                {publish.isPending && publish.variables === item.id ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  'Publish'
                )}
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => handleArchive(item.id)}
              disabled={archive.isPending && archive.variables === item.id}
            >
              {archive.isPending && archive.variables === item.id ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                'Archive'
              )}
            </Button>
          </div>
        ),
      },
    ],
    [handlePublish, handleArchive, publish.isPending, publish.variables, archive.isPending, archive.variables]
  )

  const renderCard: RenderCardFn = useCallback(
    (item, { onOpen }) => <VacancyCardContent item={item} onOpen={onOpen} />,
    []
  )

  const contextMenuActions: ContextMenuAction[] = useMemo(
    () => [
      {
        id: 'view',
        label: 'View',
        onAction: ([item]) => item && router.push(`/vacancies/${item.id}`),
      },
      {
        id: 'publish',
        label: 'Publish',
        onAction: ([item]) => item && handlePublish(item.id),
      },
      {
        id: 'archive',
        label: 'Archive',
        destructive: true,
        onAction: ([item]) => item && handleArchive(item.id),
      },
    ],
    [handlePublish, handleArchive, router]
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
  const end = pageOffset + vacancies.length
  const total = pagination?.total ?? 0

  const items: ListItem[] = useMemo(() => vacancies.map(toListItem), [vacancies])

  const paginationFooter = total > 0 ? (
    <div className="flex items-center justify-between px-3 py-2 border-t border-border">
      <p className="text-xs text-muted-foreground">
        Showing {start}–{end} of {total}{' '}
        {total === 1 ? 'vacancy' : 'vacancies'}
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrev}
          disabled={cursorStack.length === 0}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleNext}
          disabled={!pagination?.hasMore}
        >
          Next
        </Button>
      </div>
    </div>
  ) : null

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-semibold">Vacancies</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage your job postings</p>
        </div>
        <Button asChild>
          <Link href="/vacancies/create">
            <Plus className="size-4" /> New Vacancy
          </Link>
        </Button>
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
        onItemOpen={(item) => router.push(`/vacancies/${item.id}`)}
        contextMenuActions={contextMenuActions}
        searchPlaceholder="Search vacancies..."
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

export default function EmployerVacanciesPage() {
  return (
    <Suspense>
      <VacanciesInner />
    </Suspense>
  )
}
