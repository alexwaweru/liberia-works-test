import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Browse Jobs' }

// Server Component — renders vacancy list server-side for low-bandwidth first paint.
// No login required to view vacancies.
export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ state?: string; sector?: string; type?: string; cursor?: string }>
}) {
  const params = await searchParams

  // TODO: fetch vacancies from API (server-side via fetch with cache)
  // const vacancies = await fetchVacancies(params)

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-semibold text-gray-900">Browse Jobs</h1>

      {/* TODO: VacancyFilter component (state, sector, type dropdowns) */}
      {/* TODO: VacancyList + VacancyCard components */}
      {/* TODO: cursor-based pagination */}

      <p className="mt-4 text-sm text-gray-500">
        Filters: state={params.state ?? 'all'}, sector={params.sector ?? 'all'}
      </p>
    </div>
  )
}
