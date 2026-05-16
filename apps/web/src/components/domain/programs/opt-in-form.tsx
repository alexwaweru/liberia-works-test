'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Plus, Trash2 } from 'lucide-react'
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

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"
const MAX_COUNTIES = 15

interface CountyRow {
  stateId: string
  slotsOffered: number
}

export function OptInForm({ cycleId }: { cycleId: string }) {
  const mutation = useOptInMutation(cycleId)
  const [handled, setHandled] = useState(false)
  const [rows, setRows] = useState<CountyRow[]>([{ stateId: '', slotsOffered: 1 }])

  const { data: counties } = useQuery({
    queryKey: ['reference', 'counties'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/v1/reference/states?countryCode=LR`)
      if (!res.ok) throw new Error('Failed to fetch counties')
      return res.json() as Promise<Array<{ id: number; name: string }>>
    },
  })

  const { data: sectors } = useQuery({
    queryKey: ['reference', 'sectors'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/v1/reference/sectors`)
      if (!res.ok) throw new Error('Failed to fetch sectors')
      return res.json() as Promise<Array<{ id: string; name: string }>>
    },
  })

  const { data: educationLevels } = useQuery({
    queryKey: ['reference', 'education-levels'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/v1/reference/education-levels`)
      if (!res.ok) throw new Error('Failed to fetch education levels')
      return res.json() as Promise<Array<{ id: string; name: string }>>
    },
  })

  // Counties selected in other rows
  function usedStateIds(currentIdx: number): Set<string> {
    const used = new Set<string>()
    rows.forEach((r, i) => {
      if (i !== currentIdx && r.stateId) used.add(r.stateId)
    })
    return used
  }

  function addRow() {
    if (rows.length >= MAX_COUNTIES) return
    setRows(prev => [...prev, { stateId: '', slotsOffered: 1 }])
  }

  function removeRow(idx: number) {
    if (rows.length <= 1) return
    setRows(prev => prev.filter((_, i) => i !== idx))
  }

  function updateRow(idx: number, field: keyof CountyRow, value: string | number) {
    setRows(prev => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r))
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (rows.some(r => !r.stateId)) {
      toast.error('Please select a county for every row')
      return
    }

    const fd = new FormData(e.currentTarget)

    const preferredSectorId = (fd.get('preferredSectorId') as string) || ''
    const payload = {
      contactName: fd.get('contactName') as string,
      contactPhone: fd.get('contactPhone') as string,
      preferredSectors: preferredSectorId ? [preferredSectorId] : [],
      preferredEducationLevelId: (fd.get('preferredEducationLevelId') as string) || undefined,
      placementInstructions: (fd.get('placementInstructions') as string) || undefined,
      capacities: rows.map(r => ({
        stateId: Number(r.stateId),
        slotsOffered: r.slotsOffered,
      })),
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
      {/* County repeater */}
      <div className="space-y-2">
        <Label>Counties and Slots <span className="text-red-500">*</span></Label>
        {rows.map((row, idx) => {
          const used = usedStateIds(idx)
          const availableCounties = (counties ?? []).filter(c => !used.has(String(c.id)))
          return (
            <div key={idx} className="flex items-center gap-2">
              <div className="flex-1">
                <Select
                  value={row.stateId}
                  onValueChange={(val) => updateRow(idx, 'stateId', val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a county" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCounties.map((county) => (
                      <SelectItem key={county.id} value={county.id.toString()}>
                        {county.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-24">
                <Input
                  type="number"
                  min={1}
                  placeholder="Slots"
                  value={row.slotsOffered}
                  onChange={e => updateRow(idx, 'slotsOffered', Math.max(1, Number(e.target.value)))}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeRow(idx)}
                disabled={rows.length <= 1}
                aria-label="Remove county"
              >
                <Trash2 className="size-4 text-red-500" />
              </Button>
            </div>
          )
        })}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addRow}
          disabled={rows.length >= MAX_COUNTIES}
          className="gap-1.5"
        >
          <Plus className="size-4" />
          Add county
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="preferredSectorId">Preferred Sector</Label>
          <Select name="preferredSectorId">
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
        <div className="space-y-2">
          <Label htmlFor="preferredEducationLevelId">Preferred Education Level</Label>
          <Select name="preferredEducationLevelId">
            <SelectTrigger>
              <SelectValue placeholder="Select an education level" />
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
