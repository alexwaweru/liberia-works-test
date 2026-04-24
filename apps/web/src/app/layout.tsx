import type { Metadata } from 'next'
import { Toaster } from '@/components/ui/sonner'
import { ReactQueryProvider } from '@/providers/query'
import { ThemeProvider } from '@/components/ui/theme-toggle/theme-provider'
import './globals.css'

export const metadata: Metadata = {
  title: {
    template: '%s | Liberia Works',
    default: 'Liberia Works',
  },
  description: 'Ministry of Labour workforce management platform',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <ThemeProvider defaultTheme="system">
          <ReactQueryProvider>
            {children}
          </ReactQueryProvider>
          <Toaster position="bottom-right" richColors duration={5000} />
        </ThemeProvider>
      </body>
    </html>
  )
}
