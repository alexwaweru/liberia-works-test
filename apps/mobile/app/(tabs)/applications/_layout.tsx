import React from 'react'
import { Stack } from 'expo-router'
import { lwColors, lwFont } from '@/lib/theme'

export default function ApplicationsLayout() {
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
      <Stack.Screen name="index" options={{ title: 'My Applications' }} />
      <Stack.Screen name="[id]" options={{ title: 'Application Details' }} />
    </Stack>
  )
}
