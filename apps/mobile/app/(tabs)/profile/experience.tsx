import React, { useState } from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Switch,
} from 'react-native'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { getWorkHistory, addWorkHistory, deleteWorkHistory, WorkHistoryRecord } from '@/lib/api'
import LoadingView from '@/components/LoadingView'
import ErrorView from '@/components/ErrorView'
import { lwColors, lwFont, lwRadius } from '@/lib/theme'

type AddForm = {
  employerName: string
  title: string
  startDate: string
  endDate: string
  isCurrent: boolean
  description: string
}

const emptyForm: AddForm = {
  employerName: '',
  title: '',
  startDate: '',
  endDate: '',
  isCurrent: false,
  description: '',
}

function formatDateRange(start: string | null, end: string | null, isCurrent: boolean) {
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  const s = start ? fmt(start) : null
  if (isCurrent) return s ? `${s} – Present` : 'Present'
  const e = end ? fmt(end) : null
  if (s && e) return `${s} – ${e}`
  return s ?? e ?? ''
}

function ExperienceItem({
  item,
  onDelete,
}: {
  item: WorkHistoryRecord
  onDelete: (id: string) => void
}) {
  return (
    <View style={styles.item}>
      <View style={styles.itemContent}>
        <Text style={styles.itemTitle}>{item.title ?? 'Role'}</Text>
        <Text style={styles.itemSubtitle}>{item.employerName}</Text>
        <Text style={styles.itemDates}>
          {formatDateRange(item.startDate, item.endDate, item.isCurrent)}
        </Text>
        {item.description ? (
          <Text style={styles.itemDescription} numberOfLines={3}>
            {item.description}
          </Text>
        ) : null}
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => {
          Alert.alert(
            'Delete Experience',
            `Remove "${item.title ?? item.employerName}" from your profile?`,
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: () => onDelete(item.id) },
            ],
          )
        }}
      >
        <Ionicons name="trash-outline" size={18} color={lwColors.danger} />
      </TouchableOpacity>
    </View>
  )
}

