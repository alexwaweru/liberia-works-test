'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePublicVacancy } from '@/hooks/public'
import { useAuthStore } from '@/stores/auth-store'
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

function ApplyButton({ vacancyId }: { vacancyId: string }) {
  const user = useAuthStore((s) => s.user)

  if (!user) {
    return (
      <Button asChild className="w-full">
        <Link href={`/auth/login?next=${encodeURIComponent(`/me/jobs/${vacancyId}`)}`}>
          Sign in to apply
        </Link>
      </Button>
    )
  }

  if (user.role === 'INDIVIDUAL') {
    return (
      <Button asChild className="w-full">
        <Link href={`/me/jobs/${vacancyId}`}>Apply now</Link>
      </Button>
    )
  }

  return (
    <Button disabled className="w-full opacity-60 cursor-not-allowed">
      Only job seekers can apply
    </Button>
  )
}

export function JobDetailClient({ id }: { id: string }) {
  const { data: vacancy, isLoading, error } = usePublicVacancy(id)

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-muted w-24 mb-6" />
        <div className="h-8 bg-muted w-2/3 mb-2" />
        <div className="h-4 bg-muted w-1/3 mb-6" />
        <div className="flex gap-2 mb-8">
          <div className="h-6 bg-muted w-24" />
          <div className="h-6 bg-muted w-20" />
        </div>
        <div className="h-64 bg-muted w-full" />
      </div>
    )
  }

  if (error || !vacancy) {
    return (
      <div className="py-16 text-center border border-border bg-card">
        <p className="text-foreground font-semibold mb-1">Position not available</p>
        <p className="text-sm text-muted-foreground mb-4">
          This position may have closed or been removed.
        </p>
        <Button asChild variant="outline">
          <Link href="/jobs">Browse all positions</Link>
        </Button>
      </div>
    )
  }

  return (
    <div>
      <Link
        href="/jobs"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="size-4" />
        All positions
      </Link>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Main content */}
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight">
            {vacancy.title}
          </h1>
          <p className="text-muted-foreground mt-1 text-base">{vacancy.companyName}</p>

          <div className="flex flex-wrap gap-2 mt-4">
            <span
              className={cn(
                'text-xs px-2 py-0.5 font-medium',
                TYPE_COLORS[vacancy.vacancyType] ?? 'bg-muted text-muted-foreground'
              )}
            >
              {TYPE_LABELS[vacancy.vacancyType] ?? vacancy.vacancyType}
            </span>
            <span className="bg-muted text-muted-foreground text-xs px-2 py-0.5">
              Deadline: {formatDate(vacancy.deadline)}
            </span>
          </div>

          <div className="mt-8 border-t border-border pt-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-4">
              Description
            </h2>
            <div
              className="prose prose-sm dark:prose-invert max-w-none text-foreground"
              dangerouslySetInnerHTML={{ __html: vacancy.description }}
            />
          </div>
        </div>

        {/* Sidebar */}
        <aside className="md:w-56 shrink-0">
          <div className="border border-border bg-card p-5 space-y-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Slots available</p>
              <p className="text-sm font-medium text-foreground">{vacancy.slotsAvailable}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Deadline</p>
              <p className="text-sm font-medium text-foreground">{formatDate(vacancy.deadline)}</p>
            </div>
            {vacancy.postedAt && (
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Posted</p>
                <p className="text-sm font-medium text-foreground">{formatDate(vacancy.postedAt)}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Applications</p>
              <p className="text-sm font-medium text-foreground">{vacancy.applicationsCount}</p>
            </div>

            <div className="pt-2">
              <ApplyButton vacancyId={vacancy.id} />
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
