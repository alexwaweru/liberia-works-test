import React, { useCallback } from 'react'
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useQuery } from '@tanstack/react-query'
import { getMyOptIns, ProgramOptIn } from '@/lib/api'
import LoadingView from '@/components/LoadingView'
import ErrorView from '@/components/ErrorView'
import { lwColors, lwFont, lwRadius } from '@/lib/theme'

// Informational status color pairs — left as-is, not brand colors
const CYCLE_COLORS = [
  { bg: '#EDE9FE', text: '#6D28D9' },
  { bg: '#DBEAFE', text: '#1D4ED8' },
  { bg: '#D1FAE5', text: '#065F46' },
  { bg: '#FEF3C7', text: '#92400E' },
  { bg: '#FFE4E6', text: '#9F1239' },
]

// Informational status color pairs — left as-is, not brand colors
const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  PENDING:   { bg: '#DBEAFE', text: '#1D4ED8' },
  MATCHED:   { bg: '#D1FAE5', text: '#065F46' },
  DECLINED:  { bg: '#FEE2E2', text: '#991B1B' },
  WITHDRAWN: { bg: '#F3F4F6', text: '#4B5563' },
}

const STATUS_LABELS: Record<string, string> = {
  PENDING:   'Pending',
  MATCHED:   'Matched',
  DECLINED:  'Declined',
  WITHDRAWN: 'Withdrawn',
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function cycleColor(id: string) {
  return CYCLE_COLORS[id.charCodeAt(0) % CYCLE_COLORS.length]!
}

function OptInCard({ item }: { item: ProgramOptIn }) {
  const color = cycleColor(item.programCycleId)
  const statusColor = STATUS_COLORS[item.status] ?? STATUS_COLORS.PENDING!

  const sectorNames = item.preferredSectors.map((s) => s.name).join(', ')
  const countyNames = item.preferredCounties.map((c) => c.name).join(', ')
  const educationName = item.preferredEducationLevel?.name ?? null

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={[styles.yearBadge, { backgroundColor: color.bg }]}>
          <Text style={[styles.yearBadgeText, { color: color.text }]}>
            {item.programCycle.year}
          </Text>
        </View>
        <View style={styles.cardTitleBlock}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {item.programCycle.name}
          </Text>
          <Text style={styles.cardSubtitle}>Opted in {formatDate(item.createdAt)}</Text>
        </View>
      </View>

      {/* Status badge */}
      <View style={styles.statusRow}>
        <View style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}>
          <Text style={[styles.statusText, { color: statusColor.text }]}>
            {STATUS_LABELS[item.status] ?? item.status}
          </Text>
        </View>
        {item.matchedEmployer && (
          <Text style={styles.employerText} numberOfLines={1}>
            {item.matchedEmployer.companyName}
          </Text>
        )}
      </View>

      {/* Details */}
      <View style={styles.details}>
        {sectorNames ? (
          <View style={styles.detailRow}>
            <Ionicons name="briefcase-outline" size={14} color={lwColors.mutedFg} style={styles.detailIcon} />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Sectors</Text>
              <Text style={styles.detailValue} numberOfLines={2}>{sectorNames}</Text>
            </View>
          </View>
        ) : null}

        {countyNames ? (
          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={14} color={lwColors.mutedFg} style={styles.detailIcon} />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Counties</Text>
              <Text style={styles.detailValue}>{countyNames}</Text>
            </View>
          </View>
        ) : null}

        {educationName ? (
          <View style={styles.detailRow}>
            <Ionicons name="school-outline" size={14} color={lwColors.mutedFg} style={styles.detailIcon} />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Education</Text>
              <Text style={styles.detailValue}>{educationName}</Text>
            </View>
          </View>
        ) : null}

        {item.additionalNotes ? (
          <View style={styles.detailRow}>
            <Ionicons name="document-text-outline" size={14} color={lwColors.mutedFg} style={styles.detailIcon} />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Notes</Text>
              <Text style={styles.detailValue} numberOfLines={3}>{item.additionalNotes}</Text>
            </View>
          </View>
        ) : null}
      </View>
    </View>
  )
}

export default function MyOptInsScreen() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['my-opt-ins'],
    queryFn: getMyOptIns,
  })

  const onRefresh = useCallback(() => { refetch() }, [refetch])

  if (isLoading) return <LoadingView />
  if (isError) {
    return (
      <ErrorView
        message={(error as Error)?.message ?? 'Failed to load opt-ins'}
        onRetry={refetch}
      />
    )
  }

  const optIns = data?.data ?? []
  const total = data?.pagination.total ?? 0

  return (
    <View style={styles.container}>
      <FlatList
        data={optIns}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <OptInCard item={item} />}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={onRefresh} tintColor={lwColors.navy} />
        }
        ListHeaderComponent={
          <Text style={styles.countText}>
            {total} {total === 1 ? 'program' : 'programs'}
          </Text>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="layers-outline" size={40} color={lwColors.border} />
            <Text style={styles.emptyTitle}>No opt-ins yet</Text>
            <Text style={styles.emptySubtitle}>
              Go to Programs to opt in to an open program.
            </Text>
          </View>
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: lwColors.background },
  list: { padding: 16, paddingBottom: 40 },
  countText: {
    fontSize: 13,
    fontFamily: lwFont.family,
    color: lwColors.mutedFg,
    marginBottom: 12,
  },

  // Card
  card: {
    backgroundColor: lwColors.surface,
    borderRadius: lwRadius.default,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  yearBadge: {
    width: 44,
    height: 44,
    borderRadius: lwRadius.default,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  yearBadgeText: { fontSize: 13, fontFamily: lwFont.familyBold },
  cardTitleBlock: { flex: 1 },
  cardTitle: { fontSize: 15, fontFamily: lwFont.familyBold, color: lwColors.foreground, lineHeight: 20 },
  cardSubtitle: { fontSize: 12, fontFamily: lwFont.family, color: lwColors.mutedFg, marginTop: 2 },

  // Status
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: lwRadius.full,
  },
  statusText: { fontSize: 12, fontFamily: lwFont.familyBold },
  employerText: { fontSize: 12, fontFamily: lwFont.family, color: lwColors.mutedFg, flex: 1 },

  // Details
  details: { gap: 10 },
  detailRow: { flexDirection: 'row', gap: 8 },
  detailIcon: { marginTop: 1, flexShrink: 0 },
  detailContent: { flex: 1 },
  detailLabel: { fontSize: 11, fontFamily: lwFont.familyBold, color: lwColors.mutedFg, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 1 },
  detailValue: { fontSize: 13, fontFamily: lwFont.family, color: lwColors.foreground, lineHeight: 18 },

  // Empty
  empty: { paddingTop: 80, alignItems: 'center', gap: 8 },
  emptyTitle: { fontSize: 16, fontFamily: lwFont.familyBold, color: lwColors.foreground },
  emptySubtitle: { fontSize: 14, fontFamily: lwFont.family, color: lwColors.mutedFg, textAlign: 'center', paddingHorizontal: 32 },
})
