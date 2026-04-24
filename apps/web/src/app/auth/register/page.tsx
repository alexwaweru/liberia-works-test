import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Building2, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/ui/logo'

export const metadata: Metadata = { title: 'Get started' }

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4"><Logo /></div>
          <h1 className="text-2xl font-bold text-foreground">Get started</h1>
          <p className="text-sm text-muted-foreground mt-1">Choose how you&apos;ll use Liberia Works</p>
        </div>

        <div className="space-y-3">
          <Link
            href="/auth/register/employer"
            className="flex items-center gap-4 bg-card border border-border rounded-2xl p-5 hover:shadow-md hover:border-primary/30 transition-all group"
          >
            <div className="bg-accent rounded-xl p-3 shrink-0">
              <Building2 size={28} strokeWidth={1.75} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-foreground text-base">Employer</div>
              <div className="text-sm text-muted-foreground mt-0.5">
                Post vacancies, review applicants, and manage work permits — all in one place.
              </div>
            </div>
            <ArrowRight size={20} className="text-muted-foreground shrink-0 group-hover:text-foreground transition-colors" />
          </Link>

          <Link
            href="/auth/register/individual"
            className="flex items-center gap-4 bg-card border border-border rounded-2xl p-5 hover:shadow-md hover:border-primary/30 transition-all group"
          >
            <div className="bg-brand-amber/15 rounded-xl p-3 shrink-0">
              <User size={28} strokeWidth={1.75} className="text-[hsl(40_85%_45%)]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-foreground text-base">Job Seeker</div>
              <div className="text-sm text-muted-foreground mt-0.5">
                Create a profile, upload your CV, and apply to positions across all 15 counties.
              </div>
            </div>
            <ArrowRight size={20} className="text-muted-foreground shrink-0 group-hover:text-foreground transition-colors" />
          </Link>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Already have an account?{' '}
          <Button variant="link" asChild className="h-auto p-0 text-sm font-medium">
            <Link href="/auth/login">Sign in</Link>
          </Button>
        </p>
      </div>
    </div>
  )
}
