'use client'

import { Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { cn } from '@/lib/utils'
import { toast } from '@/lib/toast'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Spinner } from '@/components/ui/spinner'
import {
  TextInput,
  PasswordInput,
  SelectInput,
  DatePicker,
  TextareaInput,
} from '@/components/ui/input-fields'
import {
  getIndividualProfile,
  updateIndividualProfile,
  getEducation,
  addEducation,
  deleteEducation,
  getWorkHistory,
  addWorkHistory,
  deleteWorkHistory,
  updateAddress,
  changePassword,
  getSessions,
  revokeSession,
  type EducationRecord,
  type WorkHistoryRecord,
  type SessionItem,
} from '@/lib/api'
import { api } from '@/api/client'
import { TrashIcon, PlusIcon, MonitorIcon, ShieldAlertIcon } from 'lucide-react'
import { useState, useEffect } from 'react'

// ── Tab config ────────────────────────────────────────────────────────────────

const TABS = ['general', 'education', 'experience', 'address', 'security', 'documents'] as const
type Tab = (typeof TABS)[number]

const TAB_LABELS: Record<Tab, string> = {
  general: 'General',
  education: 'Education',
  experience: 'Experience',
  address: 'Address',
  security: 'Security',
  documents: 'Documents',
}

// ── Query keys ────────────────────────────────────────────────────────────────

const profileKeys = {
  me: ['individual', 'me'] as const,
  education: ['individual', 'education'] as const,
  workHistory: ['individual', 'work-history'] as const,
}

// ── General tab ───────────────────────────────────────────────────────────────

const generalSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  dateOfBirth: z.date().optional(),
  gender: z.string().optional(),
  nin: z.string().optional(),
})
type GeneralForm = z.infer<typeof generalSchema>

function toGeneralValues(profile: { fullName: string | null; dateOfBirth: string | null; gender: string | null; nin: string | null }): GeneralForm {
  return {
    fullName: profile.fullName ?? '',
    dateOfBirth: profile.dateOfBirth ? new Date(profile.dateOfBirth) : undefined,
    gender: profile.gender?.toLowerCase() === 'prefer_not_to_say' ? 'unspecified' : (profile.gender?.toLowerCase() ?? ''),
    nin: profile.nin ?? '',
  }
}

function GeneralTab() {
  const qc = useQueryClient()
  const { data: profile, isLoading } = useQuery({
    queryKey: profileKeys.me,
    queryFn: getIndividualProfile,
    refetchOnWindowFocus: false,
  })

  const { control, handleSubmit, formState: { errors } } = useForm<GeneralForm>({
    resolver: zodResolver(generalSchema),
    values: profile ? toGeneralValues(profile) : undefined,
  })

  const mutation = useMutation({
    mutationFn: (data: GeneralForm) =>
      updateIndividualProfile({
        fullName: data.fullName,
        dateOfBirth: data.dateOfBirth ? data.dateOfBirth.toISOString().split('T')[0] : undefined,
        gender: data.gender || undefined,
        nin: data.nin || undefined,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: profileKeys.me })
      toast.success('Profile updated')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  if (isLoading) return <div className="flex justify-center py-12"><Spinner /></div>

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-6 max-w-lg">
      <Controller
        name="fullName"
        control={control}
        render={({ field }) => (
          <TextInput
            label="Full name"
            required
            error={errors.fullName?.message}
            {...field}
          />
        )}
      />
      <Controller
        name="dateOfBirth"
        control={control}
        render={({ field }) => (
          <DatePicker
            label="Date of birth"
            mode="single"
            value={field.value}
            onChange={(v) => field.onChange(v instanceof Date ? v : undefined)}
            toDate={new Date()}
          />
        )}
      />
      <Controller
        name="gender"
        control={control}
        render={({ field }) => (
          <SelectInput
            label="Gender"
            options={[
              { value: 'male', label: 'Male' },
              { value: 'female', label: 'Female' },
              { value: 'unspecified', label: 'Prefer not to say' },
            ]}
            value={field.value}
            onChange={(v) => field.onChange(v as string)}
            placeholder="Select gender"
          />
        )}
      />
      <Controller
        name="nin"
        control={control}
        render={({ field }) => (
          <TextInput
            label="National ID Number"
            error={errors.nin?.message}
            {...field}
          />
        )}
      />
      <Button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? 'Saving...' : 'Save changes'}
      </Button>
    </form>
  )
}

