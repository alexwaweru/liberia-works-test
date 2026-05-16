import type { Metadata } from 'next'
import { Suspense } from 'react'
import { PublicProgramsClient } from './programs-client'

export const metadata: Metadata = { title: 'Programs' }

export default function PublicProgramsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground">Programs</h1>
        <p className="text-base text-muted-foreground mt-2">
          Open employment programs managed by the Ministry of Labor — available to job seekers across Liberia.
        </p>
      </div>
      <Suspense>
        <PublicProgramsClient />
      </Suspense>
    </div>
  )
}
