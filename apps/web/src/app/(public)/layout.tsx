export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg
              width="40"
              height="28"
              viewBox="0 0 40 28"
              xmlns="http://www.w3.org/2000/svg"
              aria-label="Liberia flag"
            >
              <rect width="40" height="28" fill="#BF0A30" />
              <rect y="2.545" width="40" height="2.545" fill="#FFFFFF" />
              <rect y="5.09" width="40" height="2.545" fill="#BF0A30" />
              <rect y="7.636" width="40" height="2.545" fill="#FFFFFF" />
              <rect y="10.182" width="40" height="2.545" fill="#BF0A30" />
              <rect y="12.727" width="40" height="2.545" fill="#FFFFFF" />
              <rect y="15.273" width="40" height="2.545" fill="#BF0A30" />
              <rect y="17.818" width="40" height="2.545" fill="#FFFFFF" />
              <rect y="20.364" width="40" height="2.545" fill="#BF0A30" />
              <rect y="22.909" width="40" height="2.545" fill="#FFFFFF" />
              <rect width="16" height="15.273" fill="#002868" />
              <polygon
                points="8,2 9.176,5.618 12.944,5.618 9.884,7.764 11.06,11.382 8,9.236 4.94,11.382 6.116,7.764 3.056,5.618 6.824,5.618"
                fill="#FFFFFF"
              />
            </svg>
            <div>
              <div className="text-sm font-bold text-foreground leading-tight">LIBERIA WORKS</div>
              <div className="text-[10px] text-muted-foreground tracking-wide uppercase leading-tight">
                Ministry of Labour
              </div>
            </div>
          </div>

          <nav className="hidden lg:flex items-center gap-6">
            <a href="#" className="text-sm text-foreground hover:text-primary">
              Jobs
            </a>
            <a href="#" className="text-sm text-foreground hover:text-primary">
              Programs
            </a>
            <a href="#" className="text-sm text-foreground hover:text-primary">
              For Employers
            </a>
            <a href="#" className="text-sm text-foreground hover:text-primary">
              Ministry
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
              className="text-sm bg-primary text-white rounded-md px-4 py-2 hover:opacity-90"
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
          <span>An initiative of the Ministry of Labour · Republic of Liberia · © 2026</span>
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
