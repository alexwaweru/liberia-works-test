'use client'

import { useMemo, useState, useCallback } from 'react'
import Link from 'next/link'
import { Plus, Loader2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { ListView } from '@/components/layout/list-view'
import type { ListItem, ColumnConfig, ViewMode, RenderCardFn } from '@/components/layout/list-view'
import { usePrograms, useDeleteProgramCycle } from '@/hooks/programs'
import { toast } from '@/lib/toast'
import type { ProgramCycleListItem } from '@/lib/api'
import type { DeleteProgramCycleConflict } from '@/lib/api'
import { cn } from '@/lib/utils'

const STATUS_COLORS: Record<string, string> = {
  PLANNED: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
  OPEN: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  MATCHING: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
  COMPLETED: 'bg-muted text-muted-foreground',
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center text-xs px-2 py-0.5 rounded-full font-medium',
        STATUS_COLORS[status] ?? STATUS_COLORS.COMPLETED
      )}
    >
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  )
}

function toListItem(cycle: ProgramCycleListItem): ListItem {
  return {
    id: cycle.id,
    name: cycle.name,
    metadata: { raw: cycle },
  }
}

function ProgramCard({
  item,
  onDelete,
}: {
  item: ListItem
  onDelete: (cycle: ProgramCycleListItem) => void
}) {
  const cycle = item.metadata.raw as ProgramCycleListItem

  return (
    <div className="flex flex-col gap-3 p-4 min-h-[140px]">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-sm leading-snug line-clamp-2">{cycle.name}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{cycle.year}</p>
        </div>
        <StatusBadge status={cycle.status} />
      </div>
      <div className="text-xs text-muted-foreground mt-auto pt-3 border-t border-border space-y-1">
        <p>Opens: {formatDate(cycle.startDate)}</p>
        <p>Closes: {formatDate(cycle.endDate)}</p>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/mol/programs/${cycle.id}/edit`}>Edit</Link>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-destructive"
          onClick={(e) => {
            e.stopPropagation()
            onDelete(cycle)
          }}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    </div>
  )
}

export default function MolProgramsPage() {
  const { data: page, isLoading, isError, error } = usePrograms()
  const cycles = useMemo(() => page?.data ?? [], [page])
  const deleteMutation = useDeleteProgramCycle()
  const [view, setView] = useState<ViewMode>('table')
  const [pendingDelete, setPendingDelete] = useState<ProgramCycleListItem | null>(null)

  async function handleConfirmDelete() {
    if (!pendingDelete) return
    const id = pendingDelete.id
    setPendingDelete(null)
    try {
      await deleteMutation.mutateAsync(id)
      toast.success('Program cycle deleted')
    } catch (err: unknown) {
      const e = err as Error & { status?: number; details?: DeleteProgramCycleConflict['details'] }
      if (e.status === 409 && e.details) {
        const { optIns, hostingCapacities, placements } = e.details
        const parts: string[] = []
        if (optIns > 0) parts.push(`${optIns} opt-in${optIns !== 1 ? 's' : ''}`)
        if (hostingCapacities > 0) parts.push(`${hostingCapacities} hosting capacit${hostingCapacities !== 1 ? 'ies' : 'y'}`)
        if (placements > 0) parts.push(`${placements} placement${placements !== 1 ? 's' : ''}`)
        toast.error(`Cannot delete: ${parts.join(', ')}`)
      } else {
        toast.error(e.message ?? 'Failed to delete program cycle')
      }
    }
  }

  const items: ListItem[] = useMemo(() => cycles.map(toListItem), [cycles])

  const columns: ColumnConfig[] = useMemo(
    () => [
      { key: 'name', label: 'Name', sortable: false, width: '35%' },
      {
        key: 'year',
        label: 'Year',
        sortable: false,
        render: (_, item) => {
          const cycle = item.metadata.raw as ProgramCycleListItem
          return <span className="text-sm text-muted-foreground">{cycle.year}</span>
        },
      },
      {
        key: 'status',
        label: 'Status',
        sortable: false,
        render: (_, item) => {
          const cycle = item.metadata.raw as ProgramCycleListItem
          return <StatusBadge status={cycle.status} />
        },
      },
      {
        key: 'startDate',
        label: 'Opens',
        sortable: false,
        render: (_, item) => {
          const cycle = item.metadata.raw as ProgramCycleListItem
          return <span className="text-sm text-muted-foreground">{formatDate(cycle.startDate)}</span>
        },
      },
      {
        key: 'endDate',
        label: 'Closes',
        sortable: false,
        render: (_, item) => {
          const cycle = item.metadata.raw as ProgramCycleListItem
          return <span className="text-sm text-muted-foreground">{formatDate(cycle.endDate)}</span>
        },
      },
      {
        key: 'actions',
        label: '',
        sortable: false,
        render: (_, item) => {
          const cycle = item.metadata.raw as ProgramCycleListItem
          return (
            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/mol/programs/${cycle.id}/edit`}>Edit</Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-destructive"
                onClick={() => setPendingDelete(cycle)}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          )
        },
      },
    ],
    []
  )

  const renderCard: RenderCardFn = useCallback(
    (item) => <ProgramCard item={item} onDelete={setPendingDelete} />,
    []
  )

  return (
    <div className="flex flex-col h-full min-h-0 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Programs</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage program cycle descriptions and details.
          </p>
        </div>
        <Button asChild>
          <Link href="/mol/programs/new">
            <Plus className="size-4 mr-2" />
            Create Program
          </Link>
        </Button>
      </div>

      {isError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          Failed to load programs: {error instanceof Error ? error.message : 'Unknown error'}
        </div>
      )}

      <ListView
        items={items}
        view={view}
        onViewChange={setView}
        columns={columns}
        renderCard={renderCard}
        emptyState={
          isLoading
            ? () => (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="size-5 animate-spin text-muted-foreground" />
                </div>
              )
            : undefined
        }
        className="flex-1 min-h-0 rounded-lg border border-border overflow-hidden"
      />

      <AlertDialog
        open={!!pendingDelete}
        onOpenChange={(open) => { if (!open) setPendingDelete(null) }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this program cycle?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the cycle. Cycles with opt-ins or placements
              can&apos;t be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <Loader2 className="size-4 animate-spin mr-2" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
