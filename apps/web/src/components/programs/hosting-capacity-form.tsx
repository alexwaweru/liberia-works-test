'use client'

import { useState } from 'react'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MultiSelect } from '@/components/ui/multi-select'
import { useCreateHostingCapacity, useCounties, useSectors, useEducationLevels } from '@/hooks/programs'
import { toast } from '@/lib/toast'
import type { HostingCapacity } from '@/lib/api'

const MAX_COUNTIES = 15

interface CountyRow {
  stateId: string
  slotsOffered: number
}

interface HostingCapacityFormProps {
  programId: string
  initial?: HostingCapacity | null
  onSuccess: () => void
}

export function HostingCapacityForm({ programId, initial, onSuccess }: HostingCapacityFormProps) {
  const isEdit = !!initial
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [rows, setRows] = useState<CountyRow[]>(() =>
    initial && initial.capacities.length > 0
      ? initial.capacities.map(c => ({ stateId: String(c.stateId), slotsOffered: c.slotsOffered }))
      : [{ stateId: '', slotsOffered: 1 }]
  )
  const [contactName, setContactName] = useState(initial?.contactName ?? '')
  const [contactPhone, setContactPhone] = useState(initial?.contactPhone ?? '')
  const [preferredSectors, setPreferredSectors] = useState<string[]>(initial?.preferredSectors ?? [])
  const [preferredEducationLevelId, setPreferredEducationLevelId] = useState<string>(initial?.preferredEducationLevelId ?? '')
  const [placementInstructions, setPlacementInstructions] = useState(initial?.placementInstructions ?? '')

  const createHostingCapacity = useCreateHostingCapacity()

  const { data: counties, isLoading: countiesLoading } = useCounties()
  const { data: sectors, isLoading: sectorsLoading } = useSectors()
  const { data: educationLevels, isLoading: educationLoading } = useEducationLevels()

  // Counties already selected in OTHER rows (for filtering each row's options)
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

    // Validate every row has a county selected
    if (rows.some(r => !r.stateId)) {
      toast.error('Please select a county for every row')
      return
    }

    if (preferredSectors.length === 0) {
      toast.error('Select at least one preferred sector')
      return
    }

    setIsSubmitting(true)
    try {
      await createHostingCapacity.mutateAsync({
        cycleId: programId,
        contactName,
        contactPhone,
        preferredSectors,
        preferredEducationLevelId: preferredEducationLevelId || undefined,
        placementInstructions: placementInstructions || undefined,
        capacities: rows.map(r => ({
          stateId: Number(r.stateId),
          slotsOffered: r.slotsOffered,
        })),
      })

      toast.success(isEdit ? 'Hosting capacity updated.' : 'You have opted into this program.')
      onSuccess()
    } catch (error) {
      const message = error instanceof Error ? error.message : isEdit ? 'Failed to update hosting capacity' : 'Failed to opt in'
      toast.error(message)
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

  const allCountiesUsed = rows.length >= MAX_COUNTIES

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* County capacity rows */}
      <div className="space-y-3">
        <Label>
          Counties and Slots <span className="text-destructive">*</span>
        </Label>

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
                      <SelectItem key={county.id} value={String(county.id)}>
                        {county.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="w-28">
                <Input
                  type="number"
                  min={1}
                  placeholder="Slots"
                  value={row.slotsOffered}
                  onChange={(e) => updateRow(idx, 'slotsOffered', Math.max(1, Number(e.target.value)))}
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
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </div>
          )
        })}

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addRow}
          disabled={allCountiesUsed}
          className="gap-1.5"
        >
          <Plus className="size-4" />
          Add county
        </Button>
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
          value={contactName}
          onChange={e => setContactName(e.target.value)}
          required
        />
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
          value={contactPhone}
          onChange={e => setContactPhone(e.target.value)}
          required
        />
      </div>

      {/* Preferred Sectors */}
      <div className="space-y-2">
        <Label>
          Preferred Sectors <span className="text-destructive">*</span>
        </Label>
        <MultiSelect
          options={(sectors ?? []).map((s) => ({ value: s.id, label: s.name }))}
          selected={preferredSectors}
          onChange={(value) => setPreferredSectors(value as string[])}
          placeholder="Select sectors..."
        />
      </div>

      {/* Preferred Education Level */}
      <div className="space-y-2">
        <Label>Preferred Education Level (Optional)</Label>
        <Select value={preferredEducationLevelId} onValueChange={setPreferredEducationLevelId}>
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
          value={placementInstructions}
          onChange={e => setPlacementInstructions(e.target.value)}
        />
      </div>

      {/* Submit */}
      <div className="flex justify-end gap-3 pt-4">
        <Button type="submit" disabled={isSubmitting} className="min-w-[120px]">
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              {isEdit ? 'Saving...' : 'Submitting...'}
            </>
          ) : (
            isEdit ? 'Save Changes' : 'Submit Opt-In'
          )}
        </Button>
      </div>
    </form>
  )
}
