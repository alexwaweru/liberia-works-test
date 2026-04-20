import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'My Vacancies' }

export default function EmployerVacanciesPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold">Vacancies</h1>
      {/* TODO: VacancyTable (DRAFT/ACTIVE/CLOSED), CreateVacancyButton, PublishAction, MandatoryAdvertisingBadge */}
    </div>
  )
}