// ── Education tab ─────────────────────────────────────────────────────────────

const educationSchema = z.object({
  institutionName: z.string().min(1, 'Institution name is required'),
  qualification: z.string().optional(),
  fieldOfStudy: z.string().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  isCurrent: z.boolean().optional(),
})
type EducationForm = z.infer<typeof educationSchema>

function EducationCard({ record, onDelete }: { record: EducationRecord; onDelete: () => void }) {
  return (
    <div className="border border-border rounded-lg p-4 flex items-start justify-between gap-4">
      <div className="space-y-0.5">
        <p className="font-medium text-sm">{record.institutionName}</p>
        {record.qualification && <p className="text-sm text-muted-foreground">{record.qualification}</p>}
        {record.fieldOfStudy && <p className="text-sm text-muted-foreground">{record.fieldOfStudy}</p>}
        <p className="text-xs text-muted-foreground">
          {record.startDate ?? 'Unknown'} — {record.isCurrent ? 'Present' : (record.endDate ?? 'Unknown')}
        </p>
      </div>
      <Button variant="ghost" size="icon" onClick={onDelete} className="text-destructive shrink-0">
        <TrashIcon className="size-4" />
      </Button>
    </div>
  )
}

function EducationTab() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)

  const { data: records = [], isLoading } = useQuery({
    queryKey: profileKeys.education,
    queryFn: getEducation,
  })

  const deleteMutation = useMutation({
    mutationFn: deleteEducation,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: profileKeys.education })
      toast.success('Education record deleted')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const { control, handleSubmit, reset, formState: { errors }, watch, setValue } = useForm<EducationForm>({
    resolver: zodResolver(educationSchema),
    defaultValues: { isCurrent: false },
  })
  const isCurrent = watch('isCurrent')

  const addMutation = useMutation({
    mutationFn: (data: EducationForm) =>
      addEducation({
        institutionName: data.institutionName,
        qualification: data.qualification || undefined,
        fieldOfStudy: data.fieldOfStudy || undefined,
        startDate: data.startDate ? data.startDate.toISOString().split('T')[0] : undefined,
        endDate: data.endDate ? data.endDate.toISOString().split('T')[0] : undefined,
        isCurrent: data.isCurrent,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: profileKeys.education })
      toast.success('Education added')
      reset()
      setShowForm(false)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  if (isLoading) return <div className="flex justify-center py-12"><Spinner /></div>

  return (
    <div className="space-y-4 max-w-lg">
      {records.length === 0 && !showForm && (
        <p className="text-sm text-muted-foreground">No education records yet.</p>
      )}
      {records.map((r) => (
        <EducationCard
          key={r.id}
          record={r}
          onDelete={() => deleteMutation.mutate(r.id)}
        />
      ))}

      {showForm ? (
        <form onSubmit={handleSubmit((d) => addMutation.mutate(d))} className="border border-border rounded-lg p-4 space-y-4">
          <p className="font-medium text-sm">Add Education</p>
          <Controller
            name="institutionName"
            control={control}
            render={({ field }) => (
              <TextInput
                label="Institution name"
                required
                error={errors.institutionName?.message}
                {...field}
              />
            )}
          />
          <Controller
            name="qualification"
            control={control}
            render={({ field }) => (
              <TextInput label="Qualification" {...field} />
            )}
          />
          <Controller
            name="fieldOfStudy"
            control={control}
            render={({ field }) => (
              <TextInput label="Field of study" {...field} />
            )}
          />
          <Controller
            name="startDate"
            control={control}
            render={({ field }) => (
              <DatePicker
                label="Start date"
                mode="single"
                value={field.value}
                onChange={(v) => field.onChange(v instanceof Date ? v : undefined)}
              />
            )}
          />
          {!isCurrent && (
            <Controller
              name="endDate"
              control={control}
              render={({ field }) => (
                <DatePicker
                  label="End date"
                  mode="single"
                  value={field.value}
                  onChange={(v) => field.onChange(v instanceof Date ? v : undefined)}
                />
              )}
            />
          )}
          <div className="flex items-center gap-2">
            <Checkbox
              id="edu-current"
              checked={isCurrent}
              onCheckedChange={(v) => setValue('isCurrent', !!v)}
            />
            <label htmlFor="edu-current" className="text-sm">Currently studying here</label>
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={addMutation.isPending}>
              {addMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
            <Button type="button" variant="ghost" onClick={() => { reset(); setShowForm(false) }}>
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <Button variant="outline" onClick={() => setShowForm(true)}>
          <PlusIcon className="size-4 mr-1" />
          Add Education
        </Button>
      )}
    </div>
  )
}

// ── Experience tab ────────────────────────────────────────────────────────────

const experienceSchema = z.object({
  employerName: z.string().min(1, 'Employer name is required'),
  title: z.string().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  isCurrent: z.boolean().optional(),
  description: z.string().optional(),
})
type ExperienceForm = z.infer<typeof experienceSchema>

function WorkHistoryCard({ record, onDelete }: { record: WorkHistoryRecord; onDelete: () => void }) {
  return (
    <div className="border border-border rounded-lg p-4 flex items-start justify-between gap-4">
      <div className="space-y-0.5">
        <p className="font-medium text-sm">{record.employerName}</p>
        {record.title && <p className="text-sm text-muted-foreground">{record.title}</p>}
        <p className="text-xs text-muted-foreground">
          {record.startDate ?? 'Unknown'} — {record.isCurrent ? 'Present' : (record.endDate ?? 'Unknown')}
        </p>
        {record.description && (
          <p className="text-sm text-muted-foreground mt-1">{record.description}</p>
        )}
      </div>
      <Button variant="ghost" size="icon" onClick={onDelete} className="text-destructive shrink-0">
        <TrashIcon className="size-4" />
      </Button>
    </div>
  )
}

function ExperienceTab() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)

  const { data: records = [], isLoading } = useQuery({
    queryKey: profileKeys.workHistory,
    queryFn: getWorkHistory,
  })

  const deleteMutation = useMutation({
    mutationFn: deleteWorkHistory,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: profileKeys.workHistory })
      toast.success('Work history deleted')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const { control, handleSubmit, reset, formState: { errors }, watch, setValue } = useForm<ExperienceForm>({
    resolver: zodResolver(experienceSchema),
    defaultValues: { isCurrent: false },
  })
  const isCurrent = watch('isCurrent')

  const addMutation = useMutation({
    mutationFn: (data: ExperienceForm) =>
      addWorkHistory({
        employerName: data.employerName,
        title: data.title || undefined,
        startDate: data.startDate ? data.startDate.toISOString().split('T')[0] : undefined,
        endDate: data.endDate ? data.endDate.toISOString().split('T')[0] : undefined,
        isCurrent: data.isCurrent,
        description: data.description || undefined,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: profileKeys.workHistory })
      toast.success('Work history added')
      reset()
      setShowForm(false)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  if (isLoading) return <div className="flex justify-center py-12"><Spinner /></div>

  return (
    <div className="space-y-4 max-w-lg">
      {records.length === 0 && !showForm && (
        <p className="text-sm text-muted-foreground">No work history yet.</p>
      )}
      {records.map((r) => (
        <WorkHistoryCard
          key={r.id}
          record={r}
          onDelete={() => deleteMutation.mutate(r.id)}
        />
      ))}

      {showForm ? (
        <form onSubmit={handleSubmit((d) => addMutation.mutate(d))} className="border border-border rounded-lg p-4 space-y-4">
          <p className="font-medium text-sm">Add Experience</p>
          <Controller
            name="employerName"
            control={control}
            render={({ field }) => (
              <TextInput
                label="Employer name"
                required
                error={errors.employerName?.message}
                {...field}
              />
            )}
          />
          <Controller
            name="title"
            control={control}
            render={({ field }) => (
              <TextInput label="Job title" {...field} />
            )}
          />
          <Controller
            name="startDate"
            control={control}
            render={({ field }) => (
              <DatePicker
                label="Start date"
                mode="single"
                value={field.value}
                onChange={(v) => field.onChange(v instanceof Date ? v : undefined)}
              />
            )}
          />
          {!isCurrent && (
            <Controller
              name="endDate"
              control={control}
              render={({ field }) => (
                <DatePicker
                  label="End date"
                  mode="single"
                  value={field.value}
                  onChange={(v) => field.onChange(v instanceof Date ? v : undefined)}
                />
              )}
            />
          )}
          <div className="flex items-center gap-2">
            <Checkbox
              id="exp-current"
              checked={isCurrent}
              onCheckedChange={(v) => setValue('isCurrent', !!v)}
            />
            <label htmlFor="exp-current" className="text-sm">Currently working here</label>
          </div>
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <TextareaInput label="Description" rows={3} {...field} />
            )}
          />
          <div className="flex gap-2">
            <Button type="submit" disabled={addMutation.isPending}>
              {addMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
            <Button type="button" variant="ghost" onClick={() => { reset(); setShowForm(false) }}>
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <Button variant="outline" onClick={() => setShowForm(true)}>
          <PlusIcon className="size-4 mr-1" />
          Add Experience
        </Button>
      )}
    </div>
  )
}

// ── Address tab ───────────────────────────────────────────────────────────────

type RefItem = { id: number; name: string }

const addressSchema = z.object({
  countryId: z.string().optional(),
  stateId: z.string().optional(),
  cityId: z.string().optional(),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
})
type AddressForm = z.infer<typeof addressSchema>

function AddressTab() {
  const qc = useQueryClient()
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: profileKeys.me,
    queryFn: getIndividualProfile,
  })

  const { control, handleSubmit, watch, setValue } = useForm<AddressForm>({
    values: profile?.address
      ? {
          countryId: profile.address.countryId ? String(profile.address.countryId) : '',
          stateId: profile.address.stateId ? String(profile.address.stateId) : '',
          cityId: profile.address.cityId ? String(profile.address.cityId) : '',
          addressLine1: profile.address.addressLine1 ?? '',
          addressLine2: profile.address.addressLine2 ?? '',
        }
      : undefined,
  })

  const selectedCountryId = watch('countryId')
  const selectedStateId = watch('stateId')

  const { data: countries = [], isLoading: countriesLoading } = useQuery({
    queryKey: ['reference', 'countries'],
    queryFn: () => api.get<RefItem[]>('/api/v1/reference/countries'),
  })

  const { data: states = [], isLoading: statesLoading } = useQuery({
    queryKey: ['reference', 'states', selectedCountryId],
    queryFn: () => api.get<RefItem[]>(`/api/v1/reference/states?countryId=${selectedCountryId}`),
    enabled: !!selectedCountryId,
  })

  const { data: cities = [], isLoading: citiesLoading } = useQuery({
    queryKey: ['reference', 'cities', selectedStateId],
    queryFn: () => api.get<RefItem[]>(`/api/v1/reference/cities?stateId=${selectedStateId}`),
    enabled: !!selectedStateId,
  })

  const mutation = useMutation({
    mutationFn: (data: AddressForm) =>
      updateAddress({
        countryId: data.countryId ? Number(data.countryId) : undefined,
        stateId: data.stateId ? Number(data.stateId) : undefined,
        cityId: data.cityId ? Number(data.cityId) : undefined,
        addressLine1: data.addressLine1 || undefined,
        addressLine2: data.addressLine2 || undefined,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: profileKeys.me })
      toast.success('Address updated')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  if (profileLoading) return <div className="flex justify-center py-12"><Spinner /></div>

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-6 max-w-lg">
      <Controller
        name="addressLine1"
        control={control}
        render={({ field }) => <TextInput label="Address Line 1" {...field} />}
      />
      <Controller
        name="addressLine2"
        control={control}
        render={({ field }) => <TextInput label="Address Line 2" {...field} />}
      />
      <Controller
        name="countryId"
        control={control}
        render={({ field }) => (
          <SelectInput
            label="Country"
            options={countries.map((c) => ({ value: String(c.id), label: c.name }))}
            value={field.value}
            onChange={(v) => { field.onChange(v as string); setValue('stateId', ''); setValue('cityId', '') }}
            placeholder={countriesLoading ? 'Loading…' : 'Select country'}
          />
        )}
      />
      <Controller
        name="stateId"
        control={control}
        render={({ field }) => (
          <SelectInput
            label="State / County"
            options={states.map((s) => ({ value: String(s.id), label: s.name }))}
            value={field.value}
            onChange={(v) => { field.onChange(v as string); setValue('cityId', '') }}
            placeholder={!selectedCountryId ? 'Select a country first' : statesLoading ? 'Loading…' : 'Select state'}
          />
        )}
      />
      <Controller
        name="cityId"
        control={control}
        render={({ field }) => (
          <SelectInput
            label="City"
            options={cities.map((c) => ({ value: String(c.id), label: c.name }))}
            value={field.value}
            onChange={(v) => field.onChange(v as string)}
            placeholder={!selectedStateId ? 'Select a state first' : citiesLoading ? 'Loading…' : 'Select city'}
          />
        )}
      />
      <Button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? 'Saving…' : 'Save changes'}
      </Button>
    </form>
  )
}

