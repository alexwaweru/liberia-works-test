'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { Loader2, Pencil } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { TextInput } from '@/components/ui/input-fields/text'
import { NumberInput } from '@/components/ui/input-fields/number'
import { SelectInput } from '@/components/ui/input-fields/select'
import { DatePicker } from '@/components/ui/input-fields/date'
import { RichTextInput } from '@/components/ui/input-fields/richtext'
import { toast } from '@/lib/toast'
import { useUpdateVacancy } from '@/hooks/vacancies'
import type { VacancyResponse, UpdateVacancyPayload } from '@/lib/api'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

const TYPE_OPTIONS = [
  { value: 'PERMANENT', label: 'Permanent' },
  { value: 'CONTRACT', label: 'Contract' },
  { value: 'INTERNSHIP', label: 'Internship' },
  { value: 'VACATION_JOB', label: 'Vacation Job' },
]

const TYPE_LABELS: Record<string, string> = {
  PERMANENT: 'Permanent',
  CONTRACT: 'Contract',
  INTERNSHIP: 'Internship',
  VACATION_JOB: 'Vacation Job',
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function MetaCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/40 p-3">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  )
}

function useLiberiaStates() {
  return useQuery({
    queryKey: ['reference', 'states', 'LR'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/v1/reference/states?countryCode=LR`, { credentials: 'include' })
      if (!res.ok) throw new Error('Failed to load counties')
      return res.json() as Promise<Array<{ id: number; name: string }>>
    },
    staleTime: Infinity,
  })
}

function useSectors() {
  return useQuery({
    queryKey: ['reference', 'sectors'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/v1/reference/sectors`, { credentials: 'include' })
      if (!res.ok) throw new Error('Failed to load sectors')
      return res.json() as Promise<Array<{ id: string; name: string }>>
    },
    staleTime: Infinity,
  })
}

type EditState = {
  title: string
  description: string
  vacancyType: string
  stateId: number | null
  sectorId: string
  slotsAvailable: number
  deadline: string
}

function EditForm({
  vacancy,
  onSave,
  onCancel,
}: {
  vacancy: VacancyResponse
  onSave: (data: EditState) => Promise<void>
  onCancel: () => void
}) {
  const [form, setForm] = useState<EditState>({
    title: vacancy.title,
    description: vacancy.description,
    vacancyType: vacancy.vacancyType,
    stateId: vacancy.stateId,
    sectorId: vacancy.sectorId ?? '',
    slotsAvailable: vacancy.slotsAvailable,
    deadline: vacancy.deadline,
  })
  const [saving, setSaving] = useState(false)
  const [isDirty, setIsDirty] = useState(false)

  const { data: states = [] } = useLiberiaStates()
  const { data: sectors = [] } = useSectors()

  // Clear orphaned sectorId when sectors load (FK would fail if we sent a stale UUID)
  useEffect(() => {
    if (sectors.length > 0 && form.sectorId !== '' && !sectors.some((s) => s.id === form.sectorId)) {
      setForm((prev) => ({ ...prev, sectorId: '' }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectors])

  const stateOptions = states.map((s) => ({ value: String(s.id), label: s.name }))
  const sectorOptions = [
    { value: '__none__', label: 'None' },
    ...sectors.map((s) => ({ value: s.id, label: s.name })),
  ]

  function set<K extends keyof EditState>(field: K, value: EditState[K]) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setIsDirty(true)
  }

  function isValid(): boolean {
    return (
      form.title.trim().length >= 3 &&
      form.description.trim().length >= 10 &&
      form.vacancyType !== '' &&
      form.stateId !== null &&
      form.slotsAvailable >= 1 &&
      form.deadline !== ''
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsDirty(true)
    if (!isValid()) return
    setSaving(true)
    try {
      await onSave(form)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-3xl pb-10">
      <TextInput
        label="Job title"
        required
        value={form.title}
        onChange={(e) => set('title', (e.target as HTMLInputElement).value)}
        error={isDirty && form.title.trim().length < 3 ? 'Title is required' : undefined}
      />

      <SelectInput
        label="Vacancy type"
        required
        value={form.vacancyType}
        onChange={(val) => set('vacancyType', val as string)}
        options={TYPE_OPTIONS}
      />

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          Description <span className="text-destructive ml-0.5">*</span>
        </label>
        <RichTextInput
          value={form.description}
          onChange={(html) => set('description', html)}
          placeholder="Describe the role, responsibilities, and requirements..."
          minHeight="160px"
        />
        {isDirty && form.description.trim().length < 10 && (
          <p className="text-sm text-destructive">Description is required</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <SelectInput
          label="County"
          required
          value={form.stateId !== null ? String(form.stateId) : ''}
          onChange={(val) => set('stateId', val ? Number(val) : null)}
          options={stateOptions}
          placeholder="Select county"
          error={isDirty && form.stateId === null ? 'Select a county' : undefined}
        />
        <SelectInput
          label="Sector (optional)"
          value={form.sectorId || '__none__'}
          onChange={(val) => set('sectorId', val === '__none__' ? '' : (val as string))}
          options={sectorOptions}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <NumberInput
          label="Slots available"
          required
          value={form.slotsAvailable}
          onChange={(val) => set('slotsAvailable', val ?? 1)}
          min={1}
          error={isDirty && form.slotsAvailable < 1 ? 'At least 1 slot required' : undefined}
        />
        <DatePicker
          label="Application deadline"
          required
          value={form.deadline ? new Date(form.deadline + 'T00:00:00') : undefined}
          onChange={(val) => set('deadline', val instanceof Date ? format(val, 'yyyy-MM-dd') : '')}
          fromDate={new Date()}
          error={isDirty && form.deadline === '' ? 'Enter a valid date' : undefined}
        />
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={saving}>
          {saving ? <Loader2 className="size-4 animate-spin" /> : 'Save changes'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
      </div>
    </form>
  )
}

export function VacancyDetailsTab({ vacancy }: { vacancy: VacancyResponse }) {
  const [isEditing, setIsEditing] = useState(false)
  const update = useUpdateVacancy(vacancy.id)

  async function handleSave(data: EditState) {
    const payload: UpdateVacancyPayload = {
      title: data.title,
      description: data.description,
      vacancyType: data.vacancyType as 'VACATION_JOB' | 'PERMANENT' | 'CONTRACT' | 'INTERNSHIP',
      stateId: data.stateId!,
      sectorId: data.sectorId || undefined,
      slotsAvailable: data.slotsAvailable,
      deadline: data.deadline,
    }
    try {
      await update.mutateAsync(payload)
      toast.success('Vacancy updated')
      setIsEditing(false)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save changes')
      throw err
    }
  }

  if (isEditing) {
    return (
      <EditForm vacancy={vacancy} onSave={handleSave} onCancel={() => setIsEditing(false)} />
    )
  }

  return (
    <div className="max-w-3xl space-y-6 pb-10">
      {vacancy.status === 'DRAFT' && (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
            <Pencil className="size-3.5 mr-1.5" /> Edit
          </Button>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <MetaCard label="Type" value={TYPE_LABELS[vacancy.vacancyType] ?? vacancy.vacancyType} />
        <MetaCard label="Slots" value={String(vacancy.slotsAvailable)} />
        <MetaCard label="Deadline" value={formatDate(vacancy.deadline)} />
        <MetaCard label="Posted" value={vacancy.postedAt ? formatDate(vacancy.postedAt) : 'Not posted'} />
      </div>

      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Description
        </h2>
        <div
          className="prose prose-sm dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: vacancy.description }}
        />
      </div>
    </div>
  )
}
