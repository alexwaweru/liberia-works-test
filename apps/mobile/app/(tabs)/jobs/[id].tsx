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
import HtmlContent from '@/components/HtmlContent'
import { lwColors, lwFont, lwRadius } from '@/lib/theme'

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
          <HtmlContent html={vacancy.description ?? ''} />
        </View>

        {/* Apply button */}
        <TouchableOpacity
          style={[styles.applyButton, applyMutation.isPending && styles.applyButtonDisabled]}
          onPress={handleApply}
          disabled={applyMutation.isPending}
        >
          {applyMutation.isPending ? (
            <ActivityIndicator color={lwColors.white} />
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
                    placeholderTextColor={lwColors.mutedFg}
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
                <ActivityIndicator color={lwColors.white} />
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
  flex: { flex: 1, backgroundColor: lwColors.surface },
  container: { flex: 1, backgroundColor: lwColors.surface },
  content: { padding: 20, paddingBottom: 40 },
  header: { marginBottom: 20 },
  title: { fontSize: 22, fontFamily: lwFont.familyBold, color: lwColors.foreground, marginBottom: 6 },
  company: { fontSize: 15, fontFamily: lwFont.family, color: lwColors.mutedFg, marginBottom: 10 },
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
  infoLabel: { fontSize: 12, fontFamily: lwFont.familyBold, color: lwColors.mutedFg, marginBottom: 2 },
  infoValue: { fontSize: 15, fontFamily: lwFont.familyBold, color: lwColors.foreground },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontFamily: lwFont.familyBold, color: lwColors.foreground, marginBottom: 10 },
  applyButton: {
    backgroundColor: lwColors.crimson,
    borderRadius: lwRadius.default,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  applyButtonDisabled: { opacity: 0.6 },
  applyButtonText: { color: lwColors.white, fontFamily: lwFont.familyBold, fontSize: 16 },
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
  fieldLabel: { fontSize: 14, fontFamily: lwFont.family, color: lwColors.foreground, marginBottom: 6 },
  fieldInput: {
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
})
