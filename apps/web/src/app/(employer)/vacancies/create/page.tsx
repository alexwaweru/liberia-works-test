'use client'
import { useReducer, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, Check, Save } from 'lucide-react'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { TextInput } from '@/components/ui/input-fields/text'
import { NumberInput } from '@/components/ui/input-fields/number'
import { SelectInput } from '@/components/ui/input-fields/select'
import { DatePicker } from '@/components/ui/input-fields/date'
import { RichTextInput } from '@/components/ui/input-fields/richtext'
import { VacancyFormBuilder } from '@/components/domain/employer/vacancy-form-builder'
import type { FormDefinition } from '@/components/ui/form-system/types'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'
import { useCreateVacancy } from '@/hooks/vacancies'
import { useQuery } from '@tanstack/react-query'
import { toast } from '@/lib/toast'
import { vacancyFormReducer, initialState, TOTAL_STEPS } from './vacancy-form-reducer'
import type { FormState, Action, VacancyType } from './vacancy-form-reducer'

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

// ── Default description template ──────────────────────────────────────────────

const DEFAULT_DESCRIPTION = [
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
].join('')

// ── Step name labels ──────────────────────────────────────────────────────────

const STEPS = [
  'Basic Info',
  'Location & Sector',
  'Requirements',
  'Screening Questions',
  'Review & Publish',
] as const

// ── Step prop types ───────────────────────────────────────────────────────────

type StepProps = { state: FormState; dispatch: React.Dispatch<Action> }

type StepPropsWithRef = StepProps & {
  states: Array<{ id: number; name: string }>
  sectors: Array<{ id: string; name: string }>
}

// ── Step components ───────────────────────────────────────────────────────────

const TYPE_OPTIONS = [
  { value: 'PERMANENT', label: 'Permanent' },
  { value: 'CONTRACT', label: 'Contract' },
  { value: 'INTERNSHIP', label: 'Internship' },
  { value: 'VACATION_JOB', label: 'Vacation Job' },
]

function StepBasicInfo({ state, dispatch }: StepPropsWithRef) {
  useEffect(() => {
    if (state.description === '') {
      dispatch({ type: 'SET_FIELD', field: 'description', value: DEFAULT_DESCRIPTION })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-5">
      <TextInput
        label="Job title"
        placeholder="e.g. Software Engineer"
        required
        value={state.title}
        onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'title', value: (e.target as HTMLInputElement).value })}
        error={state.isDirty && state.title.trim().length < 3 ? 'Title is required' : undefined}
      />

      <SelectInput
        label="Vacancy type"
        required
        value={state.vacancyType}
        onChange={(val) => dispatch({ type: 'SET_FIELD', field: 'vacancyType', value: val as VacancyType })}
        options={TYPE_OPTIONS}
        placeholder="Select type"
        error={state.isDirty && state.vacancyType === '' ? 'Select a vacancy type' : undefined}
      />

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          Description <span className="text-destructive ml-0.5">*</span>
        </label>
        <RichTextInput
          value={state.description}
          onChange={(html) => dispatch({ type: 'SET_FIELD', field: 'description', value: html })}
          placeholder="Describe the role, responsibilities, and requirements..."
          minHeight="160px"
        />
        {state.isDirty && state.description.trim().length < 10 && (
          <p className="text-sm text-destructive">Description is required</p>
        )}
      </div>
    </div>
  )
}

function StepLocationSector({ state, dispatch, states, sectors }: StepPropsWithRef) {
  const stateOptions = states.map((s) => ({ value: String(s.id), label: s.name }))
  const sectorOptions = [{ value: '__none__', label: 'None' }, ...sectors.map((s) => ({ value: s.id, label: s.name }))]

  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-5">
      <SelectInput
        label="County"
        required
        value={state.stateId !== null ? String(state.stateId) : ''}
        onChange={(val) => dispatch({ type: 'SET_FIELD', field: 'stateId', value: val ? Number(val) : null })}
        options={stateOptions}
        placeholder="Select county"
        error={state.isDirty && state.stateId === null ? 'Select a county' : undefined}
      />

      <SelectInput
        label="Sector (optional)"
        value={state.sectorId}
        onChange={(val) => dispatch({ type: 'SET_FIELD', field: 'sectorId', value: val === '__none__' ? '' : (val as string) })}
        options={sectorOptions}
        placeholder="Select sector (optional)"
      />
    </div>
  )
}

