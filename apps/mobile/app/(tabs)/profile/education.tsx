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
import { getEducation, addEducation, deleteEducation, EducationRecord } from '@/lib/api'
import LoadingView from '@/components/LoadingView'
import ErrorView from '@/components/ErrorView'
import { lwColors, lwFont, lwRadius } from '@/lib/theme'

type AddForm = {
  institutionName: string
  qualification: string
  fieldOfStudy: string
  startDate: string
  endDate: string
  isCurrent: boolean
}

const emptyForm: AddForm = {
  institutionName: '',
  qualification: '',
  fieldOfStudy: '',
  startDate: '',
  endDate: '',
  isCurrent: false,
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

function EducationItem({
  item,
  onDelete,
}: {
  item: EducationRecord
  onDelete: (id: string) => void
}) {
  return (
    <View style={styles.item}>
      <View style={styles.itemContent}>
        <Text style={styles.itemTitle}>{item.institutionName}</Text>
        {item.qualification ? (
          <Text style={styles.itemSubtitle}>{item.qualification}</Text>
        ) : null}
        {item.fieldOfStudy ? (
          <Text style={styles.itemMeta}>{item.fieldOfStudy}</Text>
        ) : null}
        <Text style={styles.itemDates}>
          {formatDateRange(item.startDate, item.endDate, item.isCurrent)}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => {
          Alert.alert(
            'Delete Education',
            `Remove "${item.institutionName}" from your profile?`,
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

export default function EducationScreen() {
  const queryClient = useQueryClient()
  const [modalVisible, setModalVisible] = useState(false)
  const [form, setForm] = useState<AddForm>(emptyForm)

  const { data: records, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['education'],
    queryFn: getEducation,
  })

  const addMutation = useMutation({
    mutationFn: () =>
      addEducation({
        institutionName: form.institutionName.trim(),
        qualification: form.qualification.trim() || undefined,
        fieldOfStudy: form.fieldOfStudy.trim() || undefined,
        startDate: form.startDate.trim() || undefined,
        endDate: form.isCurrent ? undefined : form.endDate.trim() || undefined,
        isCurrent: form.isCurrent,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['education'] })
      setModalVisible(false)
      setForm(emptyForm)
    },
    onError: (err: Error) => {
      Alert.alert('Error', err.message)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteEducation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['education'] })
    },
    onError: (err: Error) => {
      Alert.alert('Error', err.message)
    },
  })

  function handleAdd() {
    if (!form.institutionName.trim()) {
      Alert.alert('Validation', 'Institution name is required.')
      return
    }
    addMutation.mutate()
  }

  if (isLoading) return <LoadingView />
  if (isError) {
    return <ErrorView message={(error as Error)?.message ?? 'Failed to load education'} onRetry={refetch} />
  }

  return (
    <>
      <View style={styles.container}>
        <FlatList
          style={{ flex: 1 }}
          data={records ?? []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <EducationItem item={item} onDelete={(id) => deleteMutation.mutate(id)} />
          )}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No education records yet.</Text>
            </View>
          }
          ListFooterComponent={
            <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
              <Ionicons name="add-circle-outline" size={20} color={lwColors.white} />
              <Text style={styles.addButtonText}>Add Education</Text>
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
            <Text style={styles.modalTitle}>Add Education</Text>
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
              <Text style={styles.label}>Institution Name *</Text>
              <TextInput
                style={styles.input}
                value={form.institutionName}
                onChangeText={(v) => setForm((f) => ({ ...f, institutionName: v }))}
                placeholder="e.g. University of Liberia"
                placeholderTextColor={lwColors.mutedFg}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Qualification</Text>
              <TextInput
                style={styles.input}
                value={form.qualification}
                onChangeText={(v) => setForm((f) => ({ ...f, qualification: v }))}
                placeholder="e.g. Bachelor's Degree"
                placeholderTextColor={lwColors.mutedFg}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Field of Study</Text>
              <TextInput
                style={styles.input}
                value={form.fieldOfStudy}
                onChangeText={(v) => setForm((f) => ({ ...f, fieldOfStudy: v }))}
                placeholder="e.g. Computer Science"
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
              <Text style={styles.label}>Currently Attending</Text>
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
  itemMeta: { fontSize: 13, fontFamily: lwFont.family, color: lwColors.mutedFg, marginBottom: 2 },
  itemDates: { fontSize: 12, fontFamily: lwFont.family, color: lwColors.mutedFg, marginTop: 4 },
  deleteButton: {
    padding: 4,
    marginLeft: 8,
  },
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
