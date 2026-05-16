'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { HostingCapacityForm } from './hosting-capacity-form'
import type { HostingCapacity, ProgramCycleListItem } from '@/lib/api'

interface HostingCapacityDialogProps {
  program: ProgramCycleListItem | null
  existingCapacity?: HostingCapacity | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function HostingCapacityDialog({ program, existingCapacity, open, onOpenChange }: HostingCapacityDialogProps) {
  if (!program) return null

  const isEdit = !!existingCapacity

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? `Manage Hosting for ${program.name}` : `Opt In to ${program.name}`}</DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {program.year} • {new Date(program.startDate).toLocaleDateString()} to {new Date(program.endDate).toLocaleDateString()}
          </p>
        </DialogHeader>

        <HostingCapacityForm
          programId={program.id}
          initial={existingCapacity}
          onSuccess={() => {
            onOpenChange(false)
          }}
        />
      </DialogContent>
    </Dialog>
  )
}
