import type { Metadata } from 'next'
import { Suspense } from 'react'
import { ProgramDetailClient } from './program-detail-client'

export const metadata: Metadata = { title: 'Program Detail' }

export default function PublicProgramDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-8 py-10">
      <Suspense fallback={<ProgramDetailSkeleton />}>
        <ProgramDetailClientWrapper params={params} />
      </Suspense>
    </div>
  )
}

async function ProgramDetailClientWrapper({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <ProgramDetailClient id={id} />
}

function ProgramDetailSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-4 bg-muted w-24 mb-6" />
      <div className="h-8 bg-muted w-2/3 mb-2" />
      <div className="h-4 bg-muted w-1/3 mb-6" />
      <div className="h-48 bg-muted w-full" />
    </div>
  )
}
