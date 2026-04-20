import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'My Applications' }

export default function ApplicationsPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold">My Applications</h1>
      {/* TODO: ApplicationList — status badges (APPLIED, SHORTLISTED, HIRED, etc.), withdraw button */}
    </div>
  )
}
