'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useProgram } from '@/hooks/programs'
import { OptInForm } from '@/components/programs/opt-in-form'
import type { ProgramCycleListItem } from '@/lib/api'

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

function optInButtonProps(status: string): { disabled: boolean; helperText: string | null } {
  if (status === 'OPEN') return { disabled: false, helperText: null }
  if (status === 'PLANNED') return { disabled: true, helperText: 'Opt-ins not yet open' }
  return { disabled: true, helperText: 'Closed' }
}

export default function IndividualProgramDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [tab, setTab] = useState<'overview' | 'opt-in'>('overview')
  const [submitted, setSubmitted] = useState(false)

  const { data: cycle, isLoading, error } = useProgram(id)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !cycle) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">Program not found.</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/me/programs')}>
          Back to Programs
        </Button>
      </div>
    )
  }

  const c = cycle as ProgramCycleListItem
  const { disabled: optInDisabled, helperText } = optInButtonProps(c.status)

  return (
    <div className="max-w-4xl mx-auto pb-16">
      {/* Back link */}
      <button
        onClick={() => router.push('/me/programs')}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="size-4" />
        All Programs
      </button>

      {/* Title */}
      <h1 className="text-2xl font-semibold mb-1">{c.name}</h1>
      <p className="text-muted-foreground mb-6">{c.year}</p>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-border mb-8">
        {(['overview', 'opt-in'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'px-5 py-2.5 text-sm font-medium border-b-2 -mb-px capitalize transition-colors',
              tab === t
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {t === 'overview' ? 'Overview' : 'Opt In'}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
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

            <div className="pt-1">
              <Button
                className="w-full"
                disabled={optInDisabled}
                onClick={() => setTab('opt-in')}
              >
                Opt In Now
              </Button>
              {helperText && (
                <p className="text-xs text-muted-foreground mt-1.5 text-center">{helperText}</p>
              )}
            </div>
          </aside>

          {/* Description */}
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

      {tab === 'opt-in' && (
        <div className="max-w-2xl">
          {submitted ? (
            <div className="text-center py-12 border rounded-lg border-border">
              <div className="text-4xl mb-3">&#10003;</div>
              <h2 className="text-lg font-semibold mb-1">Opt-In Submitted</h2>
              <p className="text-sm text-muted-foreground mb-6">
                You have opted into this program. You will be notified once matching begins.
              </p>
              <div className="flex gap-2 justify-center">
                <Button variant="outline" onClick={() => router.push('/me/opt-ins')}>
                  View My Opt-Ins
                </Button>
                <Button variant="outline" onClick={() => router.push('/me/programs')}>
                  Browse More Programs
                </Button>
              </div>
            </div>
          ) : (
            <OptInForm
              programId={id}
              onSuccess={() => setSubmitted(true)}
            />
          )}
        </div>
      )}
    </div>
  )
}
