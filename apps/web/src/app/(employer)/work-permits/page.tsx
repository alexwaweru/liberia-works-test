import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Work Permits' }

export default function WorkPermitsPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold">Work Permit Applications</h1>
      {/* TODO: PermitList, NewPermitButton, MandatoryAdvertisingGate (shows 409 flow if no qualifying vacancy) */}
    </div>
  )
}
