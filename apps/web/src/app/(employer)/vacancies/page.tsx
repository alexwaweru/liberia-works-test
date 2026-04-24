'use client'

import Link from 'next/link'
import { Plus, Loader2, Briefcase, Calendar, Users, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useVacancies, usePublishVacancy, useDeleteVacancy } from '@/hooks/vacancies'
import { toast } from '@/lib/toast'
import type { VacancyResponse } from '@/lib/api'

const TYPE_LABELS: Record<string, string> = {
  PERMANENT: 'Permanent',
  CONTRACT: 'Contract',
  INTERNSHIP: 'Internship',
  VACATION_JOB: 'Vacation Job',
}

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  DRAFT: 'secondary',
  ACTIVE: 'default',
  CLOSED: 'outline',
  ARCHIVED: 'destructive',
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  ACTIVE: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  CLOSED: 'bg-muted text-muted-foreground',
  ARCHIVED: 'bg-destructive/10 text-destructive',
}

function formatDeadline(dateStr: string) {
  const date = new Date(dateStr)
  const now = new Date()
  const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  const formatted = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  if (diffDays < 0) return { label: formatted, urgent: false, expired: true }
  if (diffDays <= 7) return { label: `${diffDays}d left`, urgent: true, expired: false }
  return { label: formatted, urgent: false, expired: false }
}

function VacancyCard({
  vacancy,
  onPublish,
  onArchive,
  isPublishing,
  isArchiving,
}: {
  vacancy: VacancyResponse
  onPublish: (id: string) => void
  onArchive: (id: string) => void
  isPublishing: boolean
  isArchiving: boolean
}) {
  const deadline = formatDeadline(vacancy.deadline)
  const statusColorClass = STATUS_COLORS[vacancy.status] ?? STATUS_COLORS.CLOSED

  return (
    <div className="group flex flex-col rounded-xl border border-border bg-card hover:border-border/80 hover:shadow-sm transition-all duration-200">
      <div className="flex flex-col flex-1 p-5">
        {/* Top row: type + status */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {TYPE_LABELS[vacancy.vacancyType] ?? vacancy.vacancyType}
          </span>
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColorClass}`}>
            {vacancy.status.charAt(0) + vacancy.status.slice(1).toLowerCase()}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-base font-semibold text-foreground leading-snug mb-2 line-clamp-2">
          {vacancy.title}
        </h3>

        {/* Description snippet */}
        {vacancy.description && (
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 mb-4">
            {vacancy.description}
          </p>
        )}

        {/* Meta row */}
        <div className="flex items-center gap-4 mt-auto text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Users className="size-3.5 shrink-0" />
            <span>{vacancy.slotsAvailable} {vacancy.slotsAvailable === 1 ? 'slot' : 'slots'}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Calendar className="size-3.5 shrink-0" />
            <span className={deadline.urgent ? 'text-amber-600 dark:text-amber-400 font-medium' : deadline.expired ? 'text-destructive' : ''}>
              {deadline.label}
            </span>
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between gap-2 border-t border-border px-5 py-3">
        <div className="flex items-center gap-2">
          {vacancy.status === 'DRAFT' && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={() => onPublish(vacancy.id)}
              disabled={isPublishing}
            >
              {isPublishing ? <Loader2 className="size-3 animate-spin" /> : 'Publish'}
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => onArchive(vacancy.id)}
            disabled={isArchiving}
          >
            {isArchiving ? <Loader2 className="size-3 animate-spin" /> : 'Archive'}
          </Button>
        </div>
        <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground" asChild>
          <Link href={`/vacancies/${vacancy.id}`}>
            View <ArrowRight className="size-3" />
          </Link>
        </Button>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 rounded-xl border border-dashed border-border text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-muted mb-4">
        <Briefcase className="size-6 text-muted-foreground" />
      </div>
      <h3 className="text-base font-semibold text-foreground mb-1">No vacancies yet</h3>
      <p className="text-sm text-muted-foreground max-w-xs mb-6">
        Post your first vacancy to start attracting qualified candidates.
      </p>
      <Button asChild>
        <Link href="/vacancies/new">
          <Plus className="size-4" />
          New Vacancy
        </Link>
      </Button>
    </div>
  )
}

export default function EmployerVacanciesPage() {
  const { data: vacancies, isLoading } = useVacancies()
  const publish = usePublishVacancy()
  const archive = useDeleteVacancy()

  async function handlePublish(id: string) {
    try {
      await publish.mutateAsync(id)
      toast.success('Vacancy published')
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to publish')
    }
  }

  async function handleArchive(id: string) {
    try {
      await archive.mutateAsync(id)
      toast.success('Vacancy archived')
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to archive')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Vacancies</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage your job postings</p>
        </div>
        <Button asChild>
          <Link href="/vacancies/new">
            <Plus className="size-4" />
            New Vacancy
          </Link>
        </Button>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isLoading && (!vacancies || vacancies.length === 0) && <EmptyState />}

      {!isLoading && vacancies && vacancies.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {vacancies.map((v) => (
            <VacancyCard
              key={v.id}
              vacancy={v}
              onPublish={handlePublish}
              onArchive={handleArchive}
              isPublishing={publish.isPending && publish.variables === v.id}
              isArchiving={archive.isPending && archive.variables === v.id}
            />
          ))}
        </div>
      )}
    </div>
  )
}
