import React from 'react'
import { Stack } from 'expo-router'

export default function ProfileLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#FFFFFF' },
        headerTintColor: '#E84A1F',
        headerTitleStyle: { fontWeight: '700', color: '#111827' },
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
