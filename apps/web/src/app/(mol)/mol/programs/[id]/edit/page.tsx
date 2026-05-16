'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RichTextInput } from '@/components/ui/input-fields/richtext'
import { toast } from '@/lib/toast'
import { useProgram, useUpdateProgramCycle } from '@/hooks/programs'

const PROGRAM_TYPES = [{ value: 'VACATION_JOB', label: 'Vacation Job' }] as const

const PROGRAM_STATUSES = [
  { value: 'PLANNED', label: 'Planned' },
  { value: 'OPEN', label: 'Open' },
  { value: 'MATCHING', label: 'Matching' },
  { value: 'COMPLETED', label: 'Completed' },
] as const

// Convert ISO date string to YYYY-MM-DD for <input type="date">
function toDateInputValue(dateStr: string): string {
  return dateStr.slice(0, 10)
}

export default function MolEditProgramCyclePage() {
  const { id } = useParams<{ id: string }>()
  const { data: cycle, isLoading, isError, error } = useProgram(id)
  const update = useUpdateProgramCycle(id)

  const [name, setName] = useState('')
  const [year, setYear] = useState(new Date().getFullYear())
  const [type, setType] = useState<'VACATION_JOB'>('VACATION_JOB')
  const [status, setStatus] = useState<'PLANNED' | 'OPEN' | 'MATCHING' | 'COMPLETED'>('PLANNED')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [description, setDescription] = useState('')
  const [isDirty, setIsDirty] = useState(false)
  const [dateError, setDateError] = useState<string | null>(null)

  // Seed local state once the cycle loads; don't re-seed after user edits
  useEffect(() => {
    if (cycle && !isDirty) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional one-shot seed from async data
      setName(cycle.name)
      setYear(cycle.year)
      setType((cycle.type as 'VACATION_JOB') ?? 'VACATION_JOB')
      setStatus((cycle.status as typeof status) ?? 'PLANNED')
      setStartDate(toDateInputValue(cycle.startDate))
      setEndDate(toDateInputValue(cycle.endDate))
      setDescription(cycle.description ?? '')
    }
  }, [cycle, isDirty])

  function markDirty() {
    setIsDirty(true)
  }

  function validateDates(start: string, end: string): boolean {
    if (start && end && new Date(end) <= new Date(start)) {
      setDateError('End date must be after start date')
      return false
    }
    setDateError(null)
    return true
  }

  function handleEndDateChange(value: string) {
    setEndDate(value)
    markDirty()
    validateDates(startDate, value)
  }

  function handleStartDateChange(value: string) {
    setStartDate(value)
    markDirty()
    if (endDate) validateDates(value, endDate)
  }

  async function handleSave() {
    if (!validateDates(startDate, endDate)) return
    try {
      await update.mutateAsync({ name, year, type, status, startDate, endDate, description })
      toast.success('Program updated')
      setIsDirty(false)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save changes')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (isError || !cycle) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
        Failed to load program: {error instanceof Error ? error.message : 'Unknown error'}
      </div>
    )
  }

  const canSave = isDirty && !update.isPending && !dateError

  return (
    <div className="max-w-3xl space-y-6 pb-10">
      <div>
        <Link
          href="/mol/programs"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-3"
        >
          <ArrowLeft className="size-3.5" />
          Back to Programs
        </Link>
        <h1 className="text-2xl font-semibold">Edit Program Cycle</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{cycle.name}</p>
      </div>

      <div className="space-y-5">
        {/* Name */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">
            Name <span className="text-destructive">*</span>
          </label>
          <Input
            required
            value={name}
            onChange={(e) => { setName(e.target.value); markDirty() }}
          />
        </div>

        {/* Year */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">
            Year <span className="text-destructive">*</span>
          </label>
          <Input
            type="number"
            required
            min={2000}
            max={2100}
            value={year}
            onChange={(e) => { setYear(Number(e.target.value)); markDirty() }}
          />
        </div>

        {/* Type + Status */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Type</label>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
              value={type}
              onChange={(e) => { setType(e.target.value as 'VACATION_JOB'); markDirty() }}
            >
              {PROGRAM_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Status</label>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
              value={status}
              onChange={(e) => { setStatus(e.target.value as typeof status); markDirty() }}
            >
              {PROGRAM_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Start + End Date */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Start Date <span className="text-destructive">*</span>
            </label>
            <Input
              type="date"
              required
              value={startDate}
              onChange={(e) => handleStartDateChange(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              End Date <span className="text-destructive">*</span>
            </label>
            <Input
              type="date"
              required
              value={endDate}
              onChange={(e) => handleEndDateChange(e.target.value)}
            />
            {dateError && <p className="text-xs text-destructive">{dateError}</p>}
          </div>
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Description</label>
          <RichTextInput
            value={description}
            onChange={(html) => { setDescription(html); markDirty() }}
            placeholder="Describe the program cycle, eligibility, and what participants can expect..."
            minHeight="200px"
            helperText="Supports rich text — headings, lists, bold, italic."
          />
        </div>

        <Button onClick={handleSave} disabled={!canSave}>
          {update.isPending ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
          Save changes
        </Button>
      </div>
    </div>
  )
}
