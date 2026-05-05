import React from 'react'
import { Stack } from 'expo-router'

export default function JobsLayout() {
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
      <Stack.Screen name="index" options={{ title: 'Browse Jobs' }} />
      <Stack.Screen name="[id]" options={{ title: 'Job Details' }} />
    </Stack>
  )
}
