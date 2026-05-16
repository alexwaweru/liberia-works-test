'use client'

import { Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Logo } from '@/components/ui/logo'
import { useAcceptInvite } from '@/hooks/invites'
import { toast } from '@/lib/toast'

// The backend ignores fullName/password for existing users, so we always show
// both fields with a note. This avoids the need for an extra round-trip to detect
// whether the user already exists.

const AcceptSchema = z.object({
  fullName: z.string().min(1, 'Required').max(200).optional().or(z.literal('')),
  password: z
    .string()
    .min(8, 'Must be at least 8 characters')
    .max(200)
    .optional()
    .or(z.literal('')),
})

type AcceptFormValues = z.infer<typeof AcceptSchema>

function AcceptInviteInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token') ?? ''
  const accept = useAcceptInvite()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AcceptFormValues>({
    resolver: zodResolver(AcceptSchema),
  })

  function onSubmit(values: AcceptFormValues) {
    if (!token) {
      toast.error('Missing invite token. Please use the link from your invitation email.')
      return
    }
    accept.mutate(
      {
        token,
        fullName: values.fullName || undefined,
        password: values.password || undefined,
      },
      {
        onSuccess: () => {
          toast.success('Welcome! You have joined the team.')
          router.push('/dashboard')
        },
        onError: (e) => {
          // Surface specific backend errors
          const msg = e.message.toLowerCase()
          if (msg.includes('expired') || msg.includes('invalid')) {
            toast.error('This invite link has expired or is invalid. Ask your admin to resend.')
          } else if (msg.includes('password')) {
            toast.error(`Password: ${e.message}`)
          } else {
            toast.error(e.message)
          }
        },
      }
    )
  }

  const hasNoToken = !token

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Brand */}
        <div className="flex justify-center">
          <Logo href="/" />
        </div>

        {/* Card */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-5">
          <div className="space-y-1">
            <h1 className="text-lg font-semibold">Accept invitation</h1>
            <p className="text-sm text-muted-foreground">
              You have been invited to join an employer account on Liberia Works.
            </p>
          </div>

          {hasNoToken && (
            <div className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <p>
                No invite token found. Please use the link from your invitation email rather
                than navigating here directly.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="ai-fullName">Full name</Label>
              <Input
                id="ai-fullName"
                placeholder="Jane Doe"
                {...register('fullName')}
                aria-invalid={!!errors.fullName}
                disabled={hasNoToken}
              />
              {errors.fullName && (
                <p className="text-xs text-destructive">{errors.fullName.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ai-password">Password</Label>
              <Input
                id="ai-password"
                type="password"
                placeholder="Min. 8 characters"
                {...register('password')}
                aria-invalid={!!errors.password}
                disabled={hasNoToken}
              />
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              Already have a Quola account? Sign in with your existing password — the fields
              above are only needed if you are new to the platform.
            </p>

            <Button
              type="submit"
              className="w-full"
              disabled={hasNoToken || accept.isPending}
            >
              {accept.isPending && <Loader2 className="size-4 animate-spin" />}
              Accept invite
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Having trouble?{' '}
          <a href="mailto:support@liberiaworks.gov.lr" className="underline hover:text-foreground">
            Contact support
          </a>
        </p>
      </div>
    </div>
  )
}

export default function AcceptInvitePage() {
  return (
    <Suspense>
      <AcceptInviteInner />
    </Suspense>
  )
}
