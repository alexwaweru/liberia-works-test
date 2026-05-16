'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2, MapPin, Phone, User, Layers } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/status-badge'
import { useMyHostingCapacity } from '@/hooks/programs'
import type { HostingCapacity } from '@/lib/api'
import { cn } from '@/lib/utils'

const CYCLE_STATUS_VARIANT: Record<string, 'success' | 'pending' | 'warning' | 'neutral'> = {
  OPEN: 'success',
  PLANNED: 'warning',
  MATCHING: 'pending',
  COMPLETED: 'neutral',
}

const CYCLE_STATUS_LABELS: Record<string, string> = {
  OPEN: 'Open',
  PLANNED: 'Planned',
  MATCHING: 'Matching',
  COMPLETED: 'Completed',
}

function CapacityCard({ item }: { item: HostingCapacity }) {
  const cycleStatus = item.cycle.status
  const variant = CYCLE_STATUS_VARIANT[cycleStatus] ?? 'neutral'

  return (
    <div className="rounded-lg border border-border bg-card p-5 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-base leading-snug">{item.cycle.name}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{item.cycle.year}</p>
        </div>
        <StatusBadge
          label={CYCLE_STATUS_LABELS[cycleStatus] ?? cycleStatus}
          variant={variant}
          className="shrink-0"
        />
      </div>

      {/* Total slots summary */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Layers className="size-3.5 shrink-0" />
        <span>
          <span className="font-medium text-foreground">{item.totalSlots}</span>{' '}
          {item.totalSlots === 1 ? 'slot' : 'slots'} total across{' '}
          <span className="font-medium text-foreground">{item.capacities.length}</span>{' '}
          {item.capacities.length === 1 ? 'county' : 'counties'}
        </span>
      </div>

      {/* County breakdown table */}
      <div className="rounded-md border border-border/60 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 text-xs text-muted-foreground uppercase">
              <th className="px-3 py-2 text-left font-medium">County</th>
              <th className="px-3 py-2 text-right font-medium">Slots</th>
            </tr>
          </thead>
          <tbody>
            {item.capacities.map((cap) => (
              <tr key={cap.id} className="border-t border-border/40">
                <td className="px-3 py-2 flex items-center gap-1.5">
                  <MapPin className="size-3 text-muted-foreground shrink-0" />
                  {cap.state.name}
                </td>
                <td className="px-3 py-2 text-right font-medium">{cap.slotsOffered}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Contact info */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <User className="size-3.5 shrink-0" />
          <span>{item.contactName}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Phone className="size-3.5 shrink-0" />
          <span>{item.contactPhone}</span>
        </div>
      </div>

      {/* Placement instructions */}
      {item.placementInstructions && (
        <div className="rounded-md bg-muted/50 px-3 py-2.5 text-sm text-muted-foreground border border-border/60">
          <p className="text-xs font-medium text-foreground mb-1">Placement instructions</p>
          {item.placementInstructions}
        </div>
      )}
    </div>
  )
}

function OptedInInner() {
  const [cursor, setCursor] = useState<string | undefined>()
  const [cursorStack, setCursorStack] = useState<string[]>([])

  const { data: page, isLoading, isError, error } = useMyHostingCapacity(cursor)

  const items = page?.data ?? []
  const pagination = page?.pagination

  function handleNext() {
    if (!pagination?.nextCursor) return
    setCursorStack((s) => [...s, cursor ?? ''])
    setCursor(pagination.nextCursor)
  }

  function handlePrev() {
    const stack = [...cursorStack]
    const prev = stack.pop()
    setCursorStack(stack)
    setCursor(prev === '' ? undefined : prev)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Back */}
      <Link
        href="/host-programs"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-5 transition-colors w-fit"
      >
        <ArrowLeft className="size-4" />
        All Programs
      </Link>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">My Opted-In Programs</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Programs your company has registered hosting capacity for
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/host-programs">Browse Programs</Link>
        </Button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : isError ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          Failed to load: {error instanceof Error ? error.message : 'Unknown error'}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border rounded-lg border-border">
          <Layers className="size-10 text-muted-foreground/40 mb-3" />
          <p className="text-base font-medium text-foreground mb-1">No opted-in programs yet</p>
          <p className="text-sm text-muted-foreground mb-5">
            Browse open programs and register your hosting capacity.
          </p>
          <Button asChild>
            <Link href="/host-programs">Browse Programs</Link>
          </Button>
        </div>
      ) : (
        <>
          <div
            className={cn(
              'grid gap-4',
              items.length === 1
                ? 'grid-cols-1 max-w-lg'
                : 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3'
            )}
          >
            {items.map((item) => (
              <CapacityCard
                key={item.cycleId}
                item={item}
              />
            ))}
          </div>

          {/* Pagination */}
          {(pagination?.total ?? 0) > items.length || cursorStack.length > 0 ? (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground">
                {pagination?.total ?? 0}{' '}
                {(pagination?.total ?? 0) === 1 ? 'registration' : 'registrations'}
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
          ) : null}
        </>
      )}
    </div>
  )
}

export default function OptedInProgramsPage() {
  return (
    <Suspense>
      <OptedInInner />
    </Suspense>
  )
}
