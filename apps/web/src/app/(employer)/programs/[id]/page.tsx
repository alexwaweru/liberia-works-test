'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Loader2, CalendarDays, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useProgram, useProgramMatches } from '@/hooks/programs'
import { OptInForm } from '@/components/domain/programs/opt-in-form'

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function ProgramDetailsPage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()

  const { data: cycle, isLoading, isError } = useProgram(id)
  const { data: matches } = useProgramMatches(id)

  const [optInOpen, setOptInOpen] = useState(false)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (isError || !cycle) {
    return <div className="p-8 text-center">Program not found.</div>
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => router.push('/programs')}>
          Back to List
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">{cycle.name}</h1>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
            {cycle.status}
          </span>
        </div>
        <p className="text-muted-foreground">{cycle.description || 'No description provided.'}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-lg border bg-card">
          <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Start Date</p>
          <p className="font-semibold">{formatDate(cycle.startDate)}</p>
        </div>
        <div className="p-4 rounded-lg border bg-card">
          <p className="text-xs font-medium text-muted-foreground uppercase mb-1">End Date</p>
          <p className="font-semibold">{formatDate(cycle.endDate)}</p>
        </div>
        <div className="p-4 rounded-lg border bg-card">
          <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Program Year</p>
          <p className="font-semibold">{cycle.year}</p>
        </div>
      </div>

      {cycle.status === 'OPEN' && (
        <div className="p-6 rounded-xl border bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-emerald-700 dark:text-emerald-400">Registration is Open!</h3>
            <p className="text-sm text-emerald-600 dark:text-emerald-500">Submit your hosting capacity to participate in this cycle.</p>
          </div>
          <Dialog open={optInOpen} onOpenChange={setOptInOpen}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">Participate Now</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Opt-in to {cycle.name}</DialogTitle>
              </DialogHeader>
              <OptInForm cycleId={id} />
            </DialogContent>
          </Dialog>
        </div>
      )}

      {matches && matches.length > 0 ? (
        <div className="flex flex-col gap-4 mt-4">
          <div className="flex items-center gap-2">
            <Users className="size-5 text-primary" />
            <h2 className="text-xl font-semibold">Matched Job Seekers</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {matches.map((match) => (
              <div key={match.id} className="p-4 rounded-lg border bg-card flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{match.individual.fullName}</p>
                  <span className="text-xs text-muted-foreground">Matched on {formatDate(match.matchDate)}</span>
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
        <div className="p-12 border border-dashed rounded-lg text-center mt-4">
          <Users className="size-8 mx-auto text-muted-foreground mb-3" />
          <h3 className="font-medium text-muted-foreground">No matches detected yet</h3>
          <p className="text-sm text-muted-foreground mt-1">You will be notified once job seekers are matched to your offered slots.</p>
        </div>
      )}
    </div>
  )
}
