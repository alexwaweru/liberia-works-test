'use client'

import { Suspense } from 'react'
import Link from 'next/link' 
import { Loader2, MapPin, Briefcase, GraduationCap, FileText } from 'lucide-react'
import { useMyOptIns } from '@/hooks/programs'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/status-badge'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

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

function MyOptInsInner() {
  const { data, isLoading, isError, error } = useMyOptIns()
  const optIns = data?.data ?? []

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col h-full min-h-0">
        <div className="mb-4">
          <h1 className="text-2xl font-semibold">My Opt-Ins</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Programs you&apos;ve opted into</p>
        </div>
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          Failed to load opt-ins: {error instanceof Error ? error.message : 'Unknown error'}
        </div>
      </div>
    )
  }

  if (optIns.length === 0) {
    return (
      <div className="flex flex-col h-full min-h-0">
        <div className="mb-4">
          <h1 className="text-2xl font-semibold">My Opt-Ins</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Programs you&apos;ve opted into</p>
        </div>
        <div className="flex flex-col items-center justify-center flex-1 text-center">
          <div className="rounded-full bg-muted p-6 mb-4">
            <Briefcase className="size-12 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No opt-ins yet</h3>
          <p className="text-sm text-muted-foreground max-w-md mb-6">
            You haven&apos;t opted into any programs yet. Browse available programs and opt in to get matched with employers.
          </p>
          <Link href="/me/programs">
            <Button size="lg">
              Browse Programs
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold">My Opt-Ins</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {optIns.length} {optIns.length === 1 ? 'program' : 'programs'}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {optIns.map((optIn) => {
          const avatarColor = CYCLE_COLORS[optIn.programCycle.id.charCodeAt(0) % CYCLE_COLORS.length]!
          
          return (
            <Card key={optIn.id} className="p-4 space-y-4">
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    'size-10 rounded-lg font-bold text-sm flex items-center justify-center shrink-0',
                    avatarColor
                  )}
                >
                  {optIn.programCycle.year}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm leading-snug line-clamp-2">
                    {optIn.programCycle.name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Opted in {formatDate(optIn.createdAt)}
                  </p>
                </div>
              </div>

              <div>
                <StatusBadge
                  label={
                    optIn.status === 'PENDING' ? 'Pending' :
                    optIn.status === 'MATCHED' ? 'Matched' :
                    optIn.status === 'DECLINED' ? 'Declined' :
                    'Withdrawn'
                  }
                  variant={
                    optIn.status === 'MATCHED' ? 'success' :
                    optIn.status === 'PENDING' ? 'pending' :
                    'neutral'
                  }
                />
              </div>

              <div className="space-y-2 text-sm">
                {optIn.preferredSectors.length > 0 && (
                  <div className="flex gap-2">
                    <Briefcase className="size-4 shrink-0 text-muted-foreground mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground">Sectors</p>
                      <p className="text-sm line-clamp-2">
                        {optIn.preferredSectors.map(s => s.name).join(', ')}
                      </p>
                    </div>
                  </div>
                )}

                {optIn.preferredCounties.length > 0 && (
                  <div className="flex gap-2">
                    <MapPin className="size-4 shrink-0 text-muted-foreground mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground">Counties</p>
                      <p className="text-sm line-clamp-2">
                        {optIn.preferredCounties.map(c => c.name).join(', ')}
                      </p>
                    </div>
                  </div>
                )}

                {optIn.preferredEducationLevel && (
                  <div className="flex gap-2">
                    <GraduationCap className="size-4 shrink-0 text-muted-foreground mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground">Education</p>
                      <p className="text-sm">{optIn.preferredEducationLevel.name}</p>
                    </div>
                  </div>
                )}

                {optIn.additionalNotes && (
                  <div className="flex gap-2">
                    <FileText className="size-4 shrink-0 text-muted-foreground mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground">Notes</p>
                      <p className="text-sm line-clamp-3">{optIn.additionalNotes}</p>
                    </div>
                  </div>
                )}

                {optIn.matchedEmployer && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <p className="text-xs text-muted-foreground mb-1">Matched With</p>
                    <p className="font-medium text-sm">{optIn.matchedEmployer.companyName}</p>
                    {optIn.matchedAt && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        on {formatDate(optIn.matchedAt)}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

export default function MyOptInsPage() {
  return (
    <Suspense>
      <MyOptInsInner />
    </Suspense>
  )
}