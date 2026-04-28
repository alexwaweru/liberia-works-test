'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm, useWatch, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Check, X } from 'lucide-react'
import { toast } from '@/lib/toast'
import { Button } from '@/components/ui/button'
import { TextInput } from '@/components/ui/input-fields/text'
import { EmailInput } from '@/components/ui/input-fields/email'
import { PasswordInput } from '@/components/ui/input-fields/password'
import { TelephoneInput } from '@/components/ui/input-fields/telephone'
import { SelectInput } from '@/components/ui/input-fields/select'
import { DatePicker } from '@/components/ui/input-fields/date'
import { RadioInput } from '@/components/ui/input-fields/radio'
import { registerIndividualAction } from './actions'
import { Logo } from '@/components/ui/logo'

const LIBERIA = { code: 'LR', dialCode: '+231', name: 'Liberia', flag: '🇱🇷' }

const GENDER_OPTIONS = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'Prefer not to say', value: 'unspecified' },
]

const schema = z
  .object({
    fullName: z.string().min(2, 'Full name is required'),
    phone: z
      .string()
      .regex(/^\+[1-9]\d{6,14}$/, 'Enter a valid Liberian phone number (e.g. +231771234567)'),
    email: z.string().email('Enter a valid email address').optional().or(z.literal('')),
    countyId: z.string().min(1, 'Select your county'),
    dateOfBirth: z.date().optional(),
    gender: z.enum(['male', 'female', 'unspecified']).optional(),
    password: z.string().superRefine((val, ctx) => {
      if (val.length < 12) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'At least 12 characters' })
      if (!/[A-Z]/.test(val)) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'One uppercase letter' })
      if (!/[a-z]/.test(val)) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'One lowercase letter' })
      if (!/\d/.test(val)) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'One number' })
      if (!/[^A-Za-z0-9]/.test(val)) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'One special character' })
    }),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type FormData = z.infer<typeof schema>

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

export default function IndividualRegisterPage() {
  const router = useRouter()
  const [counties, setCounties] = useState<{ label: string; value: string }[]>([])

  useEffect(() => {
    fetch(`${API_BASE}/api/v1/reference/states?countryCode=LR`)
      .then((r) => r.json())
      .then((data: { id: number; name: string }[]) =>
        setCounties(data.map((s) => ({ label: s.name, value: String(s.id) })))
      )
      .catch(() => {})
  }, [])

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
  } = useForm<FormData>({ resolver: zodResolver(schema), mode: 'onChange' })

  const passwordValue = useWatch({ control, name: 'password' }) ?? ''
  const confirmValue = useWatch({ control, name: 'confirmPassword' }) ?? ''
  const hasStartedTyping = passwordValue.length > 0
  const hasStartedConfirm = confirmValue.length > 0
  const passwordsMatch = confirmValue.length > 0 && passwordValue === confirmValue

  const requirements = [
    { label: 'At least 12 characters', met: passwordValue.length >= 12 },
    { label: 'One uppercase letter', met: /[A-Z]/.test(passwordValue) },
    { label: 'One lowercase letter', met: /[a-z]/.test(passwordValue) },
    { label: 'One number', met: /\d/.test(passwordValue) },
    { label: 'One special character', met: /[^A-Za-z0-9]/.test(passwordValue) },
  ]

  async function onSubmit(data: FormData) {
    const result = await registerIndividualAction({
      phone: data.phone,
      fullName: data.fullName,
      countyId: parseInt(data.countyId, 10),
      email: data.email || undefined,
      password: data.password,
      dateOfBirth: data.dateOfBirth ? data.dateOfBirth.toISOString().split('T')[0] : undefined,
      gender: data.gender,
    })
    if ('error' in result) {
      toast.error(result.error)
      return
    }
    toast.success('OTP sent to your phone number.')
    router.push(`/auth/verify-otp?phone=${encodeURIComponent(data.phone)}`)
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6"><Logo /></div>
        <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
        <Button variant="ghost" size="sm" asChild className="-ml-2 mb-6 text-muted-foreground">
          <Link href="/auth/register">
            <ArrowLeft />
            Back
          </Link>
        </Button>

        <h1 className="text-2xl font-bold text-foreground">Create your account</h1>
        <p className="text-sm text-muted-foreground mt-1 mb-6">
          Find jobs and programs across all 15 counties of Liberia.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <TextInput
            {...register('fullName')}
            label="Full name"
            placeholder="Your full name"
            required
            error={errors.fullName?.message}
          />

          <Controller
            name="phone"
            control={control}
            render={({ field }) => (
              <TelephoneInput
                label="Phone number"
                required
                value={field.value?.replace(LIBERIA.dialCode, '') ?? ''}
                onChange={(value) => field.onChange(value ? `${LIBERIA.dialCode}${value}` : '')}
                error={errors.phone?.message}
                countries={[LIBERIA]}
                defaultCountry="LR"
              />
            )}
          />

          <EmailInput
            {...register('email')}
            label="Email address (optional)"
            placeholder="you@example.com"
            validateOnBlur={false}
            error={errors.email?.message}
          />

          <Controller
            name="countyId"
            control={control}
            render={({ field }) => (
              <SelectInput
                label="County"
                placeholder={counties.length === 0 ? 'Loading counties…' : 'Select your county'}
                required
                options={counties}
                value={field.value}
                onChange={(value) => field.onChange(value)}
                error={errors.countyId?.message}
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
                onChange={(date) => field.onChange(date instanceof Date ? date : undefined)}
                toDate={new Date()}
                error={errors.dateOfBirth?.message}
              />
            )}
          />

          <Controller
            name="gender"
            control={control}
            render={({ field }) => (
              <RadioInput
                label="Gender"
                options={GENDER_OPTIONS}
                value={field.value}
                onChange={field.onChange}
                orientation="horizontal"
                error={errors.gender?.message}
              />
            )}
          />

          <PasswordInput
            {...register('password')}
            label="Password"
            placeholder="Min. 12 characters"
            required
            error={errors.password?.message}
          />

          {hasStartedTyping && (
            <div className="rounded-lg bg-muted/50 p-4 space-y-2.5">
              <p className="text-sm font-semibold text-muted-foreground">Password requirements</p>
              <ul className="space-y-1.5">
                {requirements.map((req) => {
                  const Icon = req.met ? Check : X
                  const colorClass = req.met ? 'text-success' : 'text-destructive'
                  return (
                    <li key={req.label} className={`flex items-center gap-2 text-sm ${colorClass}`}>
                      <Icon size={14} className={colorClass} />
                      {req.label}
                    </li>
                  )
                })}
              </ul>
            </div>
          )}

          <PasswordInput
            {...register('confirmPassword')}
            label="Confirm password"
            placeholder="Repeat your password"
            required
            error={errors.confirmPassword?.message}
          />

          {hasStartedConfirm && (
            <p className={`flex items-center gap-2 text-sm -mt-2 ${passwordsMatch ? 'text-success' : 'text-destructive'}`}>
              {passwordsMatch
                ? <Check size={14} />
                : <X size={14} />}
              Passwords match
            </p>
          )}

          <Button type="submit" disabled={isSubmitting || !isValid} className="w-full mt-2">
            {isSubmitting ? 'Creating account…' : 'Continue'}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-5">
          Already have an account?{' '}
          <Button variant="link" asChild className="h-auto p-0 text-sm font-medium">
            <Link href="/auth/login">Sign in</Link>
          </Button>
        </p>
        </div>
      </div>
    </div>
  )
}
