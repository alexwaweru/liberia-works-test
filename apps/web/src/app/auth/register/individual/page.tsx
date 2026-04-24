'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft } from 'lucide-react'
import { toast } from '@/lib/toast'
import { Button } from '@/components/ui/button'
import { TextInput } from '@/components/ui/input-fields/text'
import { TelephoneInput } from '@/components/ui/input-fields/telephone'
import { SelectInput } from '@/components/ui/input-fields/select'
import { DatePicker } from '@/components/ui/input-fields/date'
import { RadioInput } from '@/components/ui/input-fields/radio'
import { registerIndividualAction } from './actions'
import { Logo } from '@/components/ui/logo'

const LIBERIA = { code: 'LR', dialCode: '+231', name: 'Liberia', flag: '🇱🇷' }

const COUNTIES = [
  'Bomi', 'Bong', 'Gbarpolu', 'Grand Bassa', 'Grand Cape Mount',
  'Grand Gedeh', 'Grand Kru', 'Lofa', 'Margibi', 'Maryland',
  'Montserrado', 'Nimba', 'River Cess', 'River Gee', 'Sinoe',
].map((c) => ({ label: c, value: c.toLowerCase().replace(/\s+/g, '-') }))

const GENDER_OPTIONS = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'Prefer not to say', value: 'unspecified' },
]

const schema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  phone: z
    .string()
    .regex(/^\+[1-9]\d{6,14}$/, 'Enter a valid Liberian phone number (e.g. +231771234567)'),
  county: z.string().min(1, 'Select your county'),
  dateOfBirth: z.date().optional(),
  gender: z.enum(['male', 'female', 'unspecified']).optional(),
})

type FormData = z.infer<typeof schema>

export default function IndividualRegisterPage() {
  const router = useRouter()
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  async function onSubmit(data: FormData) {
    const result = await registerIndividualAction({
      phone: data.phone,
      fullName: data.fullName,
      county: data.county,
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

          <Controller
            name="county"
            control={control}
            render={({ field }) => (
              <SelectInput
                label="County"
                placeholder="Select your county"
                required
                options={COUNTIES}
                value={field.value}
                onChange={(value) => field.onChange(value)}
                error={errors.county?.message}
              />
            )}
          />

          <Controller
            name="dateOfBirth"
            control={control}
            render={({ field }) => (
              <DatePicker
                label="Date of birth"
                placeholder="Select date"
                value={field.value}
                onChange={(date) => field.onChange(date)}
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

          <Button type="submit" disabled={isSubmitting} className="w-full mt-2">
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
