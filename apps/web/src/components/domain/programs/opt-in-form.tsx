'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useOptInMutation } from '@/hooks/programs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'

export function OptInForm({ cycleId }: { cycleId: string }) {
  const mutation = useOptInMutation(cycleId)
  const [handled, setHandled] = useState(false)

  const { data: counties } = useQuery({
    queryKey: ['counties', 'LR'],
    queryFn: async () => {
      const res = await fetch('/api/v1/reference/states?countryCode=LR')
      if (!res.ok) throw new Error('Failed to fetch counties')
      return res.json() as Promise<Array<{ id: number; name: string }>>
    },
  })

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    
    const payload = {
      slotsOffered: Number(fd.get('slotsOffered')),
      preferredSectorIds: fd.get('preferredSectorId') ? [fd.get('preferredSectorId') as string] : undefined,
      preferredEducationLevelId: (fd.get('preferredEducationLevelId') as string) || undefined,
      stateId: fd.get('stateId') ? Number(fd.get('stateId')) : undefined,
      contactName: fd.get('contactName') as string,
      contactPhone: fd.get('contactPhone') as string,
      placementInstructions: fd.get('placementInstructions') as string,
    }

    try {
      await mutation.mutateAsync(payload)
      toast.success('Opt-in successful!')
      setHandled(true)
    } catch (err) {
      toast.error('Failed to opt-in')
    }
  }

  if (handled) {
    return (
      <div className="p-6 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 rounded-lg text-center">
        <h3 className="text-lg font-semibold text-emerald-700 dark:text-emerald-400">Thank you for opting in!</h3>
        <p className="text-sm text-emerald-600 dark:text-emerald-500 mt-2">We will notify you once job seekers have been matched to your slots.</p>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="slotsOffered">Slots Offered</Label>
        <Input id="slotsOffered" name="slotsOffered" type="number" min="1" required defaultValue="1" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="stateId">County</Label>
          <Select name="stateId">
            <SelectTrigger>
              <SelectValue placeholder="Select a county" />
            </SelectTrigger>
            <SelectContent>
              {counties?.map((county) => (
                <SelectItem key={county.id} value={county.id.toString()}>
                  {county.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="preferredSectorId">Preferred Sector ID</Label>
          <Input id="preferredSectorId" name="preferredSectorId" type="text" placeholder="UUID..." />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="preferredEducationLevelId">Preferred Education Level ID</Label>
        <Input id="preferredEducationLevelId" name="preferredEducationLevelId" type="text" placeholder="UUID..." />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="contactName">Contact Name</Label>
          <Input id="contactName" name="contactName" required placeholder="John Doe" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contactPhone">Contact Phone</Label>
          <Input id="contactPhone" name="contactPhone" type="tel" required placeholder="+231..." />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="placementInstructions">Placement Instructions (Optional)</Label>
        <Textarea id="placementInstructions" name="placementInstructions" placeholder="Any specific requirements..." />
      </div>

      <Button type="submit" disabled={mutation.isPending} className="w-full">
        {mutation.isPending ? 'Submitting...' : 'Opt In'}
      </Button>
    </form>
  )
}
