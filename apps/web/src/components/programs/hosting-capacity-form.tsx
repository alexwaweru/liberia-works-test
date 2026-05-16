'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCreateHostingCapacity, useCounties, useSectors, useEducationLevels } from '@/hooks/programs'
import { toast } from '@/lib/toast'

const hostingCapacitySchema = z.object({
  slotsOffered: z.number({ invalid_type_error: 'Enter a number' }).int().min(1, 'Must offer at least 1 slot'),
  stateId: z.number({ invalid_type_error: 'Select a county' }).int(),
  contactName: z.string().min(1, 'Contact name is required'),
  contactPhone: z.string().min(1, 'Contact phone is required'),
  preferredSectorId: z.string().optional(),
  preferredEducationLevelId: z.string().optional(),
  placementInstructions: z.string().optional(),
})

type HostingCapacityFormData = z.infer<typeof hostingCapacitySchema>

interface HostingCapacityFormProps {
  programId: string
  onSuccess: () => void
}

export function HostingCapacityForm({ programId, onSuccess }: HostingCapacityFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const createHostingCapacity = useCreateHostingCapacity()

  const { data: counties, isLoading: countiesLoading } = useCounties()
  const { data: sectors, isLoading: sectorsLoading } = useSectors()
  const { data: educationLevels, isLoading: educationLoading } = useEducationLevels()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<HostingCapacityFormData>({
    resolver: zodResolver(hostingCapacitySchema),
    defaultValues: {
      slotsOffered: undefined,
      stateId: undefined,
      contactName: '',
      contactPhone: '',
      preferredSectorId: undefined,
      preferredEducationLevelId: undefined,
      placementInstructions: '',
    },
  })

  const selectedStateId = watch('stateId')
  const selectedSectorId = watch('preferredSectorId')
  const selectedEducationLevelId = watch('preferredEducationLevelId')

  async function onSubmit(data: HostingCapacityFormData) {
    setIsSubmitting(true)
    try {
      await createHostingCapacity.mutateAsync({
        cycleId: programId,
        slotsOffered: data.slotsOffered,
        stateId: data.stateId,
        contactName: data.contactName,
        contactPhone: data.contactPhone,
        preferredSectorId: data.preferredSectorId || undefined,
        preferredEducationLevelId: data.preferredEducationLevelId || undefined,
        placementInstructions: data.placementInstructions || undefined,
      })

      toast.success('You have opted into this program.')
      onSuccess()
    } catch (error) {
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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Slots Offered */}
      <div className="space-y-2">
        <Label htmlFor="slotsOffered">
          Slots Offered <span className="text-destructive">*</span>
        </Label>
        <Input
          id="slotsOffered"
          type="number"
          min={1}
          placeholder="e.g. 5"
          {...register('slotsOffered', { valueAsNumber: true })}
        />
        {errors.slotsOffered && (
          <p className="text-sm text-destructive">{errors.slotsOffered.message}</p>
        )}
      </div>

      {/* County */}
      <div className="space-y-2">
        <Label>
          County <span className="text-destructive">*</span>
        </Label>
        <Select
          onValueChange={(value) => setValue('stateId', Number(value))}
          value={selectedStateId !== undefined ? String(selectedStateId) : undefined}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a county" />
          </SelectTrigger>
          <SelectContent>
            {counties?.map((county) => (
              <SelectItem key={county.id} value={String(county.id)}>
                {county.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.stateId && (
          <p className="text-sm text-destructive">{errors.stateId.message}</p>
        )}
      </div>

      {/* Contact Name */}
      <div className="space-y-2">
        <Label htmlFor="contactName">
          Contact Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="contactName"
          type="text"
          placeholder="Full name of the placement contact"
          {...register('contactName')}
        />
        {errors.contactName && (
          <p className="text-sm text-destructive">{errors.contactName.message}</p>
        )}
      </div>

      {/* Contact Phone */}
      <div className="space-y-2">
        <Label htmlFor="contactPhone">
          Contact Phone <span className="text-destructive">*</span>
        </Label>
        <Input
          id="contactPhone"
          type="tel"
          placeholder="+231..."
          {...register('contactPhone')}
        />
        {errors.contactPhone && (
          <p className="text-sm text-destructive">{errors.contactPhone.message}</p>
        )}
      </div>

      {/* Preferred Sector */}
      <div className="space-y-2">
        <Label>Preferred Sector (Optional)</Label>
        <Select
          onValueChange={(value) => setValue('preferredSectorId', value)}
          value={selectedSectorId}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a sector" />
          </SelectTrigger>
          <SelectContent>
            {sectors?.map((sector) => (
              <SelectItem key={sector.id} value={sector.id}>
                {sector.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Preferred Education Level */}
      <div className="space-y-2">
        <Label>Preferred Education Level (Optional)</Label>
        <Select
          onValueChange={(value) => setValue('preferredEducationLevelId', value)}
          value={selectedEducationLevelId}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select education level" />
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

      {/* Placement Instructions */}
      <div className="space-y-2">
        <Label htmlFor="placementInstructions">Placement Instructions (Optional)</Label>
        <Textarea
          id="placementInstructions"
          placeholder="Any specific instructions for placement..."
          className="min-h-[100px]"
          {...register('placementInstructions')}
        />
      </div>

      {/* Submit */}
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
