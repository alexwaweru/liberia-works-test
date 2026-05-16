import React from 'react'
import { Stack } from 'expo-router'
import { lwColors, lwFont } from '@/lib/theme'

export default function ProgramsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: lwColors.surface },
        headerTintColor: lwColors.navy,
        headerTitleStyle: { fontFamily: lwFont.familyBold, color: lwColors.foreground },
        headerShadowVisible: false,
        headerBackTitle: 'Back',
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Programs' }} />
      <Stack.Screen name="opt-ins" options={{ title: 'My Opt-Ins' }} />
      <Stack.Screen name="[id]" options={{ title: 'Program Details' }} />
    </Stack>
  )
}
