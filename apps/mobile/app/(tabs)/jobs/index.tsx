import React, { useState, useCallback } from 'react'
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { router } from 'expo-router'
import { browseVacancies, PublicVacancyListItem } from '@/lib/api'
import LoadingView from '@/components/LoadingView'
import ErrorView from '@/components/ErrorView'
import Badge from '@/components/Badge'

const VACANCY_TYPES = ['All', 'PERMANENT', 'CONTRACT', 'INTERNSHIP', 'VACATION_JOB'] as const
type VacancyTypeFilter = (typeof VACANCY_TYPES)[number]

const TYPE_LABELS: Record<string, string> = {
  All: 'All',
  PERMANENT: 'Permanent',
  CONTRACT: 'Contract',
  INTERNSHIP: 'Internship',
  VACATION_JOB: 'Vacation',
}

function formatDeadline(deadline: string) {
  const d = new Date(deadline)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function JobCard({ item }: { item: PublicVacancyListItem }) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/(tabs)/jobs/${item.id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Badge status={item.vacancyType} label={TYPE_LABELS[item.vacancyType] ?? item.vacancyType} />
      </View>
      <Text style={styles.cardCompany}>{item.companyName}</Text>
      <View style={styles.cardFooter}>
        <Text style={styles.cardMeta}>Slots: {item.slotsAvailable}</Text>
        <Text style={styles.cardDeadline}>Deadline: {formatDeadline(item.deadline)}</Text>
      </View>
    </TouchableOpacity>
  )
}

export default function JobsScreen() {
  const [keyword, setKeyword] = useState('')
  const [debouncedKeyword, setDebouncedKeyword] = useState('')
  const [activeType, setActiveType] = useState<VacancyTypeFilter>('All')
  const [debounceTimer, setDebounceTimer] = useState<ReturnType<typeof setTimeout> | null>(null)

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['vacancies', 'browse', debouncedKeyword, activeType],
    queryFn: () =>
      browseVacancies({
        keyword: debouncedKeyword || undefined,
        vacancyType: activeType !== 'All' ? activeType : undefined,
      }),
  })

  function handleKeywordChange(text: string) {
    setKeyword(text)
    if (debounceTimer) clearTimeout(debounceTimer)
    const t = setTimeout(() => setDebouncedKeyword(text), 400)
    setDebounceTimer(t)
  }

  const onRefresh = useCallback(() => {
    refetch()
  }, [refetch])

  if (isLoading) return <LoadingView />
  if (isError) {
    return (
      <ErrorView
        message={(error as Error)?.message ?? 'Failed to load jobs'}
        onRetry={refetch}
      />
    )
  }

  const jobs = data?.data ?? []

  return (
    <View style={styles.container}>
      {/* Search bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          value={keyword}
          onChangeText={handleKeywordChange}
          placeholder="Search jobs..."
          placeholderTextColor="#9CA3AF"
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
      </View>

      {/* Type filter chips */}
      <View style={styles.filterRow}>
        {VACANCY_TYPES.map((type) => (
          <TouchableOpacity
            key={type}
            style={[styles.chip, activeType === type && styles.chipActive]}
            onPress={() => setActiveType(type)}
          >
            <Text style={[styles.chipText, activeType === type && styles.chipTextActive]}>
              {TYPE_LABELS[type]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        style={{ flex: 1 }}
        data={jobs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <JobCard item={item} />}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={false} onRefresh={onRefresh} tintColor="#E84A1F" />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No jobs found.</Text>
          </View>
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  searchContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  searchInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#111827',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    gap: 6,
    flexWrap: 'wrap',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  chip: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  chipActive: {
    backgroundColor: '#E84A1F',
    borderColor: '#E84A1F',
  },
  chipText: { fontSize: 13, color: '#374151', fontWeight: '500' },
  chipTextActive: { color: '#FFFFFF' },
  list: { padding: 16, gap: 12, paddingBottom: 32 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 12,
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
    fontWeight: '700',
    color: '#111827',
  },
  cardCompany: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 10,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardMeta: { fontSize: 13, color: '#9CA3AF' },
  cardDeadline: { fontSize: 13, color: '#9CA3AF' },
  empty: { paddingTop: 60, alignItems: 'center' },
  emptyText: { fontSize: 15, color: '#9CA3AF' },
})
