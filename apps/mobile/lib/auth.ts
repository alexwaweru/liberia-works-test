import * as SecureStore from 'expo-secure-store'
import { createContext, useContext } from 'react'

const ACCESS_TOKEN_KEY = 'access_token'
const REFRESH_TOKEN_KEY = 'refresh_token'

export async function storeTokens(accessToken: string, refreshToken?: string) {
  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken)
  if (refreshToken) {
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken)
  }
}

export async function getAccessToken(): Promise<string | null> {
  return SecureStore.getItemAsync(ACCESS_TOKEN_KEY)
}

export async function getRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(REFRESH_TOKEN_KEY)
}

export async function clearTokens() {
  await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY)
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY)
}

// Parse the set-cookie header and extract both access_token and refresh_token values.
// The header may be a single string or a comma-joined list depending on the XHR implementation.
export function parseTokensFromCookieHeader(raw: string | null): {
  accessToken: string | null
  refreshToken: string | null
} {
  if (!raw) return { accessToken: null, refreshToken: null }

  // Split on cookie boundaries — each cookie entry starts with a known name or
  // follows ", " that separates cookies (not dates inside Expires= values).
  // A safe approach: split on the pattern ", <name>=" where name is known.
  const cookieStrings = raw.split(/,\s*(?=access_token=|refresh_token=)/)

  let accessToken: string | null = null
  let refreshToken: string | null = null

  for (const cookie of cookieStrings) {
    const parts = cookie.split(';')
    const first = parts[0].trim()
    if (first.startsWith('access_token=')) {
      accessToken = first.slice('access_token='.length)
    } else if (first.startsWith('refresh_token=')) {
      refreshToken = first.slice('refresh_token='.length)
    }
  }

  return { accessToken, refreshToken }
}

export type AuthUser = {
  userId: string
  role: string
  expiresAt: string
}

export type AuthContextValue = {
  user: AuthUser | null
  setUser: (u: AuthUser | null) => void
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  setUser: () => {},
  signOut: async () => {},
})

export function useAuth() {
  return useContext(AuthContext)
}
