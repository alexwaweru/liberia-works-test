import { redirect } from 'next/navigation'

export default function NewVacancyPage() {
  redirect('/vacancies/create')
}
