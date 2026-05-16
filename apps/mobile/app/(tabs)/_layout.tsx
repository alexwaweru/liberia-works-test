import React from 'react'
import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { lwColors, lwFont } from '@/lib/theme'

type IoniconsName = React.ComponentProps<typeof Ionicons>['name']

function tabIcon(focused: boolean, name: IoniconsName, nameOutline: IoniconsName) {
  return <Ionicons name={focused ? name : nameOutline} size={24} color={focused ? lwColors.navy : lwColors.mutedFg} />
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: lwColors.navy,
        tabBarInactiveTintColor: lwColors.mutedFg,
        tabBarStyle: {
          borderTopColor: lwColors.muted,
          backgroundColor: lwColors.surface,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: lwFont.family,
        },
      }}
    >
      <Tabs.Screen
        name="jobs"
        options={{
          title: 'Jobs',
          tabBarIcon: ({ focused }) => tabIcon(focused, 'briefcase', 'briefcase-outline'),
        }}
      />
      <Tabs.Screen
        name="applications"
        options={{
          title: 'Applications',
          tabBarIcon: ({ focused }) => tabIcon(focused, 'document-text', 'document-text-outline'),
        }}
      />
      <Tabs.Screen
        name="programs"
        options={{
          title: 'Programs',
          tabBarIcon: ({ focused }) => tabIcon(focused, 'layers', 'layers-outline'),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => tabIcon(focused, 'person', 'person-outline'),
        }}
      />
    </Tabs>
  )
}
