'use client'

import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useEmployerSettings, useUpdateEmployerSettings } from '@/hooks/employer'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'

// ── Form schema ───────────────────────────────────────────────────────────────
// Mirror UpdateEmployerSchema from shared-schemas but with string coercion for
// numeric IDs since HTML inputs return strings.

const SettingsFormSchema = z.object({
  companyName: z.string().min(2).max(300),
  primaryContactName: z.string().min(2).max(200),
  primaryContactEmail: z.string().email(),
  primaryContactPhone: z
    .string()
    .regex(/^\+[1-9]\d{6,14}$/, 'Must be E.164 format, e.g. +231770123456'),
  vacationJobHosting: z.boolean(),
  vacationJobDonating: z.boolean(),
  // Address — all optional text fields
  addressLine1: z.string().max(300).optional().or(z.literal('')),
  addressLine2: z.string().max(300).optional().or(z.literal('')),
  // TODO: wire up reference data selects for sectorId, stateId, countryId, cityId
  // when reference-data hooks are available. For now, display as read-only text.
})

type SettingsFormValues = z.infer<typeof SettingsFormSchema>

// ── Compliance badge ─────────────────────────────────────────────────────────

const COMPLIANCE_STYLES: Record<string, string> = {
  COMPLIANT: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  PENDING: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  OVERDUE: 'bg-destructive/10 text-destructive',
  EXEMPT: 'bg-muted text-muted-foreground',
}

function ComplianceBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center text-xs px-2.5 py-1 rounded-full font-medium',
        COMPLIANCE_STYLES[status] ?? COMPLIANCE_STYLES.PENDING
      )}
    >
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  )
}

// ── Field row ────────────────────────────────────────────────────────────────

