import React from 'react'
import { Stack } from 'expo-router'

export default function ApplicationsLayout() {
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
      <Stack.Screen name="index" options={{ title: 'My Applications' }} />
      <Stack.Screen name="[id]" options={{ title: 'Application Details' }} />
    </Stack>
  )
}
