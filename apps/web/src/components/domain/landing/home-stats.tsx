'use client'

import { usePublicStats } from '@/hooks/public'

function formatStat(value: number): string {
  return value.toLocaleString('en-US')
}

function StatNumber({ value, isLoading }: { value: number | undefined; isLoading: boolean }) {
  if (isLoading) {
    return <span className="inline-block h-12 w-24 bg-muted animate-pulse" />
  }
  const n = value ?? 0
  const formatted = formatStat(n)
  const suffix = n >= 10 ? '+' : ''
  return (
    <>
      {formatted}
      {suffix && <span className="text-primary">{suffix}</span>}
    </>
  )
}

export function HomeStats() {
  const { data, isLoading } = usePublicStats()

  return (
    <div className="bg-secondary border-y border-border py-7 mt-0">
      <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 divide-x-0 sm:divide-x divide-border max-w-7xl mx-auto px-4 sm:px-8">
        <div className="py-6 sm:py-0 sm:px-12 first:pt-0 last:pb-0 sm:first:pt-0">
          <div className="text-4xl sm:text-5xl font-bold text-foreground">
            <StatNumber value={data?.employers} isLoading={isLoading} />
          </div>
          <div className="text-sm text-muted-foreground mt-1">Registered employers</div>
        </div>
        <div className="py-6 sm:py-0 sm:px-12 first:pt-0 last:pb-0 sm:first:pt-0">
          <div className="text-4xl sm:text-5xl font-bold text-foreground">
            <StatNumber value={data?.individuals} isLoading={isLoading} />
          </div>
          <div className="text-sm text-muted-foreground mt-1">Active job seekers</div>
        </div>
        <div className="py-6 sm:py-0 sm:px-12 first:pt-0 last:pb-0 sm:first:pt-0">
          <div className="text-4xl sm:text-5xl font-bold text-foreground">
            <StatNumber value={data?.openPositions} isLoading={isLoading} />
          </div>
          <div className="text-sm text-muted-foreground mt-1">Open positions</div>
        </div>
      </div>
    </div>
  )
}
