import React, { useCallback } from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { router } from 'expo-router'
import { listMyApplications, MyApplicationListItem } from '@/lib/api'
import LoadingView from '@/components/LoadingView'
import ErrorView from '@/components/ErrorView'
import Badge from '@/components/Badge'
import { lwColors, lwFont, lwRadius } from '@/lib/theme'

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function ApplicationCard({ item }: { item: MyApplicationListItem }) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/(tabs)/applications/${item.id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {item.vacancyTitle}
        </Text>
        <Badge status={item.status} />
      </View>
      <Text style={styles.cardCompany}>{item.companyName}</Text>
      <Text style={styles.cardDate}>Applied {formatDate(item.appliedAt)}</Text>
    </TouchableOpacity>
  )
}

export default function ApplicationsScreen() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['my-applications'],
    queryFn: () => listMyApplications(),
  })

  const onRefresh = useCallback(() => {
    refetch()
  }, [refetch])

  if (isLoading) return <LoadingView />
  if (isError) {
    return (
      <ErrorView
        message={(error as Error)?.message ?? 'Failed to load applications'}
        onRetry={refetch}
      />
    )
  }

  const applications = data?.data ?? []

  return (
    <View style={styles.container}>
      <FlatList
        style={{ flex: 1 }}
        data={applications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ApplicationCard item={item} />}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={onRefresh} tintColor={lwColors.navy} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No applications yet</Text>
            <Text style={styles.emptyText}>
              Browse jobs and apply to see your applications here.
            </Text>
            <TouchableOpacity
              style={styles.browseButton}
              onPress={() => router.push('/(tabs)/jobs')}
            >
              <Text style={styles.browseButtonText}>Browse Jobs</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: lwColors.background },
  list: { padding: 16, paddingBottom: 32 },
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
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 6,
  },
  cardTitle: {
    flex: 1,
    fontSize: 16,
    fontFamily: lwFont.familyBold,
    color: lwColors.foreground,
  },
  cardCompany: { fontSize: 14, fontFamily: lwFont.family, color: lwColors.mutedFg, marginBottom: 6 },
  cardDate: { fontSize: 13, fontFamily: lwFont.family, color: lwColors.mutedFg },
  empty: {
    paddingTop: 80,
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: { fontSize: 18, fontFamily: lwFont.familyBold, color: lwColors.foreground, marginBottom: 8 },
  emptyText: { fontSize: 14, fontFamily: lwFont.family, color: lwColors.mutedFg, textAlign: 'center', marginBottom: 20 },
  browseButton: {
    backgroundColor: lwColors.crimson,
    borderRadius: lwRadius.default,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  browseButtonText: { color: lwColors.white, fontFamily: lwFont.familyBold, fontSize: 14 },
})
