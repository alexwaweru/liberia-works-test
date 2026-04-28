import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Jobs' }

export default function JobsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">Jobs</h1>
      <p className="text-muted-foreground mt-1">Browse available job listings.</p>
    </div>
  )
}
