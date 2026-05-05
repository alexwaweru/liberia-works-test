'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { usePublicVacancy } from '@/hooks/jobs'
import { useCreateApplication } from '@/hooks/applications'
import { useQuery } from '@tanstack/react-query'
import { getIndividualProfile } from '@/lib/api'
import type { IndividualProfile } from '@/lib/api'
import { FormRunner } from '@/components/ui/form-system/form-runner'
import type { FormDefinition } from '@/components/ui/form-system/types'
import { toast } from '@/lib/toast'

function buildInitialValues(
  definition: FormDefinition,
  profile: IndividualProfile | undefined
): Record<string, unknown> {
  if (!profile) return {}

  const nameParts = (profile.fullName ?? '').trim().split(/\s+/)
  const firstName = nameParts[0] ?? ''
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : ''

  const values: Record<string, unknown> = {}
  for (const section of definition.sections) {
    for (const field of section.fields) {
      const label = field.label.toLowerCase().replace(/[^a-z]/g, '')
      if (label === 'firstname' || label === 'first') {
        values[field.id] = firstName
      } else if (label === 'lastname' || label === 'last' || label === 'surname') {
        values[field.id] = lastName
      } else if (label === 'fullname' || label === 'name') {
        values[field.id] = profile.fullName ?? ''
      } else if (label === 'email' || label === 'emailaddress') {
        values[field.id] = profile.email ?? ''
      } else if (label === 'phone' || label === 'phonenumber' || label === 'mobile' || label === 'telephone') {
        values[field.id] = profile.phoneNumber ?? ''
      }
    }
  }
  return values
}

const TYPE_LABELS: Record<string, string> = {
  PERMANENT: 'Permanent',
  CONTRACT: 'Contract',
  INTERNSHIP: 'Internship',
  VACATION_JOB: 'Vacation Job',
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [tab, setTab] = useState<'overview' | 'application'>('overview')
  const [submitted, setSubmitted] = useState(false)

  const { data: vacancy, isLoading, error } = usePublicVacancy(id)
  const { data: profile } = useQuery({
    queryKey: ['individual', 'profile'],
    queryFn: getIndividualProfile,
    staleTime: 5 * 60 * 1000,
  })
  const apply = useCreateApplication(id)

  async function handleSubmit(responses?: Record<string, unknown>) {
    try {
      await apply.mutateAsync({ responses })
      setSubmitted(true)
      toast.success('Application submitted successfully')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to submit application')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !vacancy) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">Job not found.</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/me/jobs')}>
          Back to Jobs
        </Button>
      </div>
    )
  }

  const applicationForm = vacancy.applicationForm as FormDefinition | null

  return (
    <div className="max-w-4xl mx-auto pb-16">
      {/* Back link */}
      <button
        onClick={() => router.push('/me/jobs')}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="size-4" />
        All Jobs
      </button>

      {/* Title */}
      <h1 className="text-2xl font-semibold mb-1">{vacancy.title}</h1>
      <p className="text-muted-foreground mb-6">{vacancy.companyName}</p>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-border mb-8">
        {(['overview', 'application'] as const).map((t) => (
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
            {t === 'overview' ? 'Overview' : 'Application'}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar - job meta */}
          <aside className="md:w-56 shrink-0 space-y-5">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Type</p>
              <p className="text-sm font-medium">{TYPE_LABELS[vacancy.vacancyType] ?? vacancy.vacancyType}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Slots</p>
              <p className="text-sm font-medium">{vacancy.slotsAvailable}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Deadline</p>
              <p className="text-sm font-medium">{formatDate(vacancy.deadline)}</p>
            </div>
            {vacancy.postedAt && (
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Posted</p>
                <p className="text-sm font-medium">{formatDate(vacancy.postedAt)}</p>
              </div>
            )}
            <Button className="w-full mt-4" onClick={() => setTab('application')}>
              Apply Now
            </Button>
          </aside>

          {/* Description */}
          <div className="flex-1 min-w-0">
            <div
              className="prose prose-sm dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: vacancy.description }}
            />
          </div>
        </div>
      )}

      {tab === 'application' && (
        <div className="max-w-2xl">
          {submitted ? (
            <div className="text-center py-12 border rounded-lg border-border">
              <div className="text-4xl mb-3">&#10003;</div>
              <h2 className="text-lg font-semibold mb-1">Application Submitted</h2>
              <p className="text-sm text-muted-foreground mb-6">
                You will hear back once the employer reviews your application.
              </p>
              <div className="flex gap-2 justify-center">
                <Button variant="outline" onClick={() => router.push('/me/applications')}>
                  View My Applications
                </Button>
                <Button variant="outline" onClick={() => router.push('/me/jobs')}>
                  Browse More Jobs
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Applicant profile summary */}
              {profile && (
                <div className="mb-6 p-4 rounded-lg border border-border bg-muted/30">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Applying as</p>
                  <p className="font-medium text-sm">{profile.fullName ?? 'No name set'}</p>
                  {profile.email && <p className="text-sm text-muted-foreground">{profile.email}</p>}
                  {profile.phoneNumber && <p className="text-sm text-muted-foreground">{profile.phoneNumber}</p>}
                </div>
              )}

              {/* Custom application form OR simple submit */}
              {applicationForm && applicationForm.sections?.length > 0 ? (
                <FormRunner
                  definition={applicationForm}
                  initialValues={buildInitialValues(applicationForm, profile)}
                  onSubmit={handleSubmit}
                />
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Your profile information will be shared with the employer. Click submit to apply.
                  </p>
                  <Button
                    onClick={() => handleSubmit()}
                    disabled={apply.isPending}
                  >
                    {apply.isPending ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
                    Submit Application
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
