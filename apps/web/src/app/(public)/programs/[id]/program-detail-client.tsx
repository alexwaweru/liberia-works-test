'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePublicProgramCycle } from '@/hooks/public'
import { useAuthStore } from '@/stores/auth-store'

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function OptInButton({ cycleId }: { cycleId: string }) {
  const user = useAuthStore((s) => s.user)

  if (!user) {
    return (
      <Button asChild className="w-full">
        <Link href={`/auth/login?next=${encodeURIComponent(`/me/programs?cycle=${cycleId}`)}`}>
          Sign in to opt in
        </Link>
      </Button>
    )
  }

  if (user.role === 'INDIVIDUAL') {
    return (
      <Button asChild className="w-full">
        <Link href={`/me/programs?cycle=${cycleId}`}>Opt in</Link>
      </Button>
    )
  }

  return (
    <Button disabled className="w-full opacity-60 cursor-not-allowed">
      Only job seekers can opt in
    </Button>
  )
}

export function ProgramDetailClient({ id }: { id: string }) {
  const { data: cycle, isLoading, error } = usePublicProgramCycle(id)

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-muted w-24 mb-6" />
        <div className="h-8 bg-muted w-2/3 mb-2" />
        <div className="h-4 bg-muted w-1/3 mb-6" />
        <div className="h-48 bg-muted w-full" />
      </div>
    )
  }

  if (error || !cycle) {
    return (
      <div className="py-16 text-center border border-border bg-card">
        <p className="text-foreground font-semibold mb-1">Program not available</p>
        <p className="text-sm text-muted-foreground mb-4">
          This program may have closed or been removed.
        </p>
        <Button asChild variant="outline">
          <Link href="/programs">Browse all programs</Link>
        </Button>
      </div>
    )
  }

  return (
    <div>
      <Link
        href="/programs"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="size-4" />
        All programs
      </Link>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Main content */}
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight">
            {cycle.name}
          </h1>

          <div className="flex flex-wrap gap-2 mt-3">
            <span className="text-xs px-2 py-0.5 bg-emerald-500/10 text-emerald-600 font-medium">
              Open
            </span>
            {cycle.type && (
              <span className="bg-muted text-muted-foreground text-xs px-2 py-0.5">
                {cycle.type.replace(/_/g, ' ')}
              </span>
            )}
            {cycle.year && (
              <span className="bg-muted text-muted-foreground text-xs px-2 py-0.5">
                {cycle.year}
              </span>
            )}
          </div>

          {cycle.description && (
            <div className="mt-8 border-t border-border pt-6">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-4">
                About this program
              </h2>
              <div
                className="prose prose-sm dark:prose-invert max-w-none text-foreground"
                dangerouslySetInnerHTML={{ __html: cycle.description }}
              />
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="md:w-56 shrink-0">
          <div className="border border-border bg-card p-5 space-y-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Opens</p>
              <p className="text-sm font-medium text-foreground">{formatDate(cycle.openAt)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Closes</p>
              <p className="text-sm font-medium text-foreground">{formatDate(cycle.closeAt)}</p>
            </div>
            {cycle.type && (
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Type</p>
                <p className="text-sm font-medium text-foreground">{cycle.type.replace(/_/g, ' ')}</p>
              </div>
            )}
            {cycle.year && (
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Year</p>
                <p className="text-sm font-medium text-foreground">{cycle.year}</p>
              </div>
            )}
            <div className="pt-2">
              <OptInButton cycleId={cycle.id} />
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
