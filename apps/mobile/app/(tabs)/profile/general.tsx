import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getIndividualProfile, updateIndividualProfile } from '@/lib/api'
import LoadingView from '@/components/LoadingView'
import ErrorView from '@/components/ErrorView'
import { lwColors, lwFont, lwRadius } from '@/lib/theme'

const GENDER_OPTIONS = ['MALE', 'FEMALE', 'PREFER_NOT_TO_SAY'] as const
type Gender = (typeof GENDER_OPTIONS)[number]

const GENDER_LABELS: Record<Gender, string> = {
  MALE: 'Male',
  FEMALE: 'Female',
  PREFER_NOT_TO_SAY: 'Prefer not to say',
}

export default function GeneralScreen() {
  const queryClient = useQueryClient()

  const { data: profile, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['individual-profile'],
    queryFn: getIndividualProfile,
  })

  const [fullName, setFullName] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [gender, setGender] = useState<Gender | ''>('')
  const [nin, setNin] = useState('')

  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName ?? '')
      setDateOfBirth(profile.dateOfBirth ?? '')
      setGender((profile.gender as Gender) ?? '')
      setNin(profile.nin ?? '')
    }
  }, [profile])

  const updateMutation = useMutation({
    mutationFn: () =>
      updateIndividualProfile({
        fullName: fullName.trim() || undefined,
        dateOfBirth: dateOfBirth.trim() || undefined,
        gender: gender || undefined,
        nin: nin.trim() || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['individual-profile'] })
      queryClient.invalidateQueries({ queryKey: ['me'] })
      Alert.alert('Saved', 'Your profile has been updated.')
    },
    onError: (err: Error) => {
      Alert.alert('Error', err.message)
    },
  })

  if (isLoading) return <LoadingView />
  if (isError) {
    return <ErrorView message={(error as Error)?.message ?? 'Failed to load profile'} onRetry={refetch} />
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.flex} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.field}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            value={fullName}
            onChangeText={setFullName}
            placeholder="Your full name"
            placeholderTextColor={lwColors.mutedFg}
            autoCapitalize="words"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Date of Birth</Text>
          <TextInput
            style={styles.input}
            value={dateOfBirth}
            onChangeText={setDateOfBirth}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={lwColors.mutedFg}
            keyboardType="numbers-and-punctuation"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Gender</Text>
          <View style={styles.optionGroup}>
            {GENDER_OPTIONS.map((g) => (
              <TouchableOpacity
                key={g}
                style={[styles.optionChip, gender === g && styles.optionChipActive]}
                onPress={() => setGender(g)}
              >
                <Text style={[styles.optionChipText, gender === g && styles.optionChipTextActive]}>
                  {GENDER_LABELS[g]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>National ID (NIN)</Text>
          <TextInput
            style={styles.input}
            value={nin}
            onChangeText={setNin}
            placeholder="Your NIN"
            placeholderTextColor={lwColors.mutedFg}
            autoCapitalize="characters"
          />
        </View>

        {/* Read-only fields */}
        <View style={styles.field}>
          <Text style={styles.label}>Phone Number</Text>
          <View style={[styles.input, styles.readOnly]}>
            <Text style={styles.readOnlyText}>{profile?.phoneNumber ?? '—'}</Text>
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Email</Text>
          <View style={[styles.input, styles.readOnly]}>
            <Text style={styles.readOnlyText}>{profile?.email ?? '—'}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.saveButton, updateMutation.isPending && styles.saveButtonDisabled]}
          onPress={() => updateMutation.mutate()}
          disabled={updateMutation.isPending}
        >
          {updateMutation.isPending ? (
            <ActivityIndicator color={lwColors.white} />
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: lwColors.surface },
  container: { padding: 20, paddingBottom: 40 },
  field: { marginBottom: 18 },
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
  readOnly: { backgroundColor: lwColors.muted, borderColor: lwColors.border },
  readOnlyText: { fontSize: 15, fontFamily: lwFont.family, color: lwColors.mutedFg },
  optionGroup: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optionChip: {
    borderRadius: lwRadius.default,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: lwColors.muted,
    borderWidth: 1,
    borderColor: lwColors.border,
  },
  optionChipActive: {
    backgroundColor: lwColors.navy,
    borderColor: lwColors.navy,
  },
  optionChipText: { fontSize: 14, fontFamily: lwFont.family, color: lwColors.foreground },
  optionChipTextActive: { color: lwColors.white, fontFamily: lwFont.familyBold },
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
