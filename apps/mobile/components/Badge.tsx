import React from 'react'
import { View, Text, StyleSheet } from 'react-native'

type BadgeVariant = 'APPLIED' | 'SHORTLISTED' | 'REJECTED' | 'WITHDRAWN' | 'HIRED' | 'OPEN' | 'CLOSED' | 'DRAFT' | string

const variantColors: Record<string, { bg: string; text: string }> = {
  APPLIED: { bg: '#EFF6FF', text: '#1D4ED8' },
  SHORTLISTED: { bg: '#F0FDF4', text: '#15803D' },
  REJECTED: { bg: '#FEF2F2', text: '#DC2626' },
  WITHDRAWN: { bg: '#F9FAFB', text: '#6B7280' },
  HIRED: { bg: '#ECFDF5', text: '#065F46' },
  OPEN: { bg: '#F0FDF4', text: '#15803D' },
  CLOSED: { bg: '#FEF2F2', text: '#DC2626' },
  DRAFT: { bg: '#F9FAFB', text: '#6B7280' },
  ACTIVE: { bg: '#F0FDF4', text: '#15803D' },
  COMPLETED: { bg: '#EFF6FF', text: '#1D4ED8' },
  UPCOMING: { bg: '#FFF7ED', text: '#C2410C' },
}

type Props = {
  status: BadgeVariant
  label?: string
}

export default function Badge({ status, label }: Props) {
  const colors = variantColors[status] ?? { bg: '#F9FAFB', text: '#6B7280' }
  const displayLabel = label ?? status.charAt(0) + status.slice(1).toLowerCase()

  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }]}>
      <Text style={[styles.text, { color: colors.text }]}>{displayLabel}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
})
