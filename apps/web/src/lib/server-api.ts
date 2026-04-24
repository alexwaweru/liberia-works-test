'use server'

import { cookies } from 'next/headers'

const API = process.env.API_URL ?? 'http://localhost:3001'

export async function serverFetch<T>(
  path: string,
  options?: RequestInit,
): Promise<{ data: T; headers: Headers } | { error: string }> {
  let res: Response
  try {
    res = await fetch(`${API}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    })
  } catch {
    return { error: 'Could not reach server. Please try again.' }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    return { error: (body as { error?: string }).error ?? `Request failed: ${res.status}` }
  }

  const data = (await res.json()) as T
  return { data, headers: res.headers }
}

export async function forwardCookies(headers: Headers) {
  const setCookies = headers.getSetCookie?.() ?? []
  if (!setCookies.length) return
  const cookieStore = await cookies()
  for (const raw of setCookies) {
    const parts = raw.split(';').map((s) => s.trim())
    const eqIdx = parts[0].indexOf('=')
    const name = parts[0].slice(0, eqIdx)
    const value = parts[0].slice(eqIdx + 1)
    const attrs: Record<string, string | boolean> = {}
    for (const part of parts.slice(1)) {
      const [k, v] = part.split('=')
      attrs[k.trim().toLowerCase()] = v?.trim() ?? true
    }
    cookieStore.set(name, value, {
      httpOnly: true,
      path: (attrs['path'] as string) ?? '/',
      sameSite: (attrs['samesite'] as 'lax' | 'strict' | 'none') ?? 'lax',
      maxAge: attrs['max-age'] ? Number(attrs['max-age']) : undefined,
      secure: attrs['secure'] === true || attrs['secure'] === 'true',
    })
  }
}
