'use client'

import { useState, Suspense } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { toast } from '@/lib/toast'
import { useApplication, useUpdateApplicationStatus } from '@/hooks/applications'
import { useVacancy } from '@/hooks/vacancies'
import type { FormDefinition } from '@/components/ui/form-system/types'

const APPLICATION_STATUS_COLORS: Record<string, string> = {
  APPLIED: 'bg-blue-500/10 text-blue-600',
  SHORTLISTED: 'bg-emerald-500/10 text-emerald-600',
  REJECTED: 'bg-destructive/10 text-destructive',
  WITHDRAWN: 'bg-muted text-muted-foreground',
  HIRED: 'bg-violet-500/10 text-violet-600',
}

const ALL_STATUSES = ['APPLIED', 'SHORTLISTED', 'REJECTED', 'WITHDRAWN', 'HIRED'] as const
type AppStatus = (typeof ALL_STATUSES)[number]

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
      {children}
    </h3>
  )
}

function ApplicationDetailInner() {
  const { id: vacancyId, applicationId } = useParams<{ id: string; applicationId: string }>()
  const { data: application, isLoading } = useApplication(vacancyId, applicationId)
  const { data: vacancy } = useVacancy(vacancyId)
  const updateStatus = useUpdateApplicationStatus(vacancyId)

  const fieldLabels = (() => {
    const form = vacancy?.applicationForm as FormDefinition | null | undefined
    if (!form?.sections) return {} as Record<string, string>
    const map: Record<string, string> = {}
    for (const section of form.sections) {
      for (const field of section.fields) {
        map[field.id] = field.label
      }
    }
    return map
  })()

  const [showStatusForm, setShowStatusForm] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<AppStatus>('APPLIED')
  const [statusNote, setStatusNote] = useState('')

  async function handleStatusSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      await updateStatus.mutateAsync({
        applicationId,
        status: selectedStatus,
        ...(statusNote.trim() ? { statusNote: statusNote.trim() } : {}),
      })
      toast.success('Application status updated')
      setShowStatusForm(false)
      setStatusNote('')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update status')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    )
  }
  if (!application) {
    return <div className="p-4 text-sm text-destructive">Application not found</div>
  }

  const { applicant } = application

  return (
    <div className="flex flex-col">
      <div className="max-w-6xl mx-auto w-full">
        {/* Back button */}
        <Button variant="ghost" size="sm" asChild className="-ml-2 mb-4">
          <Link href={`/vacancies/${vacancyId}?tab=applications`}>
            <ArrowLeft className="size-4 mr-1" /> Back to Applications
          </Link>
        </Button>

        <div className="grid grid-cols-3 gap-6 mt-2">
          {/* Left: responses */}
          <div className="col-span-2">
            <h2 className="text-lg font-semibold mb-4">Application Responses</h2>
            {application.responses && Object.keys(application.responses).length > 0 ? (
              <div className="space-y-4">
                {Object.entries(application.responses).map(([key, value]) => (
                  <div key={key} className="rounded-lg border border-border p-4">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                      {fieldLabels[key] ?? key}
                    </p>
                    <p className="text-sm">{typeof value === 'string' ? value : JSON.stringify(value)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-border p-6 text-center text-sm text-muted-foreground">
                No responses recorded
              </div>
            )}
          </div>

          {/* Right: applicant sidebar */}
          <div className="col-span-1 space-y-5">
            {/* Applicant info */}
            <div className="rounded-lg border border-border p-4 space-y-3">
              <SectionHeading>Applicant</SectionHeading>
              <div className="space-y-1.5">
                <p className="font-medium">{applicant.fullName ?? 'Unknown'}</p>
                {applicant.email && (
                  <p className="text-sm text-muted-foreground">{applicant.email}</p>
                )}
                {applicant.phoneNumber && (
                  <p className="text-sm text-muted-foreground">{applicant.phoneNumber}</p>
                )}
                {applicant.dateOfBirth && (
                  <p className="text-sm text-muted-foreground">
                    DOB: {formatDate(applicant.dateOfBirth)}
                  </p>
                )}
                {applicant.gender && (
                  <p className="text-sm text-muted-foreground capitalize">
                    {applicant.gender.toLowerCase().replace(/_/g, ' ')}
                  </p>
                )}
              </div>
            </div>

            {/* Status */}
            <div className="rounded-lg border border-border p-4 space-y-3">
              <SectionHeading>Status</SectionHeading>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'text-xs px-2 py-0.5 rounded-full font-medium',
                    APPLICATION_STATUS_COLORS[application.status] ?? 'bg-muted text-muted-foreground'
                  )}
                >
                  {application.status.charAt(0) + application.status.slice(1).toLowerCase()}
                </span>
              </div>
              {application.statusNote && (
                <p className="text-xs text-muted-foreground italic">{application.statusNote}</p>
              )}
              {!showStatusForm ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setSelectedStatus(application.status)
                    setShowStatusForm(true)
                  }}
                >
                  Change Status
                </Button>
              ) : (
                <form onSubmit={handleStatusSubmit} className="space-y-3">
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value as AppStatus)}
                    className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm"
                  >
                    {ALL_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s.charAt(0) + s.slice(1).toLowerCase()}
                      </option>
                    ))}
                  </select>
                  <textarea
                    value={statusNote}
                    onChange={(e) => setStatusNote(e.target.value)}
                    placeholder="Optional note..."
                    rows={3}
                    maxLength={1000}
                    className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm resize-none"
                  />
                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      size="sm"
                      className="flex-1"
                      disabled={updateStatus.isPending}
                    >
                      {updateStatus.isPending ? (
                        <Loader2 className="size-3 animate-spin" />
                      ) : (
                        'Confirm'
                      )}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowStatusForm(false)}
                      disabled={updateStatus.isPending}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              )}
            </div>

            {/* Education */}
            {applicant.education.length > 0 && (
              <div className="rounded-lg border border-border p-4 space-y-3">
                <SectionHeading>Education</SectionHeading>
                <div className="space-y-3">
                  {applicant.education.map((ed) => (
                    <div key={ed.id}>
                      <p className="text-sm font-medium">{ed.institutionName}</p>
                      {ed.qualification && (
                        <p className="text-xs text-muted-foreground">{ed.qualification}</p>
                      )}
                      {ed.fieldOfStudy && (
                        <p className="text-xs text-muted-foreground">{ed.fieldOfStudy}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {formatDate(ed.startDate)} –{' '}
                        {ed.isCurrent ? 'Present' : formatDate(ed.endDate)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Work History */}
            {applicant.workHistory.length > 0 && (
              <div className="rounded-lg border border-border p-4 space-y-3">
                <SectionHeading>Work History</SectionHeading>
                <div className="space-y-3">
                  {applicant.workHistory.map((w) => (
                    <div key={w.id}>
                      <p className="text-sm font-medium">{w.title ?? w.employerName}</p>
                      {w.title && (
                        <p className="text-xs text-muted-foreground">{w.employerName}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {formatDate(w.startDate)} –{' '}
                        {w.isCurrent ? 'Present' : formatDate(w.endDate)}
                      </p>
                      {w.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {w.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Skills */}
            {applicant.skills.length > 0 && (
              <div className="rounded-lg border border-border p-4 space-y-3">
                <SectionHeading>Skills</SectionHeading>
                <div className="flex flex-wrap gap-1.5">
                  {applicant.skills.map((s) => (
                    <span
                      key={s.id}
                      className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium"
                    >
                      {s.skillName}
                      {s.proficiency ? ` · ${s.proficiency.toLowerCase()}` : ''}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ApplicationDetailPage() {
  return (
    <Suspense>
      <ApplicationDetailInner />
    </Suspense>
  )
}
