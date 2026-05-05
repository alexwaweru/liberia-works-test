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
import { listProgramCycles, ProgramCycleListItem } from '@/lib/api'
import LoadingView from '@/components/LoadingView'
import ErrorView from '@/components/ErrorView'
import Badge from '@/components/Badge'

const STATUSES = ['All', 'PLANNED', 'OPEN', 'MATCHING', 'COMPLETED'] as const
type StatusFilter = (typeof STATUSES)[number]

const STATUS_LABELS: Record<StatusFilter, string> = {
  All: 'All',
  PLANNED: 'Planned',
  OPEN: 'Open',
  MATCHING: 'Matching',
  COMPLETED: 'Completed',
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function ProgramCard({ item }: { item: ProgramCycleListItem }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {item.name}
        </Text>
        <Badge status={item.status} />
      </View>

      <Text style={styles.cardType}>{item.type}</Text>

      {item.description ? (
        <Text style={styles.cardDescription} numberOfLines={3}>
          {item.description}
        </Text>
      ) : null}

      <View style={styles.cardDates}>
        <Text style={styles.dateText}>
          {formatDate(item.startDate)} – {formatDate(item.endDate)}
        </Text>
        <Text style={styles.yearText}>{item.year}</Text>
      </View>

      <View style={styles.comingSoon}>
        <Text style={styles.comingSoonText}>Opt-in coming soon</Text>
      </View>
    </View>
  )
}

export default function ProgramsScreen() {
  const [keyword, setKeyword] = useState('')
  const [activeStatus, setActiveStatus] = useState<StatusFilter>('All')
  const [debounceTimer, setDebounceTimer] = useState<ReturnType<typeof setTimeout> | null>(null)
  const [debouncedKeyword, setDebouncedKeyword] = useState('')

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['program-cycles', activeStatus],
    queryFn: () =>
      listProgramCycles({
        status: activeStatus !== 'All' ? activeStatus : undefined,
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
        message={(error as Error)?.message ?? 'Failed to load programs'}
        onRetry={refetch}
      />
    )
  }

  const all = data?.data ?? []
  const programs = debouncedKeyword
    ? all.filter((p) => {
        const q = debouncedKeyword.toLowerCase()
        return (
          p.name.toLowerCase().includes(q) ||
          p.type.toLowerCase().includes(q) ||
          (p.description ?? '').toLowerCase().includes(q)
        )
      })
    : all

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          value={keyword}
          onChangeText={handleKeywordChange}
          placeholder="Search programs..."
          placeholderTextColor="#9CA3AF"
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
      </View>

      <View style={styles.filterRow}>
        {STATUSES.map((s) => (
          <TouchableOpacity
            key={s}
            style={[styles.chip, activeStatus === s && styles.chipActive]}
            onPress={() => setActiveStatus(s)}
          >
            <Text style={[styles.chipText, activeStatus === s && styles.chipTextActive]}>
              {STATUS_LABELS[s]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        style={{ flex: 1 }}
        data={programs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ProgramCard item={item} />}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={onRefresh} tintColor="#E84A1F" />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No programs found.</Text>
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
  list: { padding: 16, paddingBottom: 32 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
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
    fontWeight: '700',
    color: '#111827',
  },
  cardType: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 8,
    fontWeight: '500',
  },
  cardDescription: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 12,
  },
  cardDates: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dateText: { fontSize: 13, color: '#9CA3AF' },
  yearText: { fontSize: 13, color: '#9CA3AF' },
  comingSoon: {
    backgroundColor: '#FFF7ED',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  comingSoonText: { fontSize: 13, color: '#C2410C', fontWeight: '500' },
  empty: { paddingTop: 60, alignItems: 'center' },
  emptyText: { fontSize: 15, color: '#9CA3AF' },
})
