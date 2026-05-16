'use client'

import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCreateOptIn, useCounties, useSectors, useEducationLevels } from '@/hooks/programs'
import { MultiSelect } from '@/components/ui/multi-select'
import { toast } from '@/lib/toast'

const optInSchema = z.object({
  preferredSectors: z.array(z.string()).min(1, 'Select at least one sector'),
  preferredCounties: z.array(z.number()).min(1, 'Select at least one county'),
  preferredEducationLevelId: z.string().optional(),
  additionalNotes: z.string().optional(),
})

type OptInFormData = z.infer<typeof optInSchema>

interface OptInFormProps {
  programId: string
  onSuccess: () => void
}

export function OptInForm({ programId, onSuccess }: OptInFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const createOptIn = useCreateOptIn()

  const { data: counties, isLoading: countiesLoading } = useCounties()
  const { data: sectors, isLoading: sectorsLoading } = useSectors()
  const { data: educationLevels, isLoading: educationLoading } = useEducationLevels()

  const {
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<OptInFormData>({
    resolver: zodResolver(optInSchema),
    defaultValues: {
      preferredSectors: [],
      preferredCounties: [],
      preferredEducationLevelId: undefined,
      additionalNotes: '',
    },
  })

  const selectedSectors = watch('preferredSectors')
  const selectedCounties = watch('preferredCounties')
  const selectedEducationLevel = watch('preferredEducationLevelId')

  async function onSubmit(data: OptInFormData) {
    setIsSubmitting(true)
    try {
      await createOptIn.mutateAsync({
        programCycleId: programId,
        preferredSectors: data.preferredSectors,
        preferredCounties: data.preferredCounties,
        preferredEducationLevelId: data.preferredEducationLevelId || undefined,
        additionalNotes: data.additionalNotes || undefined,
      })
  
      toast.success('You have opted into this program.')
      onSuccess()
    } catch (error) {
      // Better error message
      const message = error instanceof Error ? error.message : 'Failed to opt in'

      if (message.includes('Already opted')) {
        toast.error('You have already opted into this program.')
      } else {
        toast.error(message)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const isLoading = countiesLoading || sectorsLoading || educationLoading

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const sectorOptions = sectors?.map((s) => ({ value: s.id, label: s.name })) ?? []
  const countyOptions = counties?.map((c) => ({ value: c.id, label: c.name })) ?? []

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label>
          Preferred Sectors <span className="text-destructive">*</span>
        </Label>
        <MultiSelect
          options={sectorOptions}
          selected={selectedSectors}
          onChange={(value) => setValue('preferredSectors', value as string[])}
          placeholder="Select sectors..."
        />
        {errors.preferredSectors && (
          <p className="text-sm text-destructive">{errors.preferredSectors.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>
          Preferred Counties <span className="text-destructive">*</span>
        </Label>
        <MultiSelect
          options={countyOptions}
          selected={selectedCounties}
          onChange={(value) => setValue('preferredCounties', value as number[])}
          placeholder="Select counties..."
        />
        {errors.preferredCounties && (
          <p className="text-sm text-destructive">{errors.preferredCounties.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Education Level (Optional)</Label>
        <Select
          onValueChange={(value) => setValue('preferredEducationLevelId', value)}
          value={selectedEducationLevel}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select your education level" />
          </SelectTrigger>
          <SelectContent>
            {educationLevels?.map((level) => (
              <SelectItem key={level.id} value={level.id}>
                {level.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Additional Notes (Optional)</Label>
        <Controller
            name="additionalNotes"
            control={control}
            render={({ field }) => (
            <Textarea
                placeholder="Any additional information about your preferences..."
                className="min-h-[100px]"
                value={field.value || ''}
                onChange={field.onChange}
                onBlur={field.onBlur}
            />
            )}
        />
        </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="submit" disabled={isSubmitting} className="min-w-[120px]">
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Submitting...
            </>
          ) : (
            'Submit Opt-In'
          )}
        </Button>
      </div>
    </form>
  )
}