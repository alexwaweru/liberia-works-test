'use client'

import { useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ListView } from '@/components/layout/list-view'
import type { ListItem, ColumnConfig } from '@/components/layout/list-view'
import { useApplications } from '@/hooks/applications'
import { cn } from '@/lib/utils'
import type { ApplicationListItem } from '@/lib/api'

const STATUS_TABS = [
  { label: 'All', value: undefined },
  { label: 'Applied', value: 'APPLIED' },
  { label: 'Shortlisted', value: 'SHORTLISTED' },
  { label: 'Rejected', value: 'REJECTED' },
  { label: 'Hired', value: 'HIRED' },
] as const

const APPLICATION_STATUS_COLORS: Record<string, string> = {
  APPLIED: 'bg-blue-500/10 text-blue-600',
  SHORTLISTED: 'bg-emerald-500/10 text-emerald-600',
  REJECTED: 'bg-destructive/10 text-destructive',
  WITHDRAWN: 'bg-muted text-muted-foreground',
  HIRED: 'bg-violet-500/10 text-violet-600',
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function toListItem(a: ApplicationListItem): ListItem {
  return {
    id: a.id,
    name: a.applicantName ?? 'Unknown',
    metadata: {
      applicantEmail: a.applicantEmail,
      appliedAt: a.appliedAt,
      status: a.status,
    },
  }
}

export function ApplicationsTab({ vacancyId }: { vacancyId: string }) {
  const router = useRouter()
  const [status, setStatus] = useState<string | undefined>(undefined)
  const [cursor, setCursor] = useState<string | undefined>(undefined)
  const [cursorStack, setCursorStack] = useState<string[]>([])
  const [pageOffset, setPageOffset] = useState(0)

  const { data: page, isLoading } = useApplications(vacancyId, { cursor, status })
  const applications: ApplicationListItem[] = page?.data ?? []
  const pagination = page?.pagination

  const columns: ColumnConfig[] = useMemo(
    () => [
      { key: 'name', label: 'Applicant Name', sortable: false, width: '25%' },
      {
        key: 'applicantEmail',
        label: 'Email',
        sortable: false,
        render: (value) => (
          <span className="text-muted-foreground text-sm">{(value as string | null) ?? '—'}</span>
        ),
      },
      {
        key: 'appliedAt',
        label: 'Applied Date',
        sortable: false,
        render: (value) => (
          <span className="text-muted-foreground">{formatDate(value as string)}</span>
        ),
      },
      {
        key: 'status',
        label: 'Status',
        sortable: false,
        render: (value) => (
          <span
            className={cn(
              'inline-flex items-center text-xs px-2 py-0.5 rounded-full font-medium',
              APPLICATION_STATUS_COLORS[value as string] ?? 'bg-muted text-muted-foreground'
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
            className="flex items-center justify-end"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={() => router.push(`/vacancies/${vacancyId}/applications/${item.id}`)}
            >
              View
            </Button>
          </div>
        ),
      },
    ],
    [router, vacancyId]
  )

  const handleTabChange = useCallback((value?: string) => {
    setStatus(value)
    setCursor(undefined)
    setCursorStack([])
    setPageOffset(0)
  }, [])

  function handleNext() {
    if (!pagination?.nextCursor) return
    setCursorStack((s) => [...s, cursor ?? ''])
    setPageOffset((o) => o + 20)
    setCursor(pagination.nextCursor)
  }

  function handlePrev() {
    const stack = [...cursorStack]
    const prev = stack.pop()
    setCursorStack(stack)
    setPageOffset((o) => o - 20)
    setCursor(prev === '' ? undefined : prev)
  }

  const start = pageOffset + 1
  const end = pageOffset + applications.length
  const total = pagination?.total ?? 0

  const items: ListItem[] = useMemo(() => applications.map(toListItem), [applications])

  const paginationFooter =
    total > 0 ? (
      <div className="flex items-center justify-between px-3 py-2 border-t border-border">
        <p className="text-xs text-muted-foreground">
          Showing {start}–{end} of {total}{' '}
          {total === 1 ? 'application' : 'applications'}
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
    <div className="flex flex-col">
      {/* Status filter tabs */}
      <div className="flex gap-1 border-b border-border mb-3">
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
        view="table"
        onViewChange={() => undefined}
        columns={columns}
        onItemOpen={(item) => router.push(`/vacancies/${vacancyId}/applications/${item.id}`)}
        searchPlaceholder="Search applicants..."
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
        className="rounded-lg border border-border overflow-hidden"
      />
    </div>
  )
}
