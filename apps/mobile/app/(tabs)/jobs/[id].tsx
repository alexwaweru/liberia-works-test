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
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getPublicVacancy, createApplication } from '@/lib/api'
import LoadingView from '@/components/LoadingView'
import ErrorView from '@/components/ErrorView'
import Badge from '@/components/Badge'

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

const TYPE_LABELS: Record<string, string> = {
  PERMANENT: 'Permanent',
  CONTRACT: 'Contract',
  INTERNSHIP: 'Internship',
  VACATION_JOB: 'Vacation Job',
}

type ApplicationFormField = {
  id: string
  label: string
  type: string
  validation?: Record<string, unknown>
}

type ApplicationFormSection = {
  fields: ApplicationFormField[]
}

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const queryClient = useQueryClient()

  const [applyModalVisible, setApplyModalVisible] = useState(false)
  const [responses, setResponses] = useState<Record<string, string>>({})

  const { data: vacancy, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['vacancy', id],
    queryFn: () => getPublicVacancy(id!),
    enabled: !!id,
  })

  const applyMutation = useMutation({
    mutationFn: (formResponses: Record<string, string>) =>
      createApplication(id!, { responses: formResponses }),
    onSuccess: () => {
      Alert.alert('Success', 'Your application has been submitted!')
      setApplyModalVisible(false)
      setResponses({})
      queryClient.invalidateQueries({ queryKey: ['my-applications'] })
    },
    onError: (err: Error) => {
      Alert.alert('Application Failed', err.message)
    },
  })

  function handleApply() {
    if (!vacancy) return
    if (vacancy.applicationForm) {
      setApplyModalVisible(true)
    } else {
      Alert.alert(
        'Confirm Application',
        `Apply for "${vacancy.title}" at ${vacancy.companyName}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Apply', onPress: () => applyMutation.mutate({}) },
        ],
      )
    }
  }

  function handleSubmitForm() {
    applyMutation.mutate(responses)
  }

  if (isLoading) return <LoadingView />
  if (isError || !vacancy) {
    return (
      <ErrorView
        message={(error as Error)?.message ?? 'Failed to load job details'}
        onRetry={refetch}
      />
    )
  }

  const sections: ApplicationFormSection[] = vacancy.applicationForm
    ? (vacancy.applicationForm as { sections: ApplicationFormSection[] }).sections ?? []
    : []

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{vacancy.title}</Text>
          <Text style={styles.company}>{vacancy.companyName}</Text>
          <Badge
            status={vacancy.vacancyType}
            label={TYPE_LABELS[vacancy.vacancyType] ?? vacancy.vacancyType}
          />
        </View>

        {/* Key info */}
        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Slots Available</Text>
            <Text style={styles.infoValue}>{vacancy.slotsAvailable}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Deadline</Text>
            <Text style={styles.infoValue}>{formatDate(vacancy.deadline)}</Text>
          </View>
          {vacancy.postedAt && (
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Posted</Text>
              <Text style={styles.infoValue}>{formatDate(vacancy.postedAt)}</Text>
            </View>
          )}
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{stripHtml(vacancy.description)}</Text>
        </View>

        {/* Apply button */}
        <TouchableOpacity
          style={[styles.applyButton, applyMutation.isPending && styles.applyButtonDisabled]}
          onPress={handleApply}
          disabled={applyMutation.isPending}
        >
          {applyMutation.isPending ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.applyButtonText}>Apply Now</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Application form modal */}
      <Modal
        visible={applyModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setApplyModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Application Form</Text>
            <TouchableOpacity onPress={() => setApplyModalVisible(false)}>
              <Text style={styles.modalClose}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalScroll}
            contentContainerStyle={styles.modalContent}
            keyboardShouldPersistTaps="handled"
          >
            {sections.map((section, sIdx) =>
              section.fields.map((field) => (
                <View key={`${sIdx}-${field.id}`} style={styles.field}>
                  <Text style={styles.fieldLabel}>{field.label}</Text>
                  <TextInput
                    style={styles.fieldInput}
                    value={responses[field.id] ?? ''}
                    onChangeText={(v) => setResponses((prev) => ({ ...prev, [field.id]: v }))}
                    placeholder={`Enter ${field.label.toLowerCase()}`}
                    placeholderTextColor="#9CA3AF"
                    multiline={field.type === 'textarea'}
                    numberOfLines={field.type === 'textarea' ? 4 : 1}
                    textAlignVertical={field.type === 'textarea' ? 'top' : 'center'}
                  />
                </View>
              )),
            )}

            <TouchableOpacity
              style={[styles.applyButton, applyMutation.isPending && styles.applyButtonDisabled]}
              onPress={handleSubmitForm}
              disabled={applyMutation.isPending}
            >
              {applyMutation.isPending ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.applyButtonText}>Submit Application</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#FFFFFF' },
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { padding: 20, paddingBottom: 40 },
  header: { marginBottom: 20 },
  title: { fontSize: 22, fontWeight: '800', color: '#111827', marginBottom: 6 },
  company: { fontSize: 15, color: '#6B7280', marginBottom: 10 },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  infoItem: { minWidth: '45%' },
  infoLabel: { fontSize: 12, color: '#9CA3AF', fontWeight: '500', marginBottom: 2 },
  infoValue: { fontSize: 15, fontWeight: '600', color: '#111827' },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 10 },
  description: { fontSize: 14, color: '#374151', lineHeight: 22 },
  applyButton: {
    backgroundColor: '#E84A1F',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  applyButtonDisabled: { opacity: 0.6 },
  applyButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#FFFFFF',
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  modalClose: { fontSize: 15, color: '#E84A1F', fontWeight: '600' },
  modalScroll: { flex: 1 },
  modalContent: { padding: 20, paddingBottom: 40 },
  field: { marginBottom: 16 },
  fieldLabel: { fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 6 },
  fieldInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#FAFAFA',
  },
})
