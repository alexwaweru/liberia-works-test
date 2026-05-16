'use client'

import { useState, useMemo, useCallback, Suspense, useEffect, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Plus,
  Loader2,
  MoreHorizontal,
  Mail,
  RefreshCw,
  Trash2,
  UserCog,
  Search,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ListView } from '@/components/layout/list-view'
import type { ListItem, ColumnConfig, ViewMode, RenderCardFn } from '@/components/layout/list-view'
import {
  useEmployerUsers,
  useInviteEmployerUser,
  useResendInvite,
  useRevokeInvite,
  useUpdateEmployerUserRole,
  useRemoveEmployerUser,
} from '@/hooks/employer-users'
import {
  useWorkforceEmployees,
  useCreateWorkforceEmployee,
  useUpdateWorkforceEmployee,
  useDeleteWorkforceEmployee,
} from '@/hooks/workforce-employees'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'
import type { EmployerUserListItem, WorkforceEmployee, WorkforceEmployeeFilters } from '@/lib/api'
import { CreateWorkforceEmployeeSchema } from '@liberia-works/shared-schemas'

type EmploymentType = 'PERMANENT' | 'CONTRACT' | 'CASUAL' | 'INTERN'
type WorkforceFormValues = z.infer<typeof CreateWorkforceEmployeeSchema>

// ── Constants ────────────────────────────────────────────────────────────────

const TABS = [
  { label: 'Team members', value: 'team' },
  { label: 'Workforce', value: 'workforce' },
] as const

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  ACTIVE: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  INACTIVE: 'bg-muted text-muted-foreground',
}

const EMPLOYMENT_TYPE_LABELS: Record<EmploymentType, string> = {
  PERMANENT: 'Permanent',
  CONTRACT: 'Contract',
  CASUAL: 'Casual',
  INTERN: 'Intern',
}

const AVATAR_COLORS = [
  'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
]

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/)
  if (words.length === 1) return words[0]!.charAt(0).toUpperCase()
  return (words[0]!.charAt(0) + words[1]!.charAt(0)).toUpperCase()
}

function avatarColor(id: string): string {
  return AVATAR_COLORS[id.charCodeAt(0) % AVATAR_COLORS.length]!
}

