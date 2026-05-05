'use client'

import { useState } from 'react'
import { Loader2, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from '@/lib/toast'
import { useUpdateVacancy } from '@/hooks/vacancies'
import { VacancyFormBuilder } from '@/components/domain/employer/vacancy-form-builder'
import type { FormDefinition } from '@/components/ui/form-system/types'
import type { VacancyResponse } from '@/lib/api'

export function ApplicationFormTab({ vacancy }: { vacancy: VacancyResponse }) {
  const update = useUpdateVacancy(vacancy.id)
  const [isEditing, setIsEditing] = useState(false)
  const [currentDef, setCurrentDef] = useState<FormDefinition | undefined>(
    vacancy.applicationForm as unknown as FormDefinition | undefined
  )
  // Key to force-remount VacancyFormBuilder when cancelling (resets its internal state)
  const [formKey, setFormKey] = useState(0)
  const [saving, setSaving] = useState(false)

  const isDraft = vacancy.status === 'DRAFT'

  function handleChange(def: FormDefinition) {
    setCurrentDef(def)
  }

  function handleEdit() {
    setIsEditing(true)
  }

  function handleCancel() {
    const original = vacancy.applicationForm as unknown as FormDefinition | undefined
    setCurrentDef(original)
    setFormKey((k) => k + 1)
    setIsEditing(false)
  }

  async function handleSave() {
    setSaving(true)
    try {
      await update.mutateAsync({ applicationForm: currentDef as unknown as Record<string, unknown> })
      toast.success('Application form saved')
      setIsEditing(false)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-3xl pb-10">
      {isDraft && !isEditing && (
        <div className="flex justify-end mb-3">
          <Button variant="outline" size="sm" onClick={handleEdit}>
            <Pencil className="size-3.5 mr-1.5" /> Edit
          </Button>
        </div>
      )}

      <VacancyFormBuilder
        key={formKey}
        definition={currentDef}
        onChange={isEditing ? handleChange : () => {}}
        readOnly={!isEditing}
      />

      {isEditing && (
        <div className="flex gap-3 mt-5">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
            Save form
          </Button>
          <Button variant="outline" onClick={handleCancel} disabled={saving}>
            Cancel
          </Button>
        </div>
      )}
    </div>
  )
}
