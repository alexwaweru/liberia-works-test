import React, { useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getProgramCycle,
  getMyOptIns,
  optInToProgram,
  ProgramOptIn,
} from '@/lib/api'
import LoadingView from '@/components/LoadingView'
import ErrorView from '@/components/ErrorView'
import Badge from '@/components/Badge'
import HtmlContent from '@/components/HtmlContent'
import { lwColors, lwFont, lwRadius } from '@/lib/theme'

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
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

export default function ProgramDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const queryClient = useQueryClient()

  const [optInModalVisible, setOptInModalVisible] = useState(false)
  const [notes, setNotes] = useState('')

  const { data: cycle, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['program-cycle', id],
    queryFn: () => getProgramCycle(id!),
    enabled: !!id,
  })

  const { data: optInsData } = useQuery({
    queryKey: ['my-opt-ins'],
    queryFn: getMyOptIns,
  })

  const existingOptIn: ProgramOptIn | undefined = (optInsData?.data ?? []).find(
    (o) => o.programCycleId === id,
  )

  const optInMutation = useMutation({
    mutationFn: () =>
      optInToProgram({
        programCycleId: id!,
        additionalNotes: notes.trim() || undefined,
      }),
    onSuccess: () => {
      Alert.alert('Success', "You've opted in to this program.")
      setOptInModalVisible(false)
      setNotes('')
      queryClient.invalidateQueries({ queryKey: ['my-opt-ins'] })
    },
    onError: (err: Error) => {
      Alert.alert('Opt-in Failed', err.message)
    },
  })

  if (isLoading) return <LoadingView />
  if (isError || !cycle) {
    return (
      <ErrorView
        message={(error as Error)?.message ?? 'Failed to load program details'}
        onRetry={refetch}
      />
    )
  }

  const isOpen = cycle.status === 'OPEN'
  const hasDescription = (cycle.description ?? '').trim().length > 0
  const optInStatusStyle = existingOptIn ? OPT_IN_STATUS_COLORS[existingOptIn.status] : null

  function handleCloseModal() {
    if (optInMutation.isPending) return
    setOptInModalVisible(false)
    setNotes('')
  }

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{cycle.name}</Text>
          <View style={styles.subtitleRow}>
            <Text style={styles.year}>{cycle.year}</Text>
            <Badge status={cycle.status} />
          </View>
        </View>

        {/* Metadata block */}
        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>TYPE</Text>
            <Text style={styles.infoValue}>{cycle.type}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>YEAR</Text>
            <Text style={styles.infoValue}>{cycle.year}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>STATUS</Text>
            <Text style={styles.infoValue}>{cycle.status}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>OPENS</Text>
            <Text style={styles.infoValue}>{formatDate(cycle.startDate)}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>CLOSES</Text>
            <Text style={styles.infoValue}>{formatDate(cycle.endDate)}</Text>
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          {hasDescription ? (
            <HtmlContent html={cycle.description!} />
          ) : (
            <Text style={styles.descriptionEmpty}>No description provided.</Text>
          )}
        </View>

        {/* Opt-in action */}
        {existingOptIn ? (
          <View
            style={[
              styles.optInBadge,
              { backgroundColor: optInStatusStyle?.bg ?? '#ECFDF5' },
            ]}
          >
            <Text
              style={[
                styles.optInBadgeText,
                { color: optInStatusStyle?.text ?? '#065F46' },
              ]}
            >
              {OPT_IN_STATUS_LABELS[existingOptIn.status] ?? existingOptIn.status}
            </Text>
          </View>
        ) : (
          <>
            <TouchableOpacity
              style={[styles.optInButton, !isOpen && styles.optInButtonDisabled]}
              onPress={() => setOptInModalVisible(true)}
              disabled={!isOpen}
            >
              <Text style={styles.optInButtonText}>Opt In Now</Text>
            </TouchableOpacity>
            {!isOpen && (
              <Text style={styles.helperText}>
                {cycle.status === 'PLANNED'
                  ? 'This program is not yet open for opt-ins.'
                  : 'This program is no longer accepting opt-ins.'}
              </Text>
            )}
          </>
        )}
      </ScrollView>

      {/* Opt-in modal */}
      <Modal
        visible={optInModalVisible}
        animationType="slide"
        transparent
        presentationStyle="overFullScreen"
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />

            <Text style={styles.modalTitle}>Opt in to program</Text>
            <Text style={styles.modalSubtitle} numberOfLines={2}>
              {cycle.name} · {cycle.year}
            </Text>

            <Text style={styles.fieldLabel}>Additional notes (optional)</Text>
            <TextInput
              style={styles.notesInput}
              value={notes}
              onChangeText={setNotes}
              placeholder="Any additional information you'd like to share..."
              placeholderTextColor={lwColors.mutedFg}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              editable={!optInMutation.isPending}
            />

            <TouchableOpacity
              style={[styles.submitBtn, optInMutation.isPending && styles.submitBtnDisabled]}
              onPress={() => optInMutation.mutate()}
              disabled={optInMutation.isPending}
            >
              {optInMutation.isPending ? (
                <ActivityIndicator color={lwColors.white} size="small" />
              ) : (
                <Text style={styles.submitBtnText}>Confirm opt-in</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={handleCloseModal}
              disabled={optInMutation.isPending}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: lwColors.surface },
  content: { padding: 20, paddingBottom: 40 },
  header: { marginBottom: 20 },
  title: {
    fontSize: 22,
    fontFamily: lwFont.familyBold,
    color: lwColors.foreground,
    marginBottom: 8,
  },
  subtitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  year: { fontSize: 15, fontFamily: lwFont.family, color: lwColors.mutedFg },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    backgroundColor: lwColors.background,
    borderRadius: lwRadius.default,
    padding: 16,
    marginBottom: 20,
  },
  infoItem: { minWidth: '45%' },
  infoLabel: {
    fontSize: 12,
    fontFamily: lwFont.familyBold,
    color: lwColors.mutedFg,
    marginBottom: 2,
  },
  infoValue: { fontSize: 15, fontFamily: lwFont.familyBold, color: lwColors.foreground },
  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 16,
    fontFamily: lwFont.familyBold,
    color: lwColors.foreground,
    marginBottom: 10,
  },
  descriptionEmpty: {
    fontSize: 14,
    fontFamily: lwFont.family,
    color: lwColors.mutedFg,
    fontStyle: 'italic',
  },
  optInButton: {
    backgroundColor: lwColors.crimson,
    borderRadius: lwRadius.default,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  optInButtonDisabled: { opacity: 0.5 },
  optInButtonText: { color: lwColors.white, fontFamily: lwFont.familyBold, fontSize: 16 },
  helperText: {
    fontSize: 13,
    fontFamily: lwFont.family,
    color: lwColors.mutedFg,
    textAlign: 'center',
    marginTop: 10,
  },
  optInBadge: {
    borderRadius: lwRadius.default,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  optInBadgeText: { fontSize: 14, fontFamily: lwFont.familyBold },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: lwColors.surface,
    borderTopLeftRadius: lwRadius.default,
    borderTopRightRadius: lwRadius.default,
    padding: 24,
    paddingBottom: 40,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: lwColors.border,
    borderRadius: lwRadius.full,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: lwFont.familyBold,
    color: lwColors.foreground,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    fontFamily: lwFont.family,
    color: lwColors.mutedFg,
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 13,
    fontFamily: lwFont.familyBold,
    color: lwColors.foreground,
    marginBottom: 8,
  },
  notesInput: {
    backgroundColor: lwColors.background,
    borderWidth: 1,
    borderColor: lwColors.border,
    borderRadius: lwRadius.default,
    padding: 12,
    fontSize: 14,
    fontFamily: lwFont.family,
    color: lwColors.foreground,
    minHeight: 100,
    marginBottom: 20,
  },
  submitBtn: {
    backgroundColor: lwColors.crimson,
    borderRadius: lwRadius.default,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { fontSize: 15, fontFamily: lwFont.familyBold, color: lwColors.white },
  cancelBtn: { paddingVertical: 12, alignItems: 'center' },
  cancelBtnText: { fontSize: 15, fontFamily: lwFont.family, color: lwColors.mutedFg },
})
