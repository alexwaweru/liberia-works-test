import React, { useState, useCallback, useEffect } from 'react'
import { View } from 'react-native'
import { Stack, router } from 'expo-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StatusBar } from 'expo-status-bar'
import * as SplashScreen from 'expo-splash-screen'
import {
  useFonts,
  Outfit_400Regular,
  Outfit_600SemiBold,
} from '@expo-google-fonts/outfit'
import { clearTokens, AuthContext, AuthUser } from '@/lib/auth'
import { logout } from '@/lib/api'
import { lwColors } from '@/lib/theme'

void SplashScreen.preventAutoHideAsync().catch(() => {})

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
  const [fontsLoaded] = useFonts({
    Outfit_400Regular,
    Outfit_600SemiBold,
  })

  useEffect(() => {
    if (fontsLoaded) {
      void SplashScreen.hideAsync().catch(() => {})
    }
  }, [fontsLoaded])

  const signOut = useCallback(async () => {
    try {
      await logout()
    } catch {}
    await clearTokens()
    queryClient.clear()
    setUser(null)
    router.replace('/(auth)/login')
  }, [])

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: lwColors.background }} />
  }

  return (
    <AuthContext.Provider value={{ user, setUser, signOut }}>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
        </Stack>
      </QueryClientProvider>
    </AuthContext.Provider>
  )
}