function StepRequirements({ state, dispatch }: StepProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-5">
      <NumberInput
        label="Slots available"
        required
        value={state.slotsAvailable}
        onChange={(val) => dispatch({ type: 'SET_FIELD', field: 'slotsAvailable', value: val ?? 1 })}
        min={1}
        error={state.isDirty && state.slotsAvailable < 1 ? 'At least 1 slot required' : undefined}
      />

      <DatePicker
        label="Application deadline"
        required
        value={state.deadline ? new Date(state.deadline + 'T00:00:00') : undefined}
        onChange={(val) => dispatch({ type: 'SET_FIELD', field: 'deadline', value: val instanceof Date ? format(val, 'yyyy-MM-dd') : '' })}
        fromDate={new Date()}
        error={state.isDirty && state.deadline === '' ? 'Enter a valid date' : undefined}
      />
    </div>
  )
}

function StepScreeningQuestions({ state, dispatch }: StepProps) {
  return (
    <VacancyFormBuilder
      definition={state.applicationForm as unknown as FormDefinition | undefined}
      onChange={(def) => dispatch({ type: 'SET_FIELD', field: 'applicationForm', value: def as unknown as Record<string, unknown> })}
    />
  )
}

function StepReview({ state, states, sectors }: StepPropsWithRef) {
  const stateName = states.find((s) => s.id === state.stateId)?.name ?? '—'
  const sectorName = sectors.find((s) => s.id === state.sectorId)?.name ?? '—'
  const typeLabel = TYPE_OPTIONS.find((o) => o.value === state.vacancyType)?.label ?? '—'
  const descriptionSnippet = state.description.replace(/<[^>]*>/g, '').slice(0, 80)

  const rows: Array<{ label: string; value: string }> = [
    { label: 'Title', value: state.title || '—' },
    { label: 'Type', value: typeLabel },
    { label: 'County', value: stateName },
    { label: 'Sector', value: sectorName },
    { label: 'Slots', value: String(state.slotsAvailable) },
    { label: 'Deadline', value: state.deadline || '—' },
    { label: 'Description', value: descriptionSnippet || '—' },
  ]

  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-5">
      <h2 className="text-base font-semibold text-foreground">Review &amp; Publish</h2>
      <div className="divide-y divide-border">
        {rows.map((row) => (
          <div key={row.label} className="flex justify-between py-3 text-sm">
            <span className="font-medium text-foreground">{row.label}</span>
            <span className="text-muted-foreground text-right max-w-[60%]">{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Stepper ───────────────────────────────────────────────────────────────────

function Stepper({ currentStep }: { currentStep: number }) {
  return (
    <>
      {/* Desktop */}
      <nav className="hidden sm:flex items-center" aria-label="Form steps">
        {STEPS.map((label, i) => {
          const done = i < currentStep
          const active = i === currentStep
          return (
            <div key={label} className="flex items-center">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'flex size-7 items-center justify-center rounded-full text-sm font-semibold shrink-0',
                    active
                      ? 'bg-primary text-primary-foreground'
                      : done
                        ? 'bg-primary/20 text-primary'
                        : 'bg-muted text-muted-foreground',
                  )}
                >
                  {done ? <Check className="size-3.5" /> : i + 1}
                </span>
                <span
                  className={cn(
                    'text-sm font-medium whitespace-nowrap',
                    active ? 'text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && <div className="w-8 h-px bg-border mx-3 shrink-0" />}
            </div>
          )
        })}
      </nav>

      {/* Mobile */}
      <p className="sm:hidden text-sm font-medium text-muted-foreground">
        Step {currentStep + 1} of {TOTAL_STEPS} &mdash; {STEPS[currentStep]}
      </p>
    </>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function CreateVacancyPage() {
  const router = useRouter()
  const [state, dispatch] = useReducer(vacancyFormReducer, initialState)
  const [showExitDialog, setShowExitDialog] = useState(false)
  const [pendingExit, setPendingExit] = useState<(() => void) | null>(null)
  const create = useCreateVacancy()

  const { data: states = [] } = useLiberiaStates()
  const { data: sectors = [] } = useSectors()

  // Warn on browser unload when form is dirty
  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault()
    }
    if (state.isDirty) {
      window.addEventListener('beforeunload', handleBeforeUnload)
    } else {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [state.isDirty])

  function isStepValid(step: number): boolean {
    switch (step) {
      case 0: return state.title.trim().length >= 3 && state.description.trim().length >= 10 && state.vacancyType !== ''
      case 1: return state.stateId !== null
      case 2: return state.slotsAvailable >= 1 && state.deadline !== ''
      case 3: return true
      case 4: return true
      default: return false
    }
  }

  const canProceed = isStepValid(state.currentStep)

  const isLastStep = state.currentStep === TOTAL_STEPS - 1

  function requestExit(onConfirm: () => void) {
    if (state.isDirty) {
      setPendingExit(() => onConfirm)
      setShowExitDialog(true)
    } else {
      onConfirm()
    }
  }

  function handleConfirmExit() {
    setShowExitDialog(false)
    pendingExit?.()
    setPendingExit(null)
  }

  function handleCancelExit() {
    setShowExitDialog(false)
    setPendingExit(null)
  }

  function handleBackNav() {
    requestExit(() => router.push('/vacancies'))
  }

  function handlePrevStep() {
    if (state.currentStep === 0) {
      requestExit(() => router.push('/vacancies'))
    } else {
      dispatch({ type: 'PREV_STEP' })
    }
  }

  async function handleSaveAsDraft() {
    if (!state.title || !state.vacancyType || state.stateId === null || !state.deadline) {
      toast.error('Please complete Basic Info and Location steps before saving as draft')
      return
    }
    try {
      await create.mutateAsync({
        title: state.title,
        description: state.description || ' ',
        vacancyType: state.vacancyType as VacancyType,
        stateId: state.stateId,
        sectorId: state.sectorId || undefined,
        slotsAvailable: state.slotsAvailable,
        deadline: state.deadline,
        applicationForm: state.applicationForm ?? undefined,
      })
      toast.success('Saved as draft')
      dispatch({ type: 'RESET' })
      router.push('/vacancies')
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to save draft')
    }
  }

  async function handlePublish() {
    try {
      await create.mutateAsync({
        title: state.title,
        description: state.description,
        vacancyType: state.vacancyType as VacancyType,
        stateId: state.stateId!,
        sectorId: state.sectorId || undefined,
        slotsAvailable: state.slotsAvailable,
        deadline: state.deadline,
        isMandatoryAdvertised: state.isMandatoryAdvertised,
        applicationForm: state.applicationForm ?? undefined,
      })
      toast.success('Vacancy created')
      dispatch({ type: 'RESET' })
      router.push('/vacancies')
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to create vacancy')
    }
  }

  const stepProps: StepPropsWithRef = { state, dispatch, states, sectors }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Top back button */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground -ml-2"
          onClick={handleBackNav}
        >
          <ArrowLeft className="size-4" />
          Back
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-semibold text-foreground">Create Vacancy</h1>
        <p className="text-sm text-muted-foreground mt-1">Post a job opening for your company</p>
      </div>

      <Stepper currentStep={state.currentStep} />

      {/* Step content */}
      {state.currentStep === 0 && <StepBasicInfo {...stepProps} />}
      {state.currentStep === 1 && <StepLocationSector {...stepProps} />}
      {state.currentStep === 2 && <StepRequirements state={state} dispatch={dispatch} />}
      {state.currentStep === 3 && <StepScreeningQuestions state={state} dispatch={dispatch} />}
      {state.currentStep === 4 && <StepReview {...stepProps} />}

      {/* Navigation footer */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handlePrevStep}
            disabled={false}
          >
            <ArrowLeft className="size-4" />
            Back
          </Button>

          <Button
            variant="ghost"
            onClick={handleSaveAsDraft}
            disabled={create.isPending}
          >
            <Save className="size-4" />
            Save as Draft
          </Button>
        </div>

        {isLastStep ? (
          <Button onClick={handlePublish} disabled={!canProceed || create.isPending}>
            Publish
          </Button>
        ) : (
          <Button
            onClick={() => dispatch({ type: 'NEXT_STEP' })}
            disabled={!canProceed}
          >
            Next
            <ArrowRight className="size-4" />
          </Button>
        )}
      </div>

      {/* Exit confirmation dialog */}
      <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Leave without saving?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. If you leave now, your progress will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelExit}>Stay</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleConfirmExit}>
              Leave
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