function formatDate(d: string | null): string {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ── Invite dialog ────────────────────────────────────────────────────────────

const InviteSchema = z.object({
  email: z.string().email('Invalid email'),
  role: z.enum(['ADMIN', 'HR']),
})
type InviteValues = z.infer<typeof InviteSchema>

function InviteDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const invite = useInviteEmployerUser()
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors },
  } = useForm<InviteValues>({
    resolver: zodResolver(InviteSchema),
    defaultValues: { role: 'HR' },
  })

  const role = watch('role')

  function onSubmit(values: InviteValues) {
    invite.mutate(values, {
      onSuccess: () => {
        toast.success('Invite sent')
        reset()
        onClose()
      },
      onError: (e) => toast.error(e.message),
    })
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite team member</DialogTitle>
          <DialogDescription>
            Send an invitation to join your employer account.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="invite-email">Email</Label>
            <Input
              id="invite-email"
              type="email"
              placeholder="colleague@company.com"
              {...register('email')}
              aria-invalid={!!errors.email}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="invite-role">Role</Label>
            <Select
              value={role}
              onValueChange={(v) => setValue('role', v as 'ADMIN' | 'HR')}
            >
              <SelectTrigger id="invite-role" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="HR">HR</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={invite.isPending}>
              {invite.isPending && <Loader2 className="size-4 animate-spin" />}
              Send invite
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ── Team member card ─────────────────────────────────────────────────────────

function TeamMemberCard({ item, onAction }: {
  item: ListItem
  onAction: (action: string, member: EmployerUserListItem) => void
}) {
  const member = item.metadata.raw as EmployerUserListItem
  const initials = getInitials(member.fullName ?? member.email)
  const color = avatarColor(member.id)

  return (
    <div className="flex flex-col gap-3 p-4 h-full min-h-[140px]">
      <div className="flex items-start gap-3">
        <Avatar className="size-10 shrink-0">
          <AvatarFallback className={cn('text-sm font-bold', color)}>{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm leading-snug truncate">
            {member.fullName ?? '(pending)'}
          </p>
          <p className="text-xs text-muted-foreground truncate">{member.email}</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 shrink-0">
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {member.status === 'PENDING' && (
              <>
                <DropdownMenuItem onClick={() => onAction('resend', member)}>
                  <RefreshCw className="size-4" /> Resend invite
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => onAction('revoke', member)}
                >
                  <Trash2 className="size-4" /> Revoke invite
                </DropdownMenuItem>
              </>
            )}
            {member.status === 'ACTIVE' && member.userId && (
              <>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <UserCog className="size-4" /> Change role
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem onClick={() => onAction('role-admin', member)}>
                      Admin
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onAction('role-hr', member)}>
                      HR
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => onAction('remove', member)}
                >
                  <Trash2 className="size-4" /> Remove from team
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="flex flex-wrap gap-1.5">
        <span className="bg-muted text-muted-foreground text-xs px-2 py-0.5 rounded-full">
          {member.role}
        </span>
        <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', STATUS_COLORS[member.status])}>
          {member.status.charAt(0) + member.status.slice(1).toLowerCase()}
        </span>
      </div>
      <p className="text-xs text-muted-foreground mt-auto">
        {member.acceptedAt ? `Joined ${formatDate(member.acceptedAt)}` : `Invited ${formatDate(member.invitedAt)}`}
      </p>
    </div>
  )
}

// ── Confirm dialog ───────────────────────────────────────────────────────────

function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  onConfirm,
  onClose,
  loading,
}: {
  open: boolean
  title: string
  description: string
  confirmLabel: string
  onConfirm: () => void
  onClose: () => void
  loading?: boolean
}) {
  return (
    <AlertDialog open={open} onOpenChange={(o) => !o && onClose()}>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading && <Loader2 className="size-4 animate-spin" />}
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// ── Team tab ─────────────────────────────────────────────────────────────────

function TeamTab({ onOpenInvite }: { onOpenInvite: () => void }) {
  const [cursor, setCursor] = useState<string | undefined>()
  const [cursorStack, setCursorStack] = useState<string[]>([])
  const [pageOffset, setPageOffset] = useState(0)
  const [view, setView] = useState<ViewMode>('card')
  const [confirmState, setConfirmState] = useState<{
    type: 'revoke' | 'remove'
    member: EmployerUserListItem
  } | null>(null)

  const { data: page, isLoading } = useEmployerUsers(cursor)
  const members = useMemo(() => page?.data ?? [], [page])
  const pagination = page?.pagination

  const resend = useResendInvite()
  const revoke = useRevokeInvite()
  const updateRole = useUpdateEmployerUserRole()
  const removeUser = useRemoveEmployerUser()

  const handleAction = useCallback(
    async (action: string, member: EmployerUserListItem) => {
      try {
        if (action === 'resend') {
          await resend.mutateAsync(member.id)
          toast.success('Invite resent')
        } else if (action === 'revoke') {
          setConfirmState({ type: 'revoke', member })
        } else if (action === 'role-admin' && member.userId) {
          await updateRole.mutateAsync({ userId: member.userId, role: 'ADMIN' })
          toast.success('Role updated')
        } else if (action === 'role-hr' && member.userId) {
          await updateRole.mutateAsync({ userId: member.userId, role: 'HR' })
          toast.success('Role updated')
        } else if (action === 'remove') {
          setConfirmState({ type: 'remove', member })
        }
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : 'Action failed')
      }
    },
    [resend, updateRole]
  )

  async function handleConfirm() {
    if (!confirmState) return
    const { type, member } = confirmState
    try {
      if (type === 'revoke') {
        await revoke.mutateAsync(member.id)
        toast.success('Invite revoked')
      } else if (type === 'remove' && member.userId) {
        await removeUser.mutateAsync(member.userId)
        toast.success('User removed')
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Action failed')
    } finally {
      setConfirmState(null)
    }
  }

  const columns: ColumnConfig[] = useMemo(
    () => [
      {
        key: 'name',
        label: 'Name',
        sortable: false,
        width: '25%',
        render: (_, item) => {
          const member = item.metadata.raw as EmployerUserListItem
          const initials = getInitials(member.fullName ?? member.email)
          const color = avatarColor(member.id)
          return (
            <div className="flex items-center gap-2.5">
              <Avatar className="size-7 shrink-0">
                <AvatarFallback className={cn('text-xs font-bold', color)}>{initials}</AvatarFallback>
              </Avatar>
              <span className="font-medium text-sm">{member.fullName ?? '—'}</span>
            </div>
          )
        },
      },
      {
        key: 'email',
        label: 'Email',
        sortable: false,
        render: (_, item) => {
          const member = item.metadata.raw as EmployerUserListItem
          return <span className="text-muted-foreground text-sm">{member.email}</span>
        },
      },
      {
        key: 'role',
        label: 'Role',
        sortable: false,
        render: (_, item) => {
          const member = item.metadata.raw as EmployerUserListItem
          return (
            <span className="bg-muted text-muted-foreground text-xs px-2 py-0.5 rounded-full">
              {member.role}
            </span>
          )
        },
      },
      {
        key: 'status',
        label: 'Status',
        sortable: false,
        render: (_, item) => {
          const member = item.metadata.raw as EmployerUserListItem
          return (
            <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', STATUS_COLORS[member.status])}>
              {member.status.charAt(0) + member.status.slice(1).toLowerCase()}
            </span>
          )
        },
      },
      {
        key: 'joined',
        label: 'Joined',
        sortable: false,
        render: (_, item) => {
          const member = item.metadata.raw as EmployerUserListItem
          return (
            <span className="text-muted-foreground text-sm">
              {formatDate(member.acceptedAt ?? member.invitedAt)}
            </span>
          )
        },
      },
      {
        key: 'actions',
        label: '',
        sortable: false,
        render: (_, item) => {
          const member = item.metadata.raw as EmployerUserListItem
          return (
            <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                    <MoreHorizontal className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {member.status === 'PENDING' && (
                    <>
                      <DropdownMenuItem onClick={() => handleAction('resend', member)}>
                        <RefreshCw className="size-4" /> Resend invite
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => handleAction('revoke', member)}
                      >
                        <Trash2 className="size-4" /> Revoke invite
                      </DropdownMenuItem>
                    </>
                  )}
                  {member.status === 'ACTIVE' && member.userId && (
                    <>
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                          <UserCog className="size-4" /> Change role
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                          <DropdownMenuItem onClick={() => handleAction('role-admin', member)}>Admin</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleAction('role-hr', member)}>HR</DropdownMenuItem>
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => handleAction('remove', member)}
                      >
                        <Trash2 className="size-4" /> Remove from team
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )
        },
      },
    ],
    [handleAction]
  )

  const renderCard: RenderCardFn = useCallback(
    (item, _helpers) => <TeamMemberCard item={item} onAction={handleAction} />,
    [handleAction]
  )

  const items: ListItem[] = useMemo(
    () =>
      members.map((m) => ({
        id: m.id,
        name: m.fullName ?? m.email,
        metadata: { raw: m },
      })),
    [members]
  )

  const total = pagination?.total ?? 0
  const start = pageOffset + 1
  const end = pageOffset + members.length

  const paginationFooter =
    total > 0 ? (
      <div className="flex items-center justify-between px-3 py-2 border-t border-border">
        <p className="text-xs text-muted-foreground">
          Showing {start}–{end} of {total} {total === 1 ? 'member' : 'members'}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const stack = [...cursorStack]
              const prev = stack.pop()
              setCursorStack(stack)
              setPageOffset((o) => o - 20)
              setCursor(prev === '' ? undefined : prev)
            }}
            disabled={cursorStack.length === 0}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (!pagination?.nextCursor) return
              setCursorStack((s) => [...s, cursor ?? ''])
              setPageOffset((o) => o + 20)
              setCursor(pagination.nextCursor ?? undefined)
            }}
            disabled={!pagination?.hasMore}
          >
            Next
          </Button>
        </div>
      </div>
    ) : null

  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-muted-foreground">
          {total > 0 ? `${total} ${total === 1 ? 'member' : 'members'}` : ''}
        </p>
        <Button size="sm" onClick={onOpenInvite}>
          <Mail className="size-4" /> Invite team member
        </Button>
      </div>

      <ListView
        items={items}
        view={view}
        onViewChange={setView}
        columns={columns}
        renderCard={renderCard}
        searchPlaceholder="Search team members..."
        emptyState={
          isLoading
            ? () => (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="size-5 animate-spin text-muted-foreground" />
                </div>
              )
            : undefined
        }
        footer={paginationFooter}
        className="flex-1 min-h-0 rounded-lg border border-border overflow-hidden"
      />

      <ConfirmDialog
        open={confirmState?.type === 'revoke'}
        title="Revoke invite"
        description={`Revoke the invitation sent to ${confirmState?.member.email}? They will no longer be able to join.`}
        confirmLabel="Revoke"
        onConfirm={handleConfirm}
        onClose={() => setConfirmState(null)}
        loading={revoke.isPending}
      />
      <ConfirmDialog
        open={confirmState?.type === 'remove'}
        title="Remove team member"
        description={`Remove ${confirmState?.member.fullName ?? confirmState?.member.email} from your team? They will lose access immediately.`}
        confirmLabel="Remove"
        onConfirm={handleConfirm}
        onClose={() => setConfirmState(null)}
        loading={removeUser.isPending}
      />
    </>
  )
}

