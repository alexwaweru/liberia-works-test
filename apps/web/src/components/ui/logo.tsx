import * as React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { LogoMark } from './logo-mark'

const SIZE_PX: Record<'sm' | 'md' | 'lg', number> = { sm: 22, md: 28, lg: 40 }

interface LogoProps {
  className?: string
  href?: string
  layout?: 'horizontal' | 'stacked'
  tone?: 'light' | 'dark' | 'auto'
  size?: 'sm' | 'md' | 'lg' | number
  hideSubtitle?: boolean
}

export function Logo({
  className,
  href = '/',
  layout = 'horizontal',
  tone = 'auto',
  size = 'md',
  hideSubtitle = false,
}: LogoProps) {
  // tone === 'auto' follows the current text color (foreground), so it adapts to
  // light/dark mode without a client-side theme check (avoids SSR/hydration flash).
  const markToneProp =
    tone === 'auto' ? 'current' : tone === 'dark' ? 'white' : 'navy'
  const markSize = typeof size === 'number' ? size : SIZE_PX[size]
  const isHorizontal = layout === 'horizontal'
  const ariaLabel = hideSubtitle ? 'Liberia Works' : 'Liberia Works — Ministry of Labor'

  const mainTextSize =
    typeof size === 'number'
      ? `${Math.round(markSize * 0.45)}px`
      : size === 'sm'
        ? '0.75rem'
        : size === 'lg'
          ? '1.125rem'
          : '0.875rem'

  const subTextSize =
    typeof size === 'number'
      ? `${Math.max(9, Math.round(markSize * 0.24))}px`
      : size === 'sm'
        ? '0.55rem'
        : size === 'lg'
          ? '0.7rem'
          : '0.625rem'

  const content = (
    <>
      <LogoMark tone={markToneProp} size={markSize} title="" className="shrink-0 text-foreground" />
      <div
        className={cn(
          'flex flex-col leading-none',
          isHorizontal ? 'items-start' : 'items-center',
        )}
      >
        <span
          className="font-semibold uppercase text-foreground"
          style={{ fontSize: mainTextSize, letterSpacing: '0.06em' }}
        >
          Liberia Works
        </span>
        {hideSubtitle ? null : (
          <span
            className="font-medium uppercase text-muted-foreground mt-1"
            style={{ fontSize: subTextSize, letterSpacing: '0.08em' }}
          >
            Ministry of Labor
          </span>
        )}
      </div>
    </>
  )

  const containerClass = cn(
    'inline-flex select-none',
    isHorizontal ? 'flex-row items-center gap-3' : 'flex-col items-center gap-2',
    className,
  )

  if (href) {
    return (
      <Link href={href} className={containerClass} aria-label={ariaLabel}>
        {content}
      </Link>
    )
  }

  return (
    <div className={containerClass} role="img" aria-label={ariaLabel}>
      {content}
    </div>
  )
}

export { LogoMark }
