import React, { useState, useCallback } from 'react'
import { Stack, router } from 'expo-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StatusBar } from 'expo-status-bar'
import { clearTokens, AuthContext, AuthUser } from '@/lib/auth'
import { logout } from '@/lib/api'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
})

export default function RootLayout() {
  const [user, setUser] = useState<AuthUser | null>(null)

  const signOut = useCallback(async () => {
    try {
      await logout()
    } catch {}
    await clearTokens()
    queryClient.clear()
    setUser(null)
    router.replace('/(auth)/login')
  }, [])

  return (
    <AuthContext.Provider value={{ user, setUser, signOut }}>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="auto" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
        </Stack>
      </QueryClientProvider>
    </AuthContext.Provider>
  )
}
