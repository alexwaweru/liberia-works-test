'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { HostingCapacityForm } from './hosting-capacity-form'
import type { ProgramCycleListItem } from '@/lib/api'

interface HostingCapacityDialogProps {
  program: ProgramCycleListItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function HostingCapacityDialog({ program, open, onOpenChange }: HostingCapacityDialogProps) {
  if (!program) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Opt In to {program.name}</DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {program.year} • {new Date(program.startDate).toLocaleDateString()} to {new Date(program.endDate).toLocaleDateString()}
          </p>
        </DialogHeader>

        <HostingCapacityForm
          programId={program.id}
          onSuccess={() => {
            onOpenChange(false)
          }}
        />
      </DialogContent>
    </Dialog>
  )
}
