'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useMyApplications } from '@/hooks/applications'
import { cn } from '@/lib/utils'

const STATUS_LABELS: Record<string, string> = {
  APPLIED: 'Applied',
  SHORTLISTED: 'Shortlisted',
  REJECTED: 'Rejected',
  WITHDRAWN: 'Withdrawn',
  HIRED: 'Hired',
}

const STATUS_COLORS: Record<string, string> = {
  APPLIED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  SHORTLISTED: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  REJECTED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  WITHDRAWN: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  HIRED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function ApplicationsPage() {
  const router = useRouter()
  const [cursor, setCursor] = useState<string | undefined>()
  const [cursorStack, setCursorStack] = useState<string[]>([])

  const { data: page, isLoading } = useMyApplications({ cursor })
  const applications = page?.data ?? []
  const pagination = page?.pagination

  function handleNext() {
    if (!pagination?.nextCursor) return
    setCursorStack((s) => [...s, cursor ?? ''])
    setCursor(pagination.nextCursor)
  }

  function handlePrev() {
    const stack = [...cursorStack]
    const prev = stack.pop()
    setCursorStack(stack)
    setCursor(prev === '' ? undefined : prev)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">My Applications</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Track the status of your job applications</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : applications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border rounded-lg border-border">
          <p className="text-muted-foreground mb-4">No applications yet.</p>
          <Button onClick={() => router.push('/me/jobs')}>Browse Jobs</Button>
        </div>
      ) : (
        <div className="border rounded-lg border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/40">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Job</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Company</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Applied</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => (
                <tr
                  key={app.id}
                  className="border-b border-border last:border-0 hover:bg-muted/20 cursor-pointer transition-colors"
                  onClick={() => router.push(`/me/jobs/${app.vacancyId}`)}
                >
                  <td className="px-4 py-3 font-medium">{app.vacancyTitle}</td>
                  <td className="px-4 py-3 text-muted-foreground">{app.companyName}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(app.appliedAt)}</td>
                  <td className="px-4 py-3">
                    <span className={cn('inline-flex items-center text-xs px-2 py-0.5 rounded-full font-medium', STATUS_COLORS[app.status])}>
                      {STATUS_LABELS[app.status] ?? app.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(pagination?.total ?? 0) > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <p className="text-xs text-muted-foreground">
                {pagination?.total} {pagination?.total === 1 ? 'application' : 'applications'}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handlePrev} disabled={cursorStack.length === 0}>Previous</Button>
                <Button variant="outline" size="sm" onClick={handleNext} disabled={!pagination?.hasMore}>Next</Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
