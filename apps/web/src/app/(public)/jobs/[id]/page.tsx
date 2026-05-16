import type { Metadata } from 'next'
import { Suspense } from 'react'
import { JobDetailClient } from './job-detail-client'

export const metadata: Metadata = { title: 'Job Detail' }

export default function PublicJobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-8 py-10">
      <Suspense fallback={<JobDetailSkeleton />}>
        <JobDetailClientWrapper params={params} />
      </Suspense>
    </div>
  )
}

async function JobDetailClientWrapper({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <JobDetailClient id={id} />
}

function JobDetailSkeleton() {
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