export default function ExperienceScreen() {
  const queryClient = useQueryClient()
  const [modalVisible, setModalVisible] = useState(false)
  const [form, setForm] = useState<AddForm>(emptyForm)

  const { data: records, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['work-history'],
    queryFn: getWorkHistory,
  })

  const addMutation = useMutation({
    mutationFn: () =>
      addWorkHistory({
        employerName: form.employerName.trim(),
        title: form.title.trim() || undefined,
        startDate: form.startDate.trim() || undefined,
        endDate: form.isCurrent ? undefined : form.endDate.trim() || undefined,
        isCurrent: form.isCurrent,
        description: form.description.trim() || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-history'] })
      setModalVisible(false)
      setForm(emptyForm)
    },
    onError: (err: Error) => {
      Alert.alert('Error', err.message)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteWorkHistory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-history'] })
    },
    onError: (err: Error) => {
      Alert.alert('Error', err.message)
    },
  })

  function handleAdd() {
    if (!form.employerName.trim()) {
      Alert.alert('Validation', 'Employer name is required.')
      return
    }
    addMutation.mutate()
  }

  if (isLoading) return <LoadingView />
  if (isError) {
    return <ErrorView message={(error as Error)?.message ?? 'Failed to load work history'} onRetry={refetch} />
  }

  return (
    <>
      <View style={styles.container}>
        <FlatList
          style={{ flex: 1 }}
          data={records ?? []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ExperienceItem item={item} onDelete={(id) => deleteMutation.mutate(id)} />
          )}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No work history yet.</Text>
            </View>
          }
          ListFooterComponent={
            <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
              <Ionicons name="add-circle-outline" size={20} color={lwColors.white} />
              <Text style={styles.addButtonText}>Add Experience</Text>
            </TouchableOpacity>
          }
        />
      </View>

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Experience</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.modalClose}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalScroll}
            contentContainerStyle={styles.modalContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.field}>
              <Text style={styles.label}>Employer Name *</Text>
              <TextInput
                style={styles.input}
                value={form.employerName}
                onChangeText={(v) => setForm((f) => ({ ...f, employerName: v }))}
                placeholder="e.g. Ministry of Finance"
                placeholderTextColor={lwColors.mutedFg}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Job Title</Text>
              <TextInput
                style={styles.input}
                value={form.title}
                onChangeText={(v) => setForm((f) => ({ ...f, title: v }))}
                placeholder="e.g. Data Analyst"
                placeholderTextColor={lwColors.mutedFg}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Start Date</Text>
              <TextInput
                style={styles.input}
                value={form.startDate}
                onChangeText={(v) => setForm((f) => ({ ...f, startDate: v }))}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={lwColors.mutedFg}
                keyboardType="numbers-and-punctuation"
              />
            </View>

            <View style={styles.switchRow}>
              <Text style={styles.label}>Currently Working Here</Text>
              <Switch
                value={form.isCurrent}
                onValueChange={(v) => setForm((f) => ({ ...f, isCurrent: v }))}
                trackColor={{ true: lwColors.navy, false: lwColors.border }}
                thumbColor={lwColors.white}
              />
            </View>

            {!form.isCurrent && (
              <View style={styles.field}>
                <Text style={styles.label}>End Date</Text>
                <TextInput
                  style={styles.input}
                  value={form.endDate}
                  onChangeText={(v) => setForm((f) => ({ ...f, endDate: v }))}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={lwColors.mutedFg}
                  keyboardType="numbers-and-punctuation"
                />
              </View>
            )}

            <View style={styles.field}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={form.description}
                onChangeText={(v) => setForm((f) => ({ ...f, description: v }))}
                placeholder="Describe your responsibilities..."
                placeholderTextColor={lwColors.mutedFg}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity
              style={[styles.saveButton, addMutation.isPending && styles.saveButtonDisabled]}
              onPress={handleAdd}
              disabled={addMutation.isPending}
            >
              {addMutation.isPending ? (
                <ActivityIndicator color={lwColors.white} />
              ) : (
                <Text style={styles.saveButtonText}>Save</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: lwColors.surface },
  container: { flex: 1, backgroundColor: lwColors.background },
  list: { padding: 16, paddingBottom: 32 },
  item: {
    flexDirection: 'row',
    backgroundColor: lwColors.surface,
    borderRadius: lwRadius.default,
    padding: 14,
    marginBottom: 10,
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  itemContent: { flex: 1 },
  itemTitle: { fontSize: 15, fontFamily: lwFont.familyBold, color: lwColors.foreground, marginBottom: 2 },
  itemSubtitle: { fontSize: 13, fontFamily: lwFont.family, color: lwColors.foreground, marginBottom: 2 },
  itemDates: { fontSize: 12, fontFamily: lwFont.family, color: lwColors.mutedFg, marginTop: 2 },
  itemDescription: { fontSize: 13, fontFamily: lwFont.family, color: lwColors.mutedFg, marginTop: 6, lineHeight: 18 },
  deleteButton: { padding: 4, marginLeft: 8 },
  empty: { paddingTop: 40, alignItems: 'center' },
  emptyText: { fontSize: 14, fontFamily: lwFont.family, color: lwColors.mutedFg },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: lwColors.crimson,
    borderRadius: lwRadius.default,
    paddingVertical: 14,
    marginTop: 16,
  },
  addButtonText: { color: lwColors.white, fontFamily: lwFont.familyBold, fontSize: 15 },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: lwColors.muted,
    backgroundColor: lwColors.surface,
  },
  modalTitle: { fontSize: 18, fontFamily: lwFont.familyBold, color: lwColors.foreground },
  modalClose: { fontSize: 15, fontFamily: lwFont.familyBold, color: lwColors.crimson },
  modalScroll: { flex: 1 },
  modalContent: { padding: 20, paddingBottom: 40 },
  field: { marginBottom: 16 },
  label: { fontSize: 14, fontFamily: lwFont.family, color: lwColors.foreground, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: lwColors.border,
    borderRadius: lwRadius.default,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: lwFont.family,
    color: lwColors.foreground,
    backgroundColor: lwColors.surface,
  },
  textArea: { minHeight: 100 },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  saveButton: {
    backgroundColor: lwColors.crimson,
    borderRadius: lwRadius.default,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { color: lwColors.white, fontFamily: lwFont.familyBold, fontSize: 16 },
})
