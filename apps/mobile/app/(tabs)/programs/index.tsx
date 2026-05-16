import React, { useState, useCallback } from 'react'
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  listProgramCycles,
  getMyOptIns,
  optInToProgram,
  ProgramCycleListItem,
  ProgramOptIn,
} from '@/lib/api'
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

const OPT_IN_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Opted in • Pending',
  MATCHED: 'Matched',
  DECLINED: 'Declined',
  WITHDRAWN: 'Withdrawn',
}

const OPT_IN_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  PENDING: { bg: '#ECFDF5', text: '#065F46' },
  MATCHED: { bg: '#EFF6FF', text: '#1D4ED8' },
  DECLINED: { bg: '#FEF2F2', text: '#991B1B' },
  WITHDRAWN: { bg: '#F3F4F6', text: '#4B5563' },
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

// ── Opt-in modal ──────────────────────────────────────────────────────────────

function OptInModal({
  program,
  visible,
  onClose,
  onSuccess,
}: {
  program: ProgramCycleListItem
  visible: boolean
  onClose: () => void
  onSuccess: () => void
}) {
  const [notes, setNotes] = useState('')
  const qc = useQueryClient()

  const mutation = useMutation({
    mutationFn: () =>
      optInToProgram({
        programCycleId: program.id,
        additionalNotes: notes.trim() || undefined,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['my-opt-ins'] })
      setNotes('')
      onSuccess()
    },
    onError: (err: Error) => {
      Alert.alert('Error', err.message ?? 'Failed to opt in')
    },
  })

  function handleClose() {
    if (mutation.isPending) return
    setNotes('')
    onClose()
  }

  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="overFullScreen">
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />

          <Text style={styles.modalTitle}>Opt in to program</Text>
          <Text style={styles.modalSubtitle} numberOfLines={2}>
            {program.name} · {program.year}
          </Text>

          <Text style={styles.fieldLabel}>Additional notes (optional)</Text>
          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={setNotes}
            placeholder="Any additional information you'd like to share..."
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            editable={!mutation.isPending}
          />

          <TouchableOpacity
            style={[styles.submitBtn, mutation.isPending && styles.submitBtnDisabled]}
            onPress={() => mutation.mutate()}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Text style={styles.submitBtnText}>Confirm opt-in</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelBtn} onPress={handleClose} disabled={mutation.isPending}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

// ── Program card ──────────────────────────────────────────────────────────────

function ProgramCard({
  item,
  optIn,
  onOptInPress,
}: {
  item: ProgramCycleListItem
  optIn: ProgramOptIn | undefined
  onOptInPress: (program: ProgramCycleListItem) => void
}) {
  const statusStyle = optIn ? OPT_IN_STATUS_COLORS[optIn.status] : null
  const isOpen = item.status === 'OPEN'

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

      {optIn ? (
        <View style={[styles.optInBadge, { backgroundColor: statusStyle?.bg ?? '#ECFDF5' }]}>
          <Text style={[styles.optInBadgeText, { color: statusStyle?.text ?? '#065F46' }]}>
            {OPT_IN_STATUS_LABELS[optIn.status] ?? optIn.status}
          </Text>
        </View>
      ) : isOpen ? (
        <TouchableOpacity style={styles.optInBtn} onPress={() => onOptInPress(item)}>
          <Text style={styles.optInBtnText}>Opt in</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.notOpenBadge}>
          <Text style={styles.notOpenText}>
            {item.status === 'PLANNED' ? 'Opens soon' : 'Closed'}
          </Text>
        </View>
      )}
    </View>
  )
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function ProgramsScreen() {
  const router = useRouter()
  const [keyword, setKeyword] = useState('')
  const [activeStatus, setActiveStatus] = useState<StatusFilter>('All')
  const [debouncedKeyword, setDebouncedKeyword] = useState('')
  const [debounceTimer, setDebounceTimer] = useState<ReturnType<typeof setTimeout> | null>(null)
  const [selectedProgram, setSelectedProgram] = useState<ProgramCycleListItem | null>(null)

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['program-cycles', activeStatus],
    queryFn: () =>
      listProgramCycles({ status: activeStatus !== 'All' ? activeStatus : undefined }),
  })

  const { data: optInsData, refetch: refetchOptIns } = useQuery({
    queryKey: ['my-opt-ins'],
    queryFn: getMyOptIns,
  })

  const optInMap = new Map<string, ProgramOptIn>(
    (optInsData?.data ?? []).map((o) => [o.programCycleId, o])
  )

  function handleKeywordChange(text: string) {
    setKeyword(text)
    if (debounceTimer) clearTimeout(debounceTimer)
    const t = setTimeout(() => setDebouncedKeyword(text), 400)
    setDebounceTimer(t)
  }

  const onRefresh = useCallback(() => {
    refetch()
    refetchOptIns()
  }, [refetch, refetchOptIns])

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
      <TouchableOpacity style={styles.myOptInsBtn} onPress={() => router.push('/(tabs)/programs/opt-ins')}>
        <Ionicons name="checkmark-circle-outline" size={18} color="#E84A1F" />
        <Text style={styles.myOptInsBtnText}>My Opt-Ins</Text>
        <Ionicons name="chevron-forward" size={16} color="#9CA3AF" style={{ marginLeft: 'auto' }} />
      </TouchableOpacity>

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
        renderItem={({ item }) => (
          <ProgramCard
            item={item}
            optIn={optInMap.get(item.id)}
            onOptInPress={setSelectedProgram}
          />
        )}
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

      {selectedProgram && (
        <OptInModal
          program={selectedProgram}
          visible={!!selectedProgram}
          onClose={() => setSelectedProgram(null)}
          onSuccess={() => setSelectedProgram(null)}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  myOptInsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  myOptInsBtnText: { fontSize: 14, fontWeight: '600', color: '#111827' },
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
  chipActive: { backgroundColor: '#E84A1F', borderColor: '#E84A1F' },
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
  cardTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: '#111827' },
  cardType: { fontSize: 13, color: '#6B7280', marginBottom: 8, fontWeight: '500' },
  cardDescription: { fontSize: 14, color: '#374151', lineHeight: 20, marginBottom: 12 },
  cardDates: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dateText: { fontSize: 13, color: '#9CA3AF' },
  yearText: { fontSize: 13, color: '#9CA3AF' },
  optInBtn: {
    backgroundColor: '#E84A1F',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  optInBtnText: { fontSize: 14, color: '#FFFFFF', fontWeight: '600' },
  optInBadge: {
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  optInBadgeText: { fontSize: 13, fontWeight: '600' },
  notOpenBadge: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  notOpenText: { fontSize: 13, color: '#9CA3AF', fontWeight: '500' },
  empty: { paddingTop: 60, alignItems: 'center' },
  emptyText: { fontSize: 15, color: '#9CA3AF' },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 4 },
  modalSubtitle: { fontSize: 14, color: '#6B7280', marginBottom: 20 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 },
  notesInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#111827',
    minHeight: 100,
    marginBottom: 20,
  },
  submitBtn: {
    backgroundColor: '#E84A1F',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { fontSize: 15, color: '#FFFFFF', fontWeight: '700' },
  cancelBtn: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelBtnText: { fontSize: 15, color: '#6B7280', fontWeight: '500' },
})
