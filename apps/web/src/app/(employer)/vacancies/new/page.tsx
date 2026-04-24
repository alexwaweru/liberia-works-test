'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { TextInput } from '@/components/ui/input-fields/text'
import { NumberInput } from '@/components/ui/input-fields/number'
import { SelectInput } from '@/components/ui/input-fields/select'
import { DatePicker } from '@/components/ui/input-fields/date'
import { RichTextInput } from '@/components/ui/input-fields/richtext'
import { VacancyFormBuilder } from '@/components/domain/employer/vacancy-form-builder'
import type { FormDefinition } from '@/components/ui/form-system/types'
import { useCreateVacancy } from '@/hooks/vacancies'
import { useQuery } from '@tanstack/react-query'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'

// ── Reference data queries ────────────────────────────────────────────────────

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

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

// ── Form schemas ──────────────────────────────────────────────────────────────

const detailsSchema = z.object({
  title: z.string().min(3, 'Title is required'),
  description: z.string().min(10, 'Description is required'),
  vacancyType: z.enum(['PERMANENT', 'CONTRACT', 'INTERNSHIP', 'VACATION_JOB'], {
    required_error: 'Select a vacancy type',
  }),
  stateId: z.number({ required_error: 'Select a county' }).int(),
  sectorId: z.string().optional(),
  slotsAvailable: z.number().int().min(1, 'At least 1 slot required'),
  deadline: z.date({ required_error: 'Enter a valid date' }),
})

type DetailsForm = z.infer<typeof detailsSchema>

// ── Step indicator ────────────────────────────────────────────────────────────

const STEPS = ['Vacancy Details', 'Application Form'] as const

