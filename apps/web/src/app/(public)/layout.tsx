// Public layout — no auth required. Shared by home, job browse, about, help pages.
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      {/* TODO: PublicNav — logo, Browse Jobs, Login/Register CTAs */}
      <main className="flex-1">{children}</main>
      {/* TODO: Footer */}
    </div>
  )
}
