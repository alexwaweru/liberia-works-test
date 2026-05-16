import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { UserRole } from '@liberia-works/shared-types'

// Route group → required roles
const PROTECTED_ROUTES: Record<string, UserRole[]> = {
  '/me':            ['INDIVIDUAL'],
  '/host-programs': ['EMPLOYER_ADMIN', 'EMPLOYER_HR'],
  '/dashboard':     ['EMPLOYER_ADMIN', 'EMPLOYER_HR'],
  '/vacancies':    ['EMPLOYER_ADMIN', 'EMPLOYER_HR'],
  '/applicants':   ['EMPLOYER_ADMIN', 'EMPLOYER_HR'],
  '/work-permits': ['EMPLOYER_ADMIN', 'EMPLOYER_HR'],
  '/compliance':   ['EMPLOYER_ADMIN', 'EMPLOYER_HR'],
  '/disputes':     ['EMPLOYER_ADMIN', 'EMPLOYER_HR'],
  '/mol':          ['MOL_OFFICER', 'MOL_DIRECTOR'],
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Determine required roles for this path
  const requiredRoles = Object.entries(PROTECTED_ROUTES).find(([prefix]) =>
    pathname.startsWith(prefix),
  )?.[1]

  if (!requiredRoles) return NextResponse.next()

  // JWT is an httpOnly cookie — we check presence here; full verification happens in API calls.
  // The server validates the JWT on every API request; this middleware only prevents
  // flash-of-protected-content by redirecting unauthenticated users to /auth/login.
  const token = request.cookies.get('access_token')

  if (!token) {
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/me/:path*',
    '/host-programs/:path*',
    '/dashboard/:path*',
    '/vacancies/:path*',
    '/applicants/:path*',
    '/work-permits/:path*',
    '/compliance/:path*',
    '/disputes/:path*',
    '/mol/:path*',
  ],
}
