import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = { title: 'Home' }

export default function HomePage() {
  return (
    <div className="bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10 sm:py-14 flex flex-col items-center text-center">
        <div className="flex flex-col items-center max-w-2xl">
          <p className="text-xs font-semibold tracking-widest uppercase text-primary">
            Liberia&apos;s National Employment Platform
          </p>
          <h1 className="text-4xl sm:text-5xl lg:text-5xl font-bold leading-tight text-foreground mt-3">
            Find work.
            <br />
            Build Liberia.
          </h1>
          <p className="text-base text-muted-foreground mt-4 max-w-md">
            Browse open positions, access government programs, and connect with employers across
            all 15 counties.
          </p>
          <div className="flex flex-wrap gap-3 mt-6">
            <Button asChild className="bg-foreground text-background hover:opacity-90 px-5 py-2.5 rounded-md text-sm font-medium h-auto">
              <Link href="/auth/register">Browse jobs</Link>
            </Button>
            <Button asChild variant="outline" className="border-border text-foreground hover:bg-secondary px-5 py-2.5 rounded-md text-sm font-medium h-auto">
              <Link href="#">For employers →</Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-secondary border-y border-border py-7 mt-0">
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 divide-x-0 sm:divide-x divide-border max-w-7xl mx-auto px-4 sm:px-8">
          <div className="py-6 sm:py-0 sm:px-12 first:pt-0 last:pb-0 sm:first:pt-0">
            <div className="text-4xl sm:text-5xl font-bold text-foreground">
              2,400<span className="text-primary">+</span>
            </div>
            <div className="text-sm text-muted-foreground mt-1">Registered employers</div>
          </div>
          <div className="py-6 sm:py-0 sm:px-12 first:pt-0 last:pb-0 sm:first:pt-0">
            <div className="text-4xl sm:text-5xl font-bold text-foreground">
              18,000<span className="text-primary">+</span>
            </div>
            <div className="text-sm text-muted-foreground mt-1">Active job seekers</div>
          </div>
          <div className="py-6 sm:py-0 sm:px-12 first:pt-0 last:pb-0 sm:first:pt-0">
            <div className="text-4xl sm:text-5xl font-bold text-foreground">
              450<span className="text-primary">+</span>
            </div>
            <div className="text-sm text-muted-foreground mt-1">Open positions</div>
          </div>
        </div>
      </div>

      <div className="py-10 max-w-7xl mx-auto px-4 sm:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0 sm:gap-8 lg:gap-12 divide-y sm:divide-y-0 divide-border">
          <div className="group rounded-xl border border-transparent hover:border-border hover:bg-card hover:shadow-sm transition-all p-4 sm:-m-4 py-8 sm:py-4">
            <p className="text-xs font-semibold tracking-widest uppercase text-primary">
              For Job Seekers
            </p>
            <h2 className="text-xl font-bold text-foreground mt-2">Apply in minutes</h2>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              Create a profile, upload your CV, and apply to positions across all counties — on web or
              mobile.
            </p>
            <Button asChild variant="link" className="p-0 h-auto text-sm font-medium mt-4 inline-flex items-center gap-1">
              <Link href="#">Get started →</Link>
            </Button>
          </div>

          <div className="group rounded-xl border border-transparent hover:border-border hover:bg-card hover:shadow-sm transition-all p-4 sm:-m-4 py-8 sm:py-4">
            <p className="text-xs font-semibold tracking-widest uppercase text-primary">
              For Employers
            </p>
            <h2 className="text-xl font-bold text-foreground mt-2">Find the right talent</h2>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              Post vacancies, review applicants, and manage work permits — all in one place.
            </p>
            <Button asChild variant="link" className="p-0 h-auto text-sm font-medium mt-4 inline-flex items-center gap-1">
              <Link href="#">Register your company →</Link>
            </Button>
          </div>

          <div className="group rounded-xl border border-transparent hover:border-border hover:bg-card hover:shadow-sm transition-all p-4 sm:-m-4 py-8 sm:py-4">
            <p className="text-xs font-semibold tracking-widest uppercase text-primary">
              Vacation Jobs
            </p>
            <h2 className="text-xl font-bold text-foreground mt-2">Students &amp; opportunity</h2>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              Matched placements connecting students with host employers across Liberia.
            </p>
            <Button asChild variant="link" className="p-0 h-auto text-sm font-medium mt-4 inline-flex items-center gap-1">
              <Link href="#">Learn more →</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
