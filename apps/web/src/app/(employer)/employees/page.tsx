import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Employees' }

export default function EmployeesPage() {
  return <h1 className="text-2xl font-semibold">Employees</h1>
}
