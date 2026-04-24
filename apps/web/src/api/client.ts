export type ApiError = Error & { status: number }

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    ...init,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    const err = Object.assign(
      new Error((body as { message?: string }).message ?? `Request failed: ${res.status}`),
      { status: res.status },
    ) as ApiError
    throw err
  }
  return res.json() as Promise<T>
}

export const api = {
  get: <T>(path: string) =>
    request<T>(path, { headers: { 'Content-Type': 'application/json' } }),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
  delete: <T>(path: string) =>
    request<T>(path, { method: 'DELETE', headers: { 'Content-Type': 'application/json' } }),
  upload: <T>(path: string, formData: FormData) =>
    request<T>(path, { method: 'POST', body: formData }),
}
