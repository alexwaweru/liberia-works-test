import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Home' }

export default function HomePage() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-20 text-center">
      <h1 className="text-4xl font-bold tracking-tight text-gray-900">
        Connecting Liberians with opportunity
      </h1>
      <p className="mt-4 text-lg text-gray-600">
        Browse thousands of vacancies, build your professional profile, and connect with employers
        across all 15 counties.
      </p>
      {/* TODO: Browse Jobs CTA, stats counters (employers / individuals / vacancies) */}
    </section>
  )
}