// ── Security tab ──────────────────────────────────────────────────────────────

const securitySchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().superRefine((val, ctx) => {
    if (val.length < 12) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'At least 12 characters' })
    if (!/[A-Z]/.test(val)) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'One uppercase letter' })
    if (!/[a-z]/.test(val)) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'One lowercase letter' })
    if (!/\d/.test(val)) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'One number' })
    if (!/[^A-Za-z0-9]/.test(val)) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'One special character' })
  }),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})
type SecurityForm = z.infer<typeof securitySchema>

function PasswordRequirement({ met, label }: { met: boolean; label: string }) {
  return (
    <li className="flex items-center gap-2 text-sm">
      <span className={`size-4 rounded-full border flex items-center justify-center shrink-0 ${met ? 'border-primary bg-primary' : 'border-border'}`}>
        {met && <span className="block size-1.5 rounded-full bg-white" />}
      </span>
      <span className={met ? 'text-foreground' : 'text-muted-foreground'}>{label}</span>
    </li>
  )
}

function SessionCard({ session, onRevoke }: { session: SessionItem; onRevoke: () => void }) {
  const started = new Date(session.issuedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
  const ua = session.userAgent ?? 'Unknown device'
  const device = ua.includes('Mobile') ? 'Mobile' : 'Desktop'

  return (
    <div className={`flex items-start justify-between gap-4 rounded-lg border p-4 ${session.isCurrent ? 'border-primary/30 bg-primary/5' : 'border-border'}`}>
      <div className="flex items-start gap-3">
        <MonitorIcon className="size-4 mt-0.5 text-muted-foreground shrink-0" />
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{session.isCurrent ? 'This device' : device}</span>
            {session.isCurrent && (
              <span className="text-xs font-medium text-primary border border-primary/40 rounded-full px-2 py-0.5">Current</span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">Started {started}{session.ipAddress ? ` · ${session.ipAddress}` : ''}</p>
        </div>
      </div>
      {!session.isCurrent && (
        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive shrink-0" onClick={onRevoke}>
          Revoke
        </Button>
      )}
    </div>
  )
}

function SecurityTab() {
  const qc = useQueryClient()
  const [confirmDelete, setConfirmDelete] = useState(false)

  const { control, handleSubmit, reset, watch } = useForm<SecurityForm>({
    resolver: zodResolver(securitySchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  })

  const newPassword = watch('newPassword') ?? ''
  const requirements = [
    { label: 'At least 12 characters', met: newPassword.length >= 12 },
    { label: 'One uppercase letter', met: /[A-Z]/.test(newPassword) },
    { label: 'One lowercase letter', met: /[a-z]/.test(newPassword) },
    { label: 'One number', met: /\d/.test(newPassword) },
    { label: 'One special character', met: /[^A-Za-z0-9]/.test(newPassword) },
  ]

  const passwordMutation = useMutation({
    mutationFn: (data: SecurityForm) =>
      changePassword({ currentPassword: data.currentPassword, newPassword: data.newPassword }),
    onSuccess: () => { toast.success('Password updated'); reset() },
    onError: (err: Error) => toast.error(err.message),
  })

  const { data: sessions = [], isLoading: sessionsLoading } = useQuery({
    queryKey: ['sessions'],
    queryFn: getSessions,
  })

  const revokeMutation = useMutation({
    mutationFn: revokeSession,
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['sessions'] }); toast.success('Session revoked') },
    onError: (err: Error) => toast.error(err.message),
  })

  return (
    <div className="space-y-8 max-w-lg">
      {/* Change password */}
      <div className="rounded-lg border border-border p-6 space-y-5">
        <h3 className="font-semibold text-foreground">Change Password</h3>
        <form onSubmit={handleSubmit((d) => passwordMutation.mutate(d))} className="space-y-4">
          <Controller name="currentPassword" control={control} render={({ field }) => (
            <PasswordInput label="Current password" required {...field} />
          )} />
          <Controller name="newPassword" control={control} render={({ field }) => (
            <PasswordInput label="New password" required {...field} />
          )} />
          {newPassword.length > 0 && (
            <div className="rounded-lg bg-muted/50 p-4">
              <p className="text-xs font-medium text-muted-foreground mb-2">Password requirements</p>
              <ul className="space-y-1.5">
                {requirements.map((r) => <PasswordRequirement key={r.label} {...r} />)}
              </ul>
            </div>
          )}
          <Controller name="confirmPassword" control={control} render={({ field }) => (
            <PasswordInput label="Confirm new password" required {...field} />
          )} />
          <Button type="submit" disabled={passwordMutation.isPending}>
            {passwordMutation.isPending ? 'Updating…' : 'Update Password'}
          </Button>
        </form>
      </div>

      {/* Active sessions */}
      <div className="rounded-lg border border-border p-6 space-y-4">
        <div>
          <h3 className="font-semibold text-foreground">Active Sessions</h3>
          <p className="text-sm text-muted-foreground mt-0.5">Manage your active sessions across devices. You can revoke access for any session you don&apos;t recognise.</p>
        </div>
        {sessionsLoading ? (
          <Spinner />
        ) : (
          <div className="space-y-2">
            {sessions.map((s) => (
              <SessionCard key={s.id} session={s} onRevoke={() => revokeMutation.mutate(s.id)} />
            ))}
            {sessions.filter((s) => !s.isCurrent).length === 0 && (
              <p className="text-sm text-muted-foreground">No other active sessions.</p>
            )}
          </div>
        )}
      </div>

      {/* Danger zone */}
      <div className="rounded-lg border border-destructive/40 p-6 space-y-4">
        <div className="flex items-center gap-2">
          <ShieldAlertIcon className="size-4 text-destructive" />
          <h3 className="font-semibold text-destructive">Delete Account</h3>
        </div>
        <p className="text-sm text-muted-foreground">Permanently delete your account and all associated data. This action cannot be undone.</p>
        {!confirmDelete ? (
          <Button variant="destructive" onClick={() => setConfirmDelete(true)}>Delete My Account</Button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm font-medium text-destructive">Are you sure? This cannot be undone.</p>
            <div className="flex gap-2">
              <Button variant="destructive" size="sm">Yes, delete my account</Button>
              <Button variant="outline" size="sm" onClick={() => setConfirmDelete(false)}>Cancel</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Documents tab ─────────────────────────────────────────────────────────────

function DocumentsTab() {
  return (
    <p className="text-muted-foreground">Document upload coming soon.</p>
  )
}

// ── Tab content router ────────────────────────────────────────────────────────

function TabContent({ tab }: { tab: Tab }) {
  switch (tab) {
    case 'general':    return <GeneralTab />
    case 'education':  return <EducationTab />
    case 'experience': return <ExperienceTab />
    case 'address':    return <AddressTab />
    case 'security':   return <SecurityTab />
    case 'documents':  return <DocumentsTab />
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────

function ProfilePageInner() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const rawTab = searchParams.get('tab') ?? 'general'
  const activeTab: Tab = (TABS as readonly string[]).includes(rawTab) ? (rawTab as Tab) : 'general'

  function switchTab(tab: Tab) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', tab)
    router.push(`?${params.toString()}`)
  }

  return (
    <div className="px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Profile</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your personal information and account settings.
        </p>
      </div>

      {/* Tab bar */}
      <div className="border-b border-border">
        <div className="flex gap-6">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => switchTab(tab)}
              className={cn(
                'pb-2 text-sm font-medium transition-colors',
                activeTab === tab
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {TAB_LABELS[tab]}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <TabContent tab={activeTab} />
    </div>
  )
}

export default function ProfilePage() {
  return (
    <Suspense>
      <ProfilePageInner />
    </Suspense>
  )
}
