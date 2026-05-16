import type { Metadata } from 'next'
import { Suspense } from 'react'
import { PublicJobsClient } from './jobs-client'

export const metadata: Metadata = { title: 'Open Positions' }

export default function PublicJobsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground">Open positions</h1>
        <p className="text-base text-muted-foreground mt-2">
          Browse active job listings from employers across all 15 counties of Liberia.
        </p>
      </div>
      <Suspense>
        <PublicJobsClient />
      </Suspense>
    </div>
  )
}
