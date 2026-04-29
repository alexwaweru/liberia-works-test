'use client'

import Link from 'next/link'
import { Plus, Loader2, Briefcase, ArrowUpRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useVacancies, usePublishVacancy, useDeleteVacancy } from '@/hooks/vacancies'
import { toast } from '@/lib/toast'
import type { VacancyResponse } from '@/lib/api'

const TYPE_LABELS: Record<string, string> = {
  PERMANENT: 'Permanent',
  CONTRACT: 'Contract',
  INTERNSHIP: 'Internship',
  VACATION_JOB: 'Vacation Job',
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

const AVATAR_COLORS = [
  'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
]

function getInitials(title: string): string {
  const words = title.trim().split(/\s+/)
  if (words.length === 1) return words[0].charAt(0).toUpperCase()
  return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase()
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
  const avatarColor = AVATAR_COLORS[vacancy.id.charCodeAt(0) % 6]
  const initials = getInitials(vacancy.title)

  return (
    <div className="group flex flex-col rounded-xl border border-border bg-card hover:shadow-md hover:border-border/60 transition-all duration-200">
      {/* Top section */}
      <div className="p-5 flex flex-col gap-4 flex-1">
        {/* Header row: avatar + title/type */}
        <div className="flex items-start gap-3">
          <div className={`size-11 rounded-lg font-bold text-sm flex items-center justify-center shrink-0 ${avatarColor}`}>
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-foreground leading-snug line-clamp-2 text-[15px]">
              {vacancy.title}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {TYPE_LABELS[vacancy.vacancyType] ?? vacancy.vacancyType}
            </p>
          </div>
        </div>

        {/* Tags row: status pill + slots pill */}
        <div className="flex flex-wrap gap-1.5 mt-1">
          <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full font-medium ${statusColorClass}`}>
            {vacancy.status.charAt(0) + vacancy.status.slice(1).toLowerCase()}
          </span>
          <span className="bg-muted text-muted-foreground text-xs px-2 py-0.5 rounded-full">
            {vacancy.slotsAvailable} {vacancy.slotsAvailable === 1 ? 'slot' : 'slots'}
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-2 border-t border-border px-5 py-3">
        <span className={`text-xs text-muted-foreground ${deadline.urgent ? 'text-amber-600 dark:text-amber-400 font-medium' : deadline.expired ? 'text-destructive' : ''}`}>
          {deadline.label}
        </span>
        <div className="flex items-center gap-1">
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
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1" asChild>
            <Link href={`/vacancies/${vacancy.id}`}>
              View job <ArrowUpRight className="size-3" />
            </Link>
          </Button>
        </div>
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
        <Link href="/vacancies/create">
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
          <Link href="/vacancies/create">
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
