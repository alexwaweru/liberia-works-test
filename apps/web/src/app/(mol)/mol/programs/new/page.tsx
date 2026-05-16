'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RichTextInput } from '@/components/ui/input-fields/richtext'
import { toast } from '@/lib/toast'
import { useCreateProgramCycle } from '@/hooks/programs'

const DEFAULT_PROGRAM_DESCRIPTION = [
  '<h2><strong>About the programme</strong></h2>',
  '<p><em>Brief overview of what this programme cycle is about and who it serves.</em></p>',
  '<h2><strong>Who can participate</strong></h2>',
  '<ul><li><p>Eligibility criteria 1</p></li><li><p>Eligibility criteria 2</p></li><li><p>Eligibility criteria 3</p></li></ul>',
  '<h2><strong>What you\'ll do</strong></h2>',
  '<ul><li><p>Key activity 1</p></li><li><p>Key activity 2</p></li><li><p>Key activity 3</p></li></ul>',
  '<h2><strong>What you\'ll gain</strong></h2>',
  '<ul><li><p>Benefit 1</p></li><li><p>Benefit 2</p></li><li><p>Benefit 3</p></li></ul>',
  '<h2><strong>How matching works</strong></h2>',
  '<p>Brief explanation of the matching process between participants and host employers.</p>',
  '<h2><strong>Timeline</strong></h2>',
  '<p>Important dates and milestones for this cycle.</p>',
].join('')

const PROGRAM_TYPES = [{ value: 'VACATION_JOB', label: 'Vacation Job' }] as const

const PROGRAM_STATUSES = [
  { value: 'PLANNED', label: 'Planned' },
  { value: 'OPEN', label: 'Open' },
  { value: 'MATCHING', label: 'Matching' },
  { value: 'COMPLETED', label: 'Completed' },
] as const

const CURRENT_YEAR = new Date().getFullYear()

export default function MolCreateProgramCyclePage() {
  const router = useRouter()
  const create = useCreateProgramCycle()

  const [name, setName] = useState('')
  const [year, setYear] = useState(CURRENT_YEAR)
  const [type, setType] = useState<'VACATION_JOB'>('VACATION_JOB')
  const [status, setStatus] = useState<'PLANNED' | 'OPEN' | 'MATCHING' | 'COMPLETED'>('PLANNED')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [description, setDescription] = useState(DEFAULT_PROGRAM_DESCRIPTION)
  const [dateError, setDateError] = useState<string | null>(null)

  function validateDates(start: string, end: string): boolean {
    if (start && end && new Date(end) <= new Date(start)) {
      setDateError('End date must be after start date')
      return false
    }
    setDateError(null)
    return true
  }

  function handleStartDateChange(value: string) {
    setStartDate(value)
    if (endDate) validateDates(value, endDate)
  }

  function handleEndDateChange(value: string) {
    setEndDate(value)
    validateDates(startDate, value)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validateDates(startDate, endDate)) return

    try {
      const cycle = await create.mutateAsync({
        name: name.trim(),
        year,
        type,
        status,
        startDate,
        endDate,
        description: description || undefined,
      })
      toast.success('Program created')
      router.push(`/mol/programs/${cycle.id}/edit`)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create program')
    }
  }

  const isSubmitting = create.isPending
  const canSubmit = name.trim() && startDate && endDate && !dateError && !isSubmitting

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
        <h1 className="text-2xl font-semibold">Create Program Cycle</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Name */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">
            Name <span className="text-destructive">*</span>
          </label>
          <Input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Vacation Job Programme Q1 2026"
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
            onChange={(e) => setYear(Number(e.target.value))}
          />
        </div>

        {/* Type + Status row */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Type</label>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
              value={type}
              onChange={(e) => setType(e.target.value as 'VACATION_JOB')}
            >
              {PROGRAM_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Status</label>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
              value={status}
              onChange={(e) => setStatus(e.target.value as typeof status)}
            >
              {PROGRAM_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Start + End Date row */}
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
            onChange={setDescription}
            placeholder="Describe the program cycle, eligibility, and what participants can expect..."
            minHeight="180px"
            helperText="Supports rich text — headings, lists, bold, italic."
          />
        </div>

        <div className="flex gap-3">
          <Button type="submit" disabled={!canSubmit}>
            {isSubmitting && <Loader2 className="size-4 animate-spin mr-2" />}
            Create Program
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/mol/programs">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  )
}
