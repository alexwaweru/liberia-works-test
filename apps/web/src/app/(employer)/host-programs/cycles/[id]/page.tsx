'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useProgram, useProgramMatches, useHostingCapacityByCycle } from '@/hooks/programs'
import { HostingCapacityDialog } from '@/components/programs/hosting-capacity-dialog'
import type { ProgramCycleListItem, ProgramPlacementListItem } from '@/lib/api'

const STATUS_COLORS: Record<string, string> = {
  PLANNED: 'bg-sky-500/10 text-sky-600',
  OPEN: 'bg-emerald-500/10 text-emerald-600',
  MATCHING: 'bg-violet-500/10 text-violet-600',
  COMPLETED: 'bg-muted text-muted-foreground',
}

const TYPE_LABELS: Record<string, string> = {
  VACATION_JOB: 'Vacation Job Programme',
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

type Tab = 'overview' | 'capacity' | 'matches'

export default function EmployerProgramDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('overview')
  const [capacityDialogOpen, setCapacityDialogOpen] = useState(false)

  const { data: cycle, isLoading, isError } = useProgram(id)
  const { data: matches } = useProgramMatches(id)
  const { data: existingCapacity } = useHostingCapacityByCycle(id)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (isError || !cycle) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">Program not found.</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/host-programs')}>
          Back to Programs
        </Button>
      </div>
    )
  }

  const c = cycle as ProgramCycleListItem
  const matchList = (matches as ProgramPlacementListItem[] | undefined) ?? []
  const hasMatches = matchList.length > 0

  const actionButton = c.status === 'OPEN'
    ? (
      <Button className="w-full" onClick={() => setTab('capacity')}>
        {existingCapacity ? 'Manage Hosting' : 'Declare Capacity'}
      </Button>
    )
    : (
      <Button className="w-full" disabled>
        {c.status === 'PLANNED' ? 'Registration not yet open' : 'Registration closed'}
      </Button>
    )

  return (
    <>
    <div className="max-w-4xl mx-auto pb-16">
      {/* Back link */}
      <button
        onClick={() => router.push('/host-programs')}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="size-4" />
        All Programs
      </button>

      {/* Title + status */}
      <div className="flex items-start justify-between gap-4 mb-1">
        <h1 className="text-2xl font-semibold">{c.name}</h1>
        <span
          className={cn(
            'inline-flex items-center text-xs px-2 py-0.5 rounded-full font-medium shrink-0',
            STATUS_COLORS[c.status] ?? STATUS_COLORS.COMPLETED
          )}
        >
          {c.status.charAt(0) + c.status.slice(1).toLowerCase()}
        </span>
      </div>
      <p className="text-muted-foreground mb-6">{c.year}</p>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-border mb-8">
        {(['overview', 'capacity', 'matches'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'px-5 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
              tab === t
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {t === 'overview' ? 'Overview' : t === 'capacity' ? 'Hosting Capacity' : 'Matches'}
          </button>
        ))}
      </div>

      {/* Overview tab */}
      {tab === 'overview' && (
        <div className="flex flex-col md:flex-row gap-8">
          <aside className="md:w-56 shrink-0 space-y-5">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Type</p>
              <p className="text-sm font-medium">{TYPE_LABELS[c.type] ?? c.type.replace(/_/g, ' ')}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Year</p>
              <p className="text-sm font-medium">{c.year}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Status</p>
              <span
                className={cn(
                  'inline-flex items-center text-xs px-2 py-0.5 rounded-full font-medium',
                  STATUS_COLORS[c.status] ?? STATUS_COLORS.COMPLETED
                )}
              >
                {c.status.charAt(0) + c.status.slice(1).toLowerCase()}
              </span>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Opens</p>
              <p className="text-sm font-medium">{formatDate(c.startDate)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Closes</p>
              <p className="text-sm font-medium">{formatDate(c.endDate)}</p>
            </div>
            <div className="pt-1">{actionButton}</div>
          </aside>

          <div className="flex-1 min-w-0">
            {c.description ? (
              <div
                className="prose prose-sm dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: c.description }}
              />
            ) : (
              <p className="text-sm text-muted-foreground">No description provided.</p>
            )}
          </div>
        </div>
      )}

      {/* Hosting Capacity tab */}
      {tab === 'capacity' && (
        <div>
          {c.status === 'OPEN' ? (
            <div className="p-6 rounded-xl border bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50 flex items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold text-emerald-700 dark:text-emerald-400">Registration is Open</h3>
                <p className="text-sm text-emerald-600 dark:text-emerald-500 mt-0.5">
                  {existingCapacity
                    ? `You have declared ${existingCapacity.totalSlots} slot${existingCapacity.totalSlots !== 1 ? 's' : ''}. You may update your hosting capacity below.`
                    : 'Submit your hosting capacity to participate in this program.'}
                </p>
              </div>
              <Button
                className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
                onClick={() => setCapacityDialogOpen(true)}
              >
                {existingCapacity ? 'Manage Hosting' : 'Participate Now'}
              </Button>
            </div>
          ) : (
            <div className="p-12 border border-dashed rounded-lg text-center">
              <p className="text-muted-foreground font-medium">Hosting capacity is not available</p>
              <p className="text-sm text-muted-foreground mt-1">
                {c.status === 'PLANNED'
                  ? 'Registration has not opened yet.'
                  : 'Registration for this program cycle has closed.'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Matches tab */}
      {tab === 'matches' && (
        <div>
          {c.status !== 'MATCHING' && c.status !== 'COMPLETED' ? (
            <div className="p-12 border border-dashed rounded-lg text-center">
              <Users className="size-8 mx-auto text-muted-foreground mb-3" />
              <h3 className="font-medium text-muted-foreground">Matching hasn&apos;t started yet</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Matches will appear here once the program enters the matching phase.
              </p>
            </div>
          ) : hasMatches ? (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <Users className="size-5 text-primary" />
                <h2 className="text-xl font-semibold">Matched Job Seekers</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {matchList.map((match) => (
                  <div key={match.id} className="p-4 rounded-lg border bg-card flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">{match.individual.fullName}</p>
                      <span className="text-xs text-muted-foreground">
                        Matched on {formatDate(match.matchDate)}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <p>{match.individual.email}</p>
                      <p>{match.individual.phoneNumber}</p>
                    </div>
                    {match.individual.education && match.individual.education.length > 0 && (
                      <div className="text-sm">
                        <p className="font-medium text-foreground text-xs uppercase mb-1">Education</p>
                        <p className="text-muted-foreground">{match.individual.education[0].institutionName}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-12 border border-dashed rounded-lg text-center">
              <Users className="size-8 mx-auto text-muted-foreground mb-3" />
              <h3 className="font-medium text-muted-foreground">No matches detected yet</h3>
              <p className="text-sm text-muted-foreground mt-1">
                You will be notified once job seekers are matched to your offered slots.
              </p>
            </div>
          )}
        </div>
      )}
    </div>

    <HostingCapacityDialog
      program={c}
      existingCapacity={existingCapacity}
      open={capacityDialogOpen}
      onOpenChange={setCapacityDialogOpen}
    />
    </>
  )
}
