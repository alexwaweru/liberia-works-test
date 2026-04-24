'use client'

import Link from 'next/link'
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
import { registerEmployerAction } from './actions'
import { Logo } from '@/components/ui/logo'

const LIBERIA = { code: 'LR', dialCode: '+231', name: 'Liberia', flag: '🇱🇷' }

const schema = z
  .object({
    fullName: z.string().min(2, 'Full name is required'),
    email: z.string().email('Enter a valid email address'),
    companyName: z.string().min(2, 'Company name is required'),
    lraRegistrationNumber: z.string().min(6, 'Enter a valid LRA registration number'),
    primaryContactPhone: z
      .string()
      .regex(/^\+[1-9]\d{6,14}$/, 'Must be a valid E.164 phone number (e.g. +231771234567)')
      .or(z.literal('')),
    password: z.string().superRefine((val, ctx) => {
      if (val.length < 12) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "At least 12 characters" });
      if (!/[A-Z]/.test(val)) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "One uppercase letter" });
      if (!/[a-z]/.test(val)) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "One lowercase letter" });
      if (!/\d/.test(val)) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "One number" });
      if (!/[^A-Za-z0-9]/.test(val)) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "One special character" });
    }),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type FormData = z.infer<typeof schema>

export default function EmployerRegisterPage() {
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
    const result = await registerEmployerAction({
      email: data.email,
      password: data.password,
      fullName: data.fullName,
      companyName: data.companyName,
      lraRegistrationNumber: data.lraRegistrationNumber,
      primaryContactPhone: data.primaryContactPhone || undefined,
    })
    if (result?.error) toast.error(result.error)
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

        <h1 className="text-2xl font-bold text-foreground">Create an employer account</h1>
        <p className="text-sm text-muted-foreground mt-1 mb-6">
          Register your company to post vacancies and manage talent.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <TextInput
            {...register('fullName')}
            label="Full name"
            placeholder="Your full name"
            required
            error={errors.fullName?.message}
          />

          <EmailInput
            {...register('email')}
            label="Email"
            placeholder="you@company.com"
            required
            validateOnBlur={false}
            error={errors.email?.message}
          />

          <TextInput
            {...register('companyName')}
            label="Company name"
            placeholder="Your company name"
            required
            error={errors.companyName?.message}
          />

          <TextInput
            {...register('lraRegistrationNumber')}
            label="LRA registration number"
            placeholder="e.g. LRA-2024-XXXXXX"
            required
            error={errors.lraRegistrationNumber?.message}
          />

          <Controller
            name="primaryContactPhone"
            control={control}
            render={({ field }) => (
              <TelephoneInput
                label="Phone number"
                required
                value={field.value?.replace(LIBERIA.dialCode, '') ?? ''}
                onChange={(value) => field.onChange(value ? `${LIBERIA.dialCode}${value}` : '')}
                error={errors.primaryContactPhone?.message}
                countries={[LIBERIA]}
                defaultCountry="LR"
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
            {isSubmitting ? 'Creating account…' : 'Create Account'}
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
