'use client'

import { Suspense } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useVacancy } from '@/hooks/vacancies'
import { VacancyDetailsTab } from './VacancyDetailsTab'
import { ApplicationFormTab } from './ApplicationFormTab'
import { ApplicationsTab } from './ApplicationsTab'

const TABS = [
  { id: 'details', label: 'Vacancy Details' },
  { id: 'application-form', label: 'Application Form' },
  { id: 'applications', label: 'Applications' },
] as const

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-amber-500/10 text-amber-600',
  ACTIVE: 'bg-emerald-500/10 text-emerald-600',
  CLOSED: 'bg-muted text-muted-foreground',
  ARCHIVED: 'bg-destructive/10 text-destructive',
}

function VacancyPageInner() {
  const { id } = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const router = useRouter()
  const activeTab = (searchParams.get('tab') ?? 'details') as 'details' | 'application-form' | 'applications'
  const { data: vacancy, isLoading } = useVacancy(id)

  function setTab(tab: string) {
    router.push(`?tab=${tab}`, { scroll: false })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    )
  }
  if (!vacancy) return <div className="p-4 text-sm text-destructive">Vacancy not found</div>

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <Button variant="ghost" size="sm" asChild className="-ml-2 mt-0.5">
          <Link href="/vacancies">
            <ArrowLeft className="size-4 mr-1" /> Back
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold truncate">{vacancy.title}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span
              className={cn(
                'text-xs px-2 py-0.5 rounded-full font-medium',
                STATUS_COLORS[vacancy.status] ?? 'bg-muted text-muted-foreground'
              )}
            >
              {vacancy.status.charAt(0) + vacancy.status.slice(1).toLowerCase()}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border mb-4">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setTab(tab.id)}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div>
        {activeTab === 'details' && <VacancyDetailsTab vacancy={vacancy} />}
        {activeTab === 'application-form' && <ApplicationFormTab vacancy={vacancy} />}
        {activeTab === 'applications' && <ApplicationsTab vacancyId={id} />}
      </div>
    </div>
  )
}

export default function VacancyDetailPage() {
  return (
    <Suspense>
      <VacancyPageInner />
    </Suspense>
  )
}
