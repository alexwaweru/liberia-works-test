'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from '@/lib/toast'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { EmailInput } from '@/components/ui/input-fields/email'
import { PasswordInput } from '@/components/ui/input-fields/password'
import { TelephoneInput } from '@/components/ui/input-fields/telephone'
import type { CountryData } from '@/components/ui/input-fields/types'
import { loginAction } from './actions'
import { Logo } from '@/components/ui/logo'

const LIBERIA: CountryData = { code: 'LR', dialCode: '+231', name: 'Liberia', flag: '🇱🇷' }

const emailSchema = z.object({
  method: z.literal('email'),
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

const phoneSchema = z.object({
  method: z.literal('phone'),
  phoneNumber: z.string().min(1, 'Phone number is required'),
  password: z.string().min(1, 'Password is required'),
})

type EmailFormData = z.infer<typeof emailSchema>
type PhoneFormData = z.infer<typeof phoneSchema>

export default function LoginPage() {
  const dialCodeRef = useRef(LIBERIA.dialCode)

  const emailForm = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    defaultValues: { method: 'email', email: '', password: '' },
  })

  const phoneForm = useForm<PhoneFormData>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { method: 'phone', phoneNumber: '', password: '' },
  })

  async function onEmailSubmit(data: EmailFormData) {
    const result = await loginAction({ email: data.email, password: data.password })
    if (result?.error) toast.error(result.error)
  }

  async function onPhoneSubmit(data: PhoneFormData) {
    const result = await loginAction({ phoneNumber: data.phoneNumber, password: data.password })
    if (result?.error) toast.error(result.error)
  }

  return (
    <div className="min-h-screen bg-secondary flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-card border border-border rounded-2xl shadow-sm p-8 space-y-6">
        <div className="space-y-1 text-center">
          <div className="flex justify-center mb-6"><Logo /></div>
          <h1 className="text-2xl font-bold text-foreground">Sign in to your account</h1>
          <p className="text-sm text-muted-foreground">
            Enter your credentials below to continue
          </p>
        </div>

        <Tabs defaultValue="email" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="email" className="flex-1">Email</TabsTrigger>
            <TabsTrigger value="phone" className="flex-1">Phone number</TabsTrigger>
          </TabsList>

          <TabsContent value="email">
            <form
              onSubmit={emailForm.handleSubmit(onEmailSubmit)}
              noValidate
              className="space-y-4 pt-2"
            >
              <EmailInput
                {...emailForm.register('email')}
                label="Email"
                placeholder="you@example.com"
                required
                validateOnBlur={false}
                error={emailForm.formState.errors.email?.message}
              />

              <div>
                <PasswordInput
                  {...emailForm.register('password')}
                  label="Password"
                  placeholder="••••••••"
                  required
                  error={emailForm.formState.errors.password?.message}
                />
                <div className="flex justify-end mt-1.5">
                  <Button variant="link" asChild className="h-auto p-0 text-xs">
                    <Link href="/auth/forgot-password">Forgot password?</Link>
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={emailForm.formState.isSubmitting}
              >
                {emailForm.formState.isSubmitting ? 'Signing in…' : 'Sign In'}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="phone">
            <form
              onSubmit={phoneForm.handleSubmit(onPhoneSubmit)}
              noValidate
              className="space-y-4 pt-2"
            >
              <Controller
                name="phoneNumber"
                control={phoneForm.control}
                render={({ field }) => {
                  const localNumber =
                    field.value?.startsWith(dialCodeRef.current)
                      ? field.value.slice(dialCodeRef.current.length)
                      : (field.value ?? '')
                  return (
                    <TelephoneInput
                      label="Phone number"
                      required
                      value={localNumber}
                      onChange={(val, country) => {
                        dialCodeRef.current = country.dialCode
                        field.onChange(val ? `${country.dialCode}${val}` : '')
                      }}
                      error={phoneForm.formState.errors.phoneNumber?.message}
                      countries={[LIBERIA]}
                      defaultCountry="LR"
                    />
                  )
                }}
              />

              <div>
                <PasswordInput
                  {...phoneForm.register('password')}
                  label="Password"
                  placeholder="••••••••"
                  required
                  error={phoneForm.formState.errors.password?.message}
                />
                <div className="flex justify-end mt-1.5">
                  <Button variant="link" asChild className="h-auto p-0 text-xs">
                    <Link href="/auth/forgot-password">Forgot password?</Link>
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={phoneForm.formState.isSubmitting}
              >
                {phoneForm.formState.isSubmitting ? 'Signing in…' : 'Sign In'}
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Button variant="link" asChild className="h-auto p-0 text-sm font-semibold">
            <Link href="/auth/register">Sign up</Link>
          </Button>
        </p>
      </div>
    </div>
  )
}
