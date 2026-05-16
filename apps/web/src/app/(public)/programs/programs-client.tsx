'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { usePublicProgramCycles } from '@/hooks/public'
import type { PublicProgramCycleListItem } from '@/lib/api'

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

function truncate(text: string, max: number) {
  const plain = stripHtml(text)
  if (plain.length <= max) return plain
  return plain.slice(0, max).trimEnd() + '…'
}

function SkeletonCard() {
  return (
    <div className="border border-border bg-card p-5 animate-pulse">
      <div className="h-4 bg-muted w-2/3 mb-2" />
      <div className="h-3 bg-muted w-full mb-1" />
      <div className="h-3 bg-muted w-4/5 mb-4" />
      <div className="h-3 bg-muted w-1/2" />
    </div>
  )
}

function ProgramCard({ cycle }: { cycle: PublicProgramCycleListItem }) {
  return (
    <Link
      href={`/programs/${cycle.id}`}
      className="block border border-border bg-card hover:bg-secondary transition-colors p-5 group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-foreground group-hover:text-primary transition-colors leading-snug">
            {cycle.name}
          </p>
          <span className="inline-block mt-1 text-xs px-2 py-0.5 bg-emerald-500/10 text-emerald-600 font-medium">
            Open
          </span>
        </div>
      </div>

      {cycle.description && (
        <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
          {truncate(cycle.description, 140)}
        </p>
      )}

      <div className="mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
        {formatDate(cycle.openAt)} – {formatDate(cycle.closeAt)}
      </div>
    </Link>
  )
}

export function PublicProgramsClient() {
  const [cursor, setCursor] = useState<string | undefined>(undefined)
  const [cursorStack, setCursorStack] = useState<string[]>([])
  const [pageOffset, setPageOffset] = useState(0)

  const { data: page, isLoading } = usePublicProgramCycles({ cursor })
  const cycles = page?.data ?? []
  const pagination = page?.pagination
  const total = pagination?.total ?? 0

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
  const end = pageOffset + cycles.length

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    )
  }

  if (cycles.length === 0) {
    return (
      <div className="py-16 text-center border border-border bg-card">
        <p className="text-muted-foreground text-sm">No open programs at this time. Check back soon.</p>
      </div>
    )
  }

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cycles.map((c) => (
          <ProgramCard key={c.id} cycle={c} />
        ))}
      </div>

      {total > 0 && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Showing {start}–{end} of {total} {total === 1 ? 'program' : 'programs'}
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
      )}
    </div>
  )
}