function StepIndicator({ current }: { current: number }) {
  return (
    <nav className="flex items-center gap-2" aria-label="Form steps">
      {STEPS.map((label, i) => {
        const done = i < current
        const active = i === current
        return (
          <div key={label} className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'flex size-7 items-center justify-center rounded-full text-sm font-semibold',
                  active ? 'bg-primary text-primary-foreground' : done ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground',
                )}
              >
                {done ? <Check className="size-3.5" /> : i + 1}
              </span>
              <span className={cn('text-sm font-medium', active ? 'text-foreground' : 'text-muted-foreground')}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && <div className="w-8 h-px bg-border mx-1" />}
          </div>
        )
      })}
    </nav>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function NewVacancyPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [formDefinition, setFormDefinition] = useState<FormDefinition | undefined>(undefined)

  const { data: states = [] } = useLiberiaStates()
  const { data: sectors = [] } = useSectors()
  const create = useCreateVacancy()

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<DetailsForm>({
    resolver: zodResolver(detailsSchema),
    defaultValues: {
      slotsAvailable: 1,
      description: [
        '<h2><strong>About [Company Name]</strong></h2>',
        '<p><em>Give short description about company here</em></p>',
        '<h2><strong>The position</strong></h2>',
        '<p><em>Talk about what the position entails and what team they will be joining</em></p>',
        '<h2><strong>What this job can offer you</strong></h2>',
        '<p><em>Talk about what the job can offer e.g. growth, meaningful challenges, competitive salary, supportive environment etc etc</em></p>',
        '<ul><li></li></ul>',
        '<h2><strong>What you bring</strong></h2>',
        '<h3><strong>Must have (professional experience):</strong></h3>',
        '<ul><li></li></ul>',
        '<h3><strong>Nice to have</strong></h3>',
        '<ul><li></li></ul>',
        '<h2><strong>Key Responsibilities</strong></h2>',
        '<ul><li></li></ul>',
        '<h2><strong>Interview process</strong></h2>',
        '<ol><li><p>Interview with our Recruiter</p></li><li><p></p></li></ol>',
      ].join(''),
    },
  })

  // Step 1 → Step 2
  function goToFormBuilder(_data: DetailsForm) {
    setStep(1)
  }

  // Final submit
  async function submit() {
    const details = getValues()
    try {
      await create.mutateAsync({
        title: details.title,
        description: details.description,
        vacancyType: details.vacancyType,
        stateId: details.stateId,
        sectorId: details.sectorId || undefined,
        slotsAvailable: details.slotsAvailable,
        deadline: format(details.deadline, 'yyyy-MM-dd'),
        applicationForm: formDefinition ? (formDefinition as unknown as Record<string, unknown>) : undefined,
      })
      toast.success('Vacancy created as draft')
      router.push('/vacancies')
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to create vacancy')
    }
  }

  const typeOptions = [
    { value: 'PERMANENT', label: 'Permanent' },
    { value: 'CONTRACT', label: 'Contract' },
    { value: 'INTERNSHIP', label: 'Internship' },
    { value: 'VACATION_JOB', label: 'Vacation Job' },
  ]

  const stateOptions = states.map((s) => ({ value: String(s.id), label: s.name }))
  const sectorOptions = [{ value: '__none__', label: 'None' }, ...sectors.map((s) => ({ value: s.id, label: s.name }))]

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild className="text-muted-foreground -ml-2">
          <Link href="/vacancies">
            <ArrowLeft className="size-4" />
            Back
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-semibold text-foreground">New Vacancy</h1>
        <p className="text-sm text-muted-foreground mt-1">Create a job posting for your company</p>
      </div>

      <StepIndicator current={step} />

      {/* ── Step 1: Vacancy Details ── */}
      {step === 0 && (
        <form onSubmit={handleSubmit(goToFormBuilder)} className="space-y-5">
          <div className="rounded-xl border border-border bg-card p-6 space-y-5">
            <TextInput
              {...register('title')}
              label="Job title"
              placeholder="e.g. Software Engineer"
              required
              error={errors.title?.message}
            />

            <Controller
              name="vacancyType"
              control={control}
              render={({ field }) => (
                <SelectInput
                  label="Vacancy type"
                  required
                  value={field.value ?? ''}
                  onChange={(val) => field.onChange(val as string)}
                  options={typeOptions}
                  placeholder="Select type"
                  error={errors.vacancyType?.message}
                />
              )}
            />

            <Controller
              name="stateId"
              control={control}
              render={({ field }) => (
                <SelectInput
                  label="County"
                  required
                  value={field.value ? String(field.value) : ''}
                  onChange={(val) => field.onChange(val ? Number(val) : undefined)}
                  options={stateOptions}
                  placeholder="Select county"
                  error={errors.stateId?.message}
                />
              )}
            />

            <Controller
              name="sectorId"
              control={control}
              render={({ field }) => (
                <SelectInput
                  label="Sector"
                  value={field.value ?? ''}
                  onChange={(val) => field.onChange(val === '__none__' ? undefined : (val as string) || undefined)}
                  options={sectorOptions}
                  placeholder="Select sector (optional)"
                />
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <Controller
                name="slotsAvailable"
                control={control}
                render={({ field }) => (
                  <NumberInput
                    label="Slots available"
                    required
                    value={field.value}
                    onChange={(val) => field.onChange(val)}
                    min={1}
                    error={errors.slotsAvailable?.message}
                  />
                )}
              />

              <Controller
                name="deadline"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    label="Application deadline"
                    required
                    value={field.value instanceof Date ? field.value : undefined}
                    onChange={(val) => field.onChange(val instanceof Date ? val : undefined)}
                    fromDate={new Date()}
                    error={errors.deadline?.message}
                  />
                )}
              />
            </div>

                        <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Description <span className="text-destructive ml-0.5">*</span>
              </label>
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <RichTextInput
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    placeholder="Describe the role, responsibilities, and requirements..."
                    minHeight="160px"
                  />
                )}
              />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description.message}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit">
              Next: Application Form
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </form>
      )}

      {/* ── Step 2: Application Form Builder ── */}
      {step === 1 && (
        <div className="space-y-5">
          <VacancyFormBuilder
            definition={formDefinition}
            onChange={setFormDefinition}
          />

          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={() => setStep(0)}>
              <ArrowLeft className="size-4" />
              Back
            </Button>
            <Button
              onClick={submit}
              disabled={create.isPending}
            >
              {create.isPending ? 'Creating...' : 'Create Vacancy'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