// ── Workforce form dialog ─────────────────────────────────────────────────────

function WorkforceFormDialog({
  open,
  onClose,
  editTarget,
}: {
  open: boolean
  onClose: () => void
  editTarget: WorkforceEmployee | null
}) {
  const create = useCreateWorkforceEmployee()
  const update = useUpdateWorkforceEmployee()
  const isEdit = editTarget !== null

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<WorkforceFormValues>({
    resolver: zodResolver(CreateWorkforceEmployeeSchema),
    defaultValues: {
      fullName: '',
      nationality: '',
      position: '',
      department: '',
      employmentType: 'PERMANENT',
      hireDate: '',
    },
  })

  const employmentType = watch('employmentType')
  const gender = watch('gender')

  // Populate form when editing
  useEffect(() => {
    if (editTarget) {
      reset({
        fullName: editTarget.fullName,
        nationality: editTarget.nationality,
        position: editTarget.position,
        department: editTarget.department ?? '',
        employmentType: editTarget.employmentType,
        hireDate: editTarget.hireDate,
        gender: editTarget.gender ?? undefined,
        terminationDate: editTarget.terminationDate ?? undefined,
        email: editTarget.email ?? undefined,
        phone: editTarget.phone ?? undefined,
        salary: editTarget.salary ?? undefined,
      })
    } else {
      reset({
        fullName: '',
        nationality: '',
        position: '',
        department: '',
        employmentType: 'PERMANENT',
        hireDate: '',
      })
    }
  }, [editTarget, reset])

  function onSubmit(values: WorkforceFormValues) {
    // Strip empty optional strings to undefined so backend doesn't get empty string
    const clean = Object.fromEntries(
      Object.entries(values).filter(([, v]) => v !== '' && v !== undefined)
    ) as Parameters<typeof create.mutate>[0]

    if (isEdit && editTarget) {
      update.mutate(
        { id: editTarget.id, payload: clean },
        {
          onSuccess: () => {
            toast.success('Employee updated')
            onClose()
          },
          onError: (e) => toast.error(e.message),
        }
      )
    } else {
      create.mutate(clean, {
        onSuccess: () => {
          toast.success('Employee added')
          onClose()
        },
        onError: (e) => toast.error(e.message),
      })
    }
  }

  const isPending = create.isPending || update.isPending

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit employee' : 'Add workforce employee'}</DialogTitle>
          <DialogDescription>
            Fill in the employee details. Fields marked with * are required.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Basic info */}
          <fieldset className="space-y-4 mb-6">
            <legend className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
              Basic info
            </legend>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="wf-fullName">Full name *</Label>
                <Input
                  id="wf-fullName"
                  {...register('fullName')}
                  aria-invalid={!!errors.fullName}
                />
                {errors.fullName && (
                  <p className="text-xs text-destructive">{errors.fullName.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="wf-nationality">Nationality *</Label>
                <Input
                  id="wf-nationality"
                  placeholder="e.g. Liberian"
                  {...register('nationality')}
                  aria-invalid={!!errors.nationality}
                />
                {errors.nationality && (
                  <p className="text-xs text-destructive">{errors.nationality.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="wf-gender">Gender</Label>
                <Select
                  value={gender ?? ''}
                  onValueChange={(v) =>
                    setValue('gender', v as 'MALE' | 'FEMALE' | 'PREFER_NOT_TO_SAY' | undefined)
                  }
                >
                  <SelectTrigger id="wf-gender" className="w-full">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MALE">Male</SelectItem>
                    <SelectItem value="FEMALE">Female</SelectItem>
                    <SelectItem value="PREFER_NOT_TO_SAY">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </fieldset>

          {/* Employment */}
          <fieldset className="space-y-4 mb-6">
            <legend className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
              Employment
            </legend>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="wf-position">Position *</Label>
                <Input
                  id="wf-position"
                  {...register('position')}
                  aria-invalid={!!errors.position}
                />
                {errors.position && (
                  <p className="text-xs text-destructive">{errors.position.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="wf-department">Department</Label>
                <Input
                  id="wf-department"
                  {...register('department')}
                  aria-invalid={!!errors.department}
                />
                {errors.department && (
                  <p className="text-xs text-destructive">{errors.department.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="wf-employmentType">Employment type *</Label>
                <Select
                  value={employmentType}
                  onValueChange={(v) => setValue('employmentType', v as EmploymentType)}
                >
                  <SelectTrigger id="wf-employmentType" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERMANENT">Permanent</SelectItem>
                    <SelectItem value="CONTRACT">Contract</SelectItem>
                    <SelectItem value="CASUAL">Casual</SelectItem>
                    <SelectItem value="INTERN">Intern</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="wf-hireDate">Hire date *</Label>
                <Input
                  id="wf-hireDate"
                  type="date"
                  {...register('hireDate')}
                  aria-invalid={!!errors.hireDate}
                />
                {errors.hireDate && (
                  <p className="text-xs text-destructive">{errors.hireDate.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="wf-terminationDate">Termination date</Label>
                <Input
                  id="wf-terminationDate"
                  type="date"
                  {...register('terminationDate')}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="wf-salary">Salary (LRD)</Label>
                <Input
                  id="wf-salary"
                  placeholder="e.g. 5000.00"
                  {...register('salary')}
                  aria-invalid={!!errors.salary}
                />
                {errors.salary && (
                  <p className="text-xs text-destructive">{errors.salary.message}</p>
                )}
              </div>
            </div>
          </fieldset>

          {/* Contact */}
          <fieldset className="space-y-4 mb-6">
            <legend className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
              Contact
            </legend>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="wf-email">Email</Label>
                <Input
                  id="wf-email"
                  type="email"
                  {...register('email')}
                  aria-invalid={!!errors.email}
                />
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="wf-phone">Phone (E.164)</Label>
                <Input
                  id="wf-phone"
                  placeholder="+231770123456"
                  {...register('phone')}
                  aria-invalid={!!errors.phone}
                />
                {errors.phone && (
                  <p className="text-xs text-destructive">{errors.phone.message}</p>
                )}
              </div>
            </div>
          </fieldset>

          <DialogFooter className="sticky bottom-0 bg-background pt-2 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="size-4 animate-spin" />}
              {isEdit ? 'Save changes' : 'Add employee'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ── Workforce card ────────────────────────────────────────────────────────────

function WorkforceCard({
  item,
  onEdit,
  onDelete,
}: {
  item: ListItem
  onEdit: (emp: WorkforceEmployee) => void
  onDelete: (emp: WorkforceEmployee) => void
}) {
  const emp = item.metadata.raw as WorkforceEmployee
  const initials = getInitials(emp.fullName)
  const color = avatarColor(emp.id)

  return (
    <div className="flex flex-col gap-3 p-4 h-full min-h-[140px]">
      <div className="flex items-start gap-3">
        <Avatar className="size-10 shrink-0">
          <AvatarFallback className={cn('text-sm font-bold', color)}>{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm leading-snug truncate">{emp.fullName}</p>
          <p className="text-xs text-muted-foreground truncate">{emp.position}</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 shrink-0">
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(emp)}>Edit</DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => onDelete(emp)}
            >
              Archive
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="flex flex-wrap gap-1.5">
        <span className="bg-muted text-muted-foreground text-xs px-2 py-0.5 rounded-full">
          {EMPLOYMENT_TYPE_LABELS[emp.employmentType]}
        </span>
        {emp.department && (
          <span className="bg-muted text-muted-foreground text-xs px-2 py-0.5 rounded-full">
            {emp.department}
          </span>
        )}
      </div>
      <p className="text-xs text-muted-foreground mt-auto">
        Hired {formatDate(emp.hireDate)}
      </p>
    </div>
  )
}

// ── Workforce tab ─────────────────────────────────────────────────────────────

function WorkforceTab({ onOpenAdd }: { onOpenAdd: () => void }) {
  const [view, setView] = useState<ViewMode>('card')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [filterType, setFilterType] = useState<EmploymentType | ''>('')
  const [cursor, setCursor] = useState<string | undefined>()
  const [cursorStack, setCursorStack] = useState<string[]>([])
  const [pageOffset, setPageOffset] = useState(0)
  const [editTarget, setEditTarget] = useState<WorkforceEmployee | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<WorkforceEmployee | null>(null)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const deleteEmp = useDeleteWorkforceEmployee()

  // Debounce search
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => setDebouncedSearch(search), 350)
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
    }
  }, [search])

  const filters: WorkforceEmployeeFilters = {
    cursor,
    search: debouncedSearch || undefined,
    employmentType: filterType || undefined,
  }

  const { data: page, isLoading } = useWorkforceEmployees(filters)
  const employees = useMemo(() => page?.data ?? [], [page])
  const pagination = page?.pagination

  const columns: ColumnConfig[] = useMemo(
    () => [
      {
        key: 'name',
        label: 'Name',
        sortable: false,
        width: '20%',
        render: (_, item) => {
          const emp = item.metadata.raw as WorkforceEmployee
          const initials = getInitials(emp.fullName)
          const color = avatarColor(emp.id)
          return (
            <div className="flex items-center gap-2.5">
              <Avatar className="size-7 shrink-0">
                <AvatarFallback className={cn('text-xs font-bold', color)}>{initials}</AvatarFallback>
              </Avatar>
              <span className="font-medium text-sm">{emp.fullName}</span>
            </div>
          )
        },
      },
      {
        key: 'position',
        label: 'Position',
        sortable: false,
        render: (_, item) => {
          const emp = item.metadata.raw as WorkforceEmployee
          return <span className="text-sm">{emp.position}</span>
        },
      },
      {
        key: 'department',
        label: 'Department',
        sortable: false,
        render: (_, item) => {
          const emp = item.metadata.raw as WorkforceEmployee
          return <span className="text-muted-foreground text-sm">{emp.department ?? '—'}</span>
        },
      },
      {
        key: 'employmentType',
        label: 'Type',
        sortable: false,
        render: (_, item) => {
          const emp = item.metadata.raw as WorkforceEmployee
          return (
            <span className="bg-muted text-muted-foreground text-xs px-2 py-0.5 rounded-full">
              {EMPLOYMENT_TYPE_LABELS[emp.employmentType]}
            </span>
          )
        },
      },
      {
        key: 'hireDate',
        label: 'Hire date',
        sortable: false,
        render: (_, item) => {
          const emp = item.metadata.raw as WorkforceEmployee
          return <span className="text-muted-foreground text-sm">{formatDate(emp.hireDate)}</span>
        },
      },
      {
        key: 'status',
        label: 'Status',
        sortable: false,
        render: (_, item) => {
          const emp = item.metadata.raw as WorkforceEmployee
          return (
            <span
              className={cn(
                'text-xs px-2 py-0.5 rounded-full font-medium',
                emp.isActive
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {emp.isActive ? 'Active' : 'Inactive'}
            </span>
          )
        },
      },
      {
        key: 'actions',
        label: '',
        sortable: false,
        render: (_, item) => {
          const emp = item.metadata.raw as WorkforceEmployee
          return (
            <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                    <MoreHorizontal className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setEditTarget(emp)}>Edit</DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => setDeleteTarget(emp)}
                  >
                    Archive
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )
        },
      },
    ],
    []
  )

  const renderCard: RenderCardFn = useCallback(
    (item, _helpers) => (
      <WorkforceCard
        item={item}
        onEdit={setEditTarget}
        onDelete={setDeleteTarget}
      />
    ),
    []
  )

  const items: ListItem[] = useMemo(
    () =>
      employees.map((e) => ({
        id: e.id,
        name: e.fullName,
        metadata: { raw: e },
      })),
    [employees]
  )

  const total = pagination?.total ?? 0
  const start = pageOffset + 1
  const end = pageOffset + employees.length

  const paginationFooter =
    total > 0 ? (
      <div className="flex items-center justify-between px-3 py-2 border-t border-border">
        <p className="text-xs text-muted-foreground">
          Showing {start}–{end} of {total} {total === 1 ? 'employee' : 'employees'}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const stack = [...cursorStack]
              const prev = stack.pop()
              setCursorStack(stack)
              setPageOffset((o) => o - 20)
              setCursor(prev === '' ? undefined : prev)
            }}
            disabled={cursorStack.length === 0}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (!pagination?.nextCursor) return
              setCursorStack((s) => [...s, cursor ?? ''])
              setPageOffset((o) => o + 20)
              setCursor(pagination.nextCursor ?? undefined)
            }}
            disabled={!pagination?.hasMore}
          >
            Next
          </Button>
        </div>
      </div>
    ) : null

  return (
    <>
      <div className="flex items-center gap-2 justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
            <Input
              className="pl-8 h-8 w-56 text-sm"
              placeholder="Search workforce..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select
            value={filterType || 'ALL'}
            onValueChange={(v) => {
              setFilterType(v === 'ALL' ? '' : (v as EmploymentType))
              setCursor(undefined)
              setCursorStack([])
              setPageOffset(0)
            }}
          >
            <SelectTrigger className="h-8 text-sm w-36">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All types</SelectItem>
              <SelectItem value="PERMANENT">Permanent</SelectItem>
              <SelectItem value="CONTRACT">Contract</SelectItem>
              <SelectItem value="CASUAL">Casual</SelectItem>
              <SelectItem value="INTERN">Intern</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button size="sm" onClick={onOpenAdd}>
          <Plus className="size-4" /> Add employee
        </Button>
      </div>

      <ListView
        items={items}
        view={view}
        onViewChange={setView}
        columns={columns}
        renderCard={renderCard}
        searchPlaceholder="Search workforce..."
        emptyState={
          isLoading
            ? () => (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="size-5 animate-spin text-muted-foreground" />
                </div>
              )
            : undefined
        }
        footer={paginationFooter}
        className="flex-1 min-h-0 rounded-lg border border-border overflow-hidden"
      />

      <WorkforceFormDialog
        open={editTarget !== null}
        onClose={() => setEditTarget(null)}
        editTarget={editTarget}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Archive employee"
        description={`Archive ${deleteTarget?.fullName}? Their record will be kept but marked inactive.`}
        confirmLabel="Archive"
        onConfirm={async () => {
          if (!deleteTarget) return
          try {
            await deleteEmp.mutateAsync(deleteTarget.id)
            toast.success('Employee archived')
          } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : 'Failed to archive')
          } finally {
            setDeleteTarget(null)
          }
        }}
        onClose={() => setDeleteTarget(null)}
        loading={deleteEmp.isPending}
      />
    </>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

function EmployeesInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const tab = (searchParams.get('tab') ?? 'team') as 'team' | 'workforce'

  const [inviteOpen, setInviteOpen] = useState(searchParams.get('action') === 'invite')
  const [addWorkforceOpen, setAddWorkforceOpen] = useState(false)

  function handleTabChange(value: 'team' | 'workforce') {
    const q = new URLSearchParams()
    q.set('tab', value)
    router.push(`?${q.toString()}`, { scroll: false })
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-semibold">Employees</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage your team and workforce records.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border mb-4">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => handleTabChange(t.value)}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
              tab === t.value
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'team' ? (
        <TeamTab onOpenInvite={() => setInviteOpen(true)} />
      ) : (
        <WorkforceTab onOpenAdd={() => setAddWorkforceOpen(true)} />
      )}

      {/* Dialogs */}
      <InviteDialog open={inviteOpen} onClose={() => setInviteOpen(false)} />
      <WorkforceFormDialog
        open={addWorkforceOpen}
        onClose={() => setAddWorkforceOpen(false)}
        editTarget={null}
      />
    </div>
  )
}

export default function EmployeesPage() {
  return (
    <Suspense>
      <EmployeesInner />
    </Suspense>
  )
}
