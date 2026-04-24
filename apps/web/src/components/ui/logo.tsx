import Link from 'next/link'
import { cn } from '@/lib/utils'

interface LogoProps {
  className?: string
  href?: string
}

export function Logo({ className, href = '/' }: LogoProps) {
  return (
    <Link href={href} className={cn('flex items-center gap-3 select-none', className)}>
      <span className="text-3xl leading-none shrink-0">🇱🇷</span>
      <div className="flex flex-col leading-none">
        <span className="text-sm font-bold tracking-widest uppercase text-foreground">
          Liberia Works
        </span>
        <span className="text-[10px] font-medium tracking-widest uppercase text-muted-foreground mt-0.5">
          Ministry of Labour
        </span>
      </div>
    </Link>
  )
}
