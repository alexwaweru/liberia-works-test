import React from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
} from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { listMyApplications } from '@/lib/api'
import LoadingView from '@/components/LoadingView'
import ErrorView from '@/components/ErrorView'
import Badge from '@/components/Badge'
import { lwColors, lwFont, lwRadius } from '@/lib/theme'

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function ApplicationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()

  // We get application detail from the list — the individual endpoint returns
  // the application list. There is no dedicated GET /me/applications/:id endpoint,
  // so we fetch the list and find the matching item.
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['my-applications'],
    queryFn: () => listMyApplications(),
  })

  if (isLoading) return <LoadingView />
  if (isError) {
    return (
      <ErrorView
        message={(error as Error)?.message ?? 'Failed to load application'}
        onRetry={refetch}
      />
    )
  }

  const application = data?.data.find((a) => a.id === id)

  if (!application) {
    return <ErrorView message="Application not found." />
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Status */}
      <View style={styles.statusRow}>
        <Badge status={application.status} />
      </View>

      {/* Vacancy info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Job Details</Text>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Position</Text>
          <Text style={styles.rowValue}>{application.vacancyTitle}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Company</Text>
          <Text style={styles.rowValue}>{application.companyName}</Text>
        </View>
      </View>

      {/* Application info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Application Info</Text>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Applied On</Text>
          <Text style={styles.rowValue}>{formatDate(application.appliedAt)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Status</Text>
          <Text style={styles.rowValue}>{application.status}</Text>
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: lwColors.surface },
  content: { padding: 20, paddingBottom: 40 },
  statusRow: { marginBottom: 20 },
  section: {
    marginBottom: 24,
    backgroundColor: lwColors.background,
    borderRadius: lwRadius.default,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: lwFont.familyBold,
    color: lwColors.mutedFg,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: lwColors.border,
  },
  rowLabel: { fontSize: 14, fontFamily: lwFont.family, color: lwColors.mutedFg, flex: 1 },
  rowValue: { fontSize: 14, fontFamily: lwFont.familyBold, color: lwColors.foreground, flex: 2, textAlign: 'right' },
})
