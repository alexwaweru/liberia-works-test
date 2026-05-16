import Link from 'next/link'
import { Logo } from '@/components/ui/logo'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-14 flex items-center justify-between">
          <Logo href="/" size="md" />

          <nav className="hidden lg:flex items-center gap-6">
            <Link href="/jobs" className="text-sm text-foreground hover:text-primary">
              Jobs
            </Link>
            <Link href="/programs" className="text-sm text-foreground hover:text-primary">
              Programs
            </Link>
            <a href="/auth/register/employer" className="text-sm text-foreground hover:text-primary">
              For Employers
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <a
              href="/auth/login"
              className="hidden sm:block text-sm text-foreground border border-border rounded-md px-4 py-2 hover:bg-secondary"
            >
              Sign in
            </a>
            <a
              href="/auth/register"
              className="text-sm bg-primary text-primary-foreground rounded-md px-4 py-2 hover:opacity-90"
            >
              Get started
            </a>
            <button
              className="lg:hidden ml-2 p-1 text-foreground"
              aria-label="Open menu"
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 22 22"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect y="4" width="22" height="2" rx="1" fill="currentColor" />
                <rect y="10" width="22" height="2" rx="1" fill="currentColor" />
                <rect y="16" width="22" height="2" rx="1" fill="currentColor" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border bg-background py-6 text-sm text-muted-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex flex-col sm:flex-row gap-4 sm:gap-0 items-start sm:items-center justify-between">
          <span>An initiative of the Ministry of Labor · Republic of Liberia · © 2026</span>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-foreground">
              Privacy
            </a>
            <a href="#" className="hover:text-foreground">
              Terms
            </a>
            <a href="#" className="hover:text-foreground">
              Contact MoL
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
