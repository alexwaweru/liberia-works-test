import type { Metadata, Viewport } from 'next'
import '@fontsource-variable/outfit'
import { Toaster } from '@/components/ui/sonner'
import { ReactQueryProvider } from '@/providers/query'
import { ThemeProvider } from '@/components/ui/theme-toggle/theme-provider'
import './globals.css'

export const metadata: Metadata = {
  title: {
    template: '%s | Liberia Works',
    default: 'Liberia Works',
  },
  description: 'Ministry of Labor workforce management platform',
  manifest: '/favicon/site.webmanifest',
  icons: {
    icon: [
      { url: '/favicon/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon/favicon-16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: '/favicon/apple-touch-icon.png',
    shortcut: '/favicon.ico',
  },
}

export const viewport: Viewport = {
  themeColor: '#0B2342',
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
