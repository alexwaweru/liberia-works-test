import React from 'react'
import { Stack } from 'expo-router'
import { lwColors, lwFont } from '@/lib/theme'

export default function ProfileLayout() {
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
      <Stack.Screen name="index" options={{ title: 'Profile' }} />
      <Stack.Screen name="general" options={{ title: 'General Info' }} />
      <Stack.Screen name="education" options={{ title: 'Education' }} />
      <Stack.Screen name="experience" options={{ title: 'Work Experience' }} />
    </Stack>
  )
}