function FieldRow({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

// ── Skeleton loading ─────────────────────────────────────────────────────────

function SettingsSkeleton() {
  return (
    <div className="space-y-6">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-64 mt-1" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((j) => (
                <div key={j} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-9 w-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// ── Settings page ─────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { data: settings, isLoading } = useEmployerSettings()
  const update = useUpdateEmployerSettings()

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isDirty },
  } = useForm<SettingsFormValues>({
    resolver: zodResolver(SettingsFormSchema),
    defaultValues: {
      companyName: '',
      primaryContactName: '',
      primaryContactEmail: '',
      primaryContactPhone: '',
      vacationJobHosting: false,
      vacationJobDonating: false,
      addressLine1: '',
      addressLine2: '',
    },
  })

  // Populate form once data arrives
  useEffect(() => {
    if (!settings) return
    reset({
      companyName: settings.companyName,
      primaryContactName: settings.primaryContactName,
      primaryContactEmail: settings.primaryContactEmail,
      primaryContactPhone: settings.primaryContactPhone,
      vacationJobHosting: settings.vacationJobHosting,
      vacationJobDonating: settings.vacationJobDonating,
      addressLine1: settings.address?.addressLine1 ?? '',
      addressLine2: settings.address?.addressLine2 ?? '',
    })
  }, [settings, reset])

  function onSubmit(values: SettingsFormValues) {
    const payload = {
      companyName: values.companyName,
      primaryContactName: values.primaryContactName,
      primaryContactEmail: values.primaryContactEmail,
      primaryContactPhone: values.primaryContactPhone,
      vacationJobHosting: values.vacationJobHosting,
      vacationJobDonating: values.vacationJobDonating,
      // Only include address if there are address fields
      ...(values.addressLine1 || values.addressLine2
        ? {
            address: {
              addressLine1: values.addressLine1 || undefined,
              addressLine2: values.addressLine2 || undefined,
            },
          }
        : {}),
    }
    update.mutate(payload, {
      onSuccess: () => toast.success('Settings saved'),
      onError: (e) => toast.error(e.message),
    })
  }

  function handleDiscard() {
    if (!settings) return
    reset({
      companyName: settings.companyName,
      primaryContactName: settings.primaryContactName,
      primaryContactEmail: settings.primaryContactEmail,
      primaryContactPhone: settings.primaryContactPhone,
      vacationJobHosting: settings.vacationJobHosting,
      vacationJobDonating: settings.vacationJobDonating,
      addressLine1: settings.address?.addressLine1 ?? '',
      addressLine2: settings.address?.addressLine2 ?? '',
    })
  }

  if (isLoading) return <SettingsSkeleton />

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl space-y-6 pb-24">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage your company profile and preferences.
        </p>
      </div>

      {/* Company info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Company info</CardTitle>
          <CardDescription>Basic details about your organisation.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <FieldRow label="Company name" error={errors.companyName?.message}>
            <Input {...register('companyName')} aria-invalid={!!errors.companyName} />
          </FieldRow>
          <div className="space-y-1.5">
            <Label>LRA registration number</Label>
            <Input
              value={settings?.lraRegistrationNumber ?? ''}
              readOnly
              disabled
              className="opacity-60"
            />
            <p className="text-xs text-muted-foreground">Read-only — contact MoL to update.</p>
          </div>
          {/* TODO: replace with sector select when reference-data hook is available */}
          <div className="space-y-1.5">
            <Label>Sector ID</Label>
            <Input
              value={settings?.sectorId ?? ''}
              readOnly
              disabled
              className="opacity-60"
            />
            <p className="text-xs text-muted-foreground">TODO: sector reference data select</p>
          </div>
          {/* TODO: replace with state select when reference-data hook is available */}
          <div className="space-y-1.5">
            <Label>State ID</Label>
            <Input
              value={settings?.stateId?.toString() ?? ''}
              readOnly
              disabled
              className="opacity-60"
            />
            <p className="text-xs text-muted-foreground">TODO: state reference data select</p>
          </div>
        </CardContent>
      </Card>

      {/* Primary contact */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Primary contact</CardTitle>
          <CardDescription>Person MoL reaches for compliance matters.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <FieldRow label="Contact name" error={errors.primaryContactName?.message}>
            <Input {...register('primaryContactName')} aria-invalid={!!errors.primaryContactName} />
          </FieldRow>
          <FieldRow label="Contact email" error={errors.primaryContactEmail?.message}>
            <Input
              type="email"
              {...register('primaryContactEmail')}
              aria-invalid={!!errors.primaryContactEmail}
            />
          </FieldRow>
          <FieldRow label="Contact phone (E.164)" error={errors.primaryContactPhone?.message}>
            <Input
              placeholder="+231770123456"
              {...register('primaryContactPhone')}
              aria-invalid={!!errors.primaryContactPhone}
            />
          </FieldRow>
        </CardContent>
      </Card>

      {/* Address */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Address</CardTitle>
          <CardDescription>Physical location of your company.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          {/* TODO: replace with country/state/city selects when reference-data hooks exist */}
          <div className="space-y-1.5">
            <Label>Country ID</Label>
            <Input
              value={settings?.address?.countryId?.toString() ?? ''}
              readOnly
              disabled
              className="opacity-60"
            />
            <p className="text-xs text-muted-foreground">TODO: country reference data select</p>
          </div>
          <div className="space-y-1.5 col-span-2">
            <Label>Address line 1</Label>
            <Input {...register('addressLine1')} />
          </div>
          <div className="space-y-1.5 col-span-2">
            <Label>Address line 2</Label>
            <Input {...register('addressLine2')} />
          </div>
        </CardContent>
      </Card>

      {/* Program participation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Program participation</CardTitle>
          <CardDescription>Vacation job scheme settings for your company.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Controller
            name="vacationJobHosting"
            control={control}
            render={({ field }) => (
              <div className="flex items-center justify-between py-1">
                <div>
                  <p className="text-sm font-medium">Vacation job hosting</p>
                  <p className="text-xs text-muted-foreground">
                    Allow your company to host vacation job placements.
                  </p>
                </div>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </div>
            )}
          />
          <Controller
            name="vacationJobDonating"
            control={control}
            render={({ field }) => (
              <div className="flex items-center justify-between py-1">
                <div>
                  <p className="text-sm font-medium">Vacation job donating</p>
                  <p className="text-xs text-muted-foreground">
                    Donate unneeded placement slots to other employers.
                  </p>
                </div>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </div>
            )}
          />
        </CardContent>
      </Card>

      {/* Compliance (read-only) */}
      {settings && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Compliance</CardTitle>
            <CardDescription>Your current MoL compliance standing.</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-4">
            <ComplianceBadge status={settings.complianceStatus} />
            <p className="text-sm text-muted-foreground">
              Status last updated:{' '}
              {new Date(settings.updatedAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Sticky save bar */}
      <div className="fixed bottom-0 left-56 right-0 z-20 border-t border-border bg-background px-6 py-3 flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={handleDiscard}
          disabled={!isDirty || update.isPending}
        >
          Discard
        </Button>
        <Button type="submit" disabled={!isDirty || update.isPending}>
          {update.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          Save changes
        </Button>
      </div>
    </form>
  )
}
