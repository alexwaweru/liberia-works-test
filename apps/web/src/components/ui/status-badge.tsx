import { CheckCircle2, Clock, XCircle, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

export type StatusVariant = 'success' | 'pending' | 'warning' | 'error' | 'neutral'

interface StatusBadgeProps {
  label: string
  variant?: StatusVariant
  icon?: LucideIcon
  className?: string
}

const VARIANT_STYLES: Record<StatusVariant, string> = {
  success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  pending: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  error: 'bg-red-500/10 text-red-600 dark:text-red-400',
  neutral: 'bg-muted text-muted-foreground',
}

const DEFAULT_ICONS: Record<StatusVariant, LucideIcon> = {
  success: CheckCircle2,
  pending: Clock,
  warning: AlertCircle,
  error: XCircle,
  neutral: Clock,
}

export function StatusBadge({ label, variant = 'neutral', icon, className }: StatusBadgeProps) {
  const Icon = icon ?? DEFAULT_ICONS[variant]

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium',
        VARIANT_STYLES[variant],
        className
      )}
    >
      <Icon className="size-3" />
      {label}
    </div>
  )
}