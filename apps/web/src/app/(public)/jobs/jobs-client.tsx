'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { usePublicVacancies } from '@/hooks/public'
import type { LandingPublicVacancyListItem } from '@/lib/api'
import { cn } from '@/lib/utils'

const TYPE_LABELS: Record<string, string> = {
  PERMANENT: 'Permanent',
  CONTRACT: 'Contract',
  INTERNSHIP: 'Internship',
  VACATION_JOB: 'Vacation Job',
}

const TYPE_COLORS: Record<string, string> = {
  PERMANENT: 'bg-emerald-500/10 text-emerald-600',
  CONTRACT: 'bg-sky-500/10 text-sky-600',
  INTERNSHIP: 'bg-violet-500/10 text-violet-600',
  VACATION_JOB: 'bg-amber-500/10 text-amber-600',
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function SkeletonCard() {
  return (
    <div className="border border-border bg-card p-5 animate-pulse">
      <div className="h-4 bg-muted w-2/3 mb-2" />
      <div className="h-3 bg-muted w-1/3 mb-4" />
      <div className="flex gap-2 mb-4">
        <div className="h-5 bg-muted w-20" />
        <div className="h-5 bg-muted w-16" />
      </div>
      <div className="h-3 bg-muted w-1/2" />
    </div>
  )
}

function VacancyCard({ vacancy }: { vacancy: LandingPublicVacancyListItem }) {
  return (
    <Link
      href={`/jobs/${vacancy.id}`}
      className="block border border-border bg-card hover:bg-secondary transition-colors p-5 group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-foreground group-hover:text-primary transition-colors leading-snug">
            {vacancy.title}
          </p>
          <p className="text-sm text-muted-foreground mt-0.5">{vacancy.companyName}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mt-3">
        <span
          className={cn(
            'text-xs px-2 py-0.5 font-medium',
            TYPE_COLORS[vacancy.vacancyType] ?? 'bg-muted text-muted-foreground'
          )}
        >
          {TYPE_LABELS[vacancy.vacancyType] ?? vacancy.vacancyType}
        </span>
        <span className="bg-muted text-muted-foreground text-xs px-2 py-0.5">
          {vacancy.slotsAvailable} {vacancy.slotsAvailable === 1 ? 'slot' : 'slots'}
        </span>
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
        <span className="text-xs text-muted-foreground">Deadline: {formatDate(vacancy.deadline)}</span>
        {vacancy.postedAt && (
          <span className="text-xs text-muted-foreground">Posted: {formatDate(vacancy.postedAt)}</span>
        )}
      </div>
    </Link>
  )
}

export function PublicJobsClient() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [keyword, setKeyword] = useState(searchParams.get('q') ?? '')
  const [debouncedKeyword, setDebouncedKeyword] = useState(keyword)
  const [cursor, setCursor] = useState<string | undefined>(undefined)
  const [cursorStack, setCursorStack] = useState<string[]>([])
  const [pageOffset, setPageOffset] = useState(0)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Debounce keyword → debouncedKeyword, reset pagination
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setDebouncedKeyword(keyword)
      setCursor(undefined)
      setCursorStack([])
      setPageOffset(0)
      const q = new URLSearchParams()
      if (keyword) q.set('q', keyword)
      router.push(`?${q.toString()}`, { scroll: false })
    }, 350)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [keyword, router])

  const filters = useMemo(
    () => ({ keyword: debouncedKeyword || undefined, cursor }),
    [debouncedKeyword, cursor]
  )

  const { data: page, isLoading } = usePublicVacancies(filters)
  const vacancies = page?.data ?? []
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
  const end = pageOffset + vacancies.length

  return (
    <div>
      {/* Search */}
      <div className="mb-6">
        <input
          type="search"
          placeholder="Search by title, company, keyword…"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          className="w-full sm:max-w-md border border-border bg-card text-foreground px-4 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Loading skeletons */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && vacancies.length === 0 && (
        <div className="py-16 text-center border border-border bg-card">
          <p className="text-muted-foreground text-sm">No open positions match your search.</p>
        </div>
      )}

      {/* Results */}
      {!isLoading && vacancies.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {vacancies.map((v) => (
              <VacancyCard key={v.id} vacancy={v} />
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Showing {start}–{end} of {total} {total === 1 ? 'position' : 'positions'}
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
        </>
      )}
    </div>
  )
}
