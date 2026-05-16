import React from 'react'
import { Stack } from 'expo-router'
import { lwColors, lwFont } from '@/lib/theme'

export default function JobsLayout() {
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
      <Stack.Screen name="index" options={{ title: 'Browse Jobs' }} />
      <Stack.Screen name="[id]" options={{ title: 'Job Details' }} />
    </Stack>
  )
}
