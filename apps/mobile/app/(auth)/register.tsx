import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Modal,
  FlatList,
} from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useQuery } from '@tanstack/react-query'
import { registerIndividual, verifyOtp, getLiberiaCounties } from '@/lib/api'
import { storeTokens, useAuth } from '@/lib/auth'
import { Logo } from '@/components/Logo'
import { lwColors, lwFont, lwRadius } from '@/lib/theme'

type Gender = 'male' | 'female' | 'unspecified'
type Step = 'details' | 'otp'

const GENDER_OPTIONS: { label: string; value: Gender }[] = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'Prefer not to say', value: 'unspecified' },
]

const PASSWORD_REQUIREMENTS = [
  { label: 'At least 12 characters', test: (p: string) => p.length >= 12 },
  { label: 'One uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'One lowercase letter', test: (p: string) => /[a-z]/.test(p) },
  { label: 'One number', test: (p: string) => /\d/.test(p) },
  { label: 'One special character', test: (p: string) => /[^A-Za-z0-9]/.test(p) },
]

export default function RegisterScreen() {
  const { setUser } = useAuth()
  const [step, setStep] = useState<Step>('details')

  // Step 1 fields
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [countyId, setCountyId] = useState<number | null>(null)
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [gender, setGender] = useState<Gender | null>(null)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [countyModalOpen, setCountyModalOpen] = useState(false)

  // Step 2
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)

  const { data: states, isLoading: statesLoading } = useQuery({
    queryKey: ['states', 'LR'],
    queryFn: getLiberiaCounties,
    staleTime: 60 * 60 * 1000,
  })

  const selectedCounty = states?.find((s) => s.id === countyId)
  const passwordMet = PASSWORD_REQUIREMENTS.map((r) => r.test(password))
  const allPasswordMet = passwordMet.every(Boolean)
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword

  async function handleRegister() {
    if (!fullName.trim()) return Alert.alert('Validation', 'Full name is required.')
    if (!phone.trim()) return Alert.alert('Validation', 'Phone number is required.')
    if (!countyId) return Alert.alert('Validation', 'Please select your county.')
    if (!allPasswordMet) return Alert.alert('Validation', 'Password does not meet all requirements.')
    if (!passwordsMatch) return Alert.alert('Validation', 'Passwords do not match.')

    setLoading(true)
    try {
      await registerIndividual({
        phone: `+231${phone.trim()}`,
        fullName: fullName.trim(),
        countyId,
        password,
        channel: 'SMS',
        email: email.trim() || undefined,
        dateOfBirth: dateOfBirth.trim() || undefined,
        gender: gender ?? undefined,
      })
      setStep('otp')
    } catch (err: unknown) {
      Alert.alert('Registration Failed', err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyOtp() {
    if (!otp.trim()) return Alert.alert('Validation', 'Please enter the OTP sent to your phone.')

    setLoading(true)
    try {
      const fullPhone = `+231${phone.trim()}`
      const result = await verifyOtp({ phone: fullPhone, otp: otp.trim(), purpose: 'REGISTRATION' })
      const accessToken = result.accessToken

      if (!accessToken) {
        Alert.alert('Verification Failed', 'Could not read authentication token. Please try logging in.')
        router.replace('/(auth)/login')
        return
      }

      await storeTokens(accessToken)
      setUser({ userId: result.userId, role: result.role, expiresAt: result.expiresAt })
      router.replace('/(tabs)/jobs')
    } catch (err: unknown) {
      Alert.alert('Verification Failed', err instanceof Error ? err.message : 'OTP verification failed')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'otp') {
    return (
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView style={styles.flex} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.logoRow}><Logo /></View>
          <View style={styles.card}>
            <Text style={styles.title}>Verify your phone</Text>
            <Text style={styles.subtitle}>We sent a 6-digit code to +231{phone}</Text>

            <View style={styles.field}>
              <Text style={styles.label}>One-time password <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={[styles.input, styles.otpInput]}
                value={otp}
                onChangeText={setOtp}
                placeholder="000000"
                placeholderTextColor={lwColors.mutedFg}
                keyboardType="number-pad"
                maxLength={6}
                textAlign="center"
              />
            </View>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleVerifyOtp}
              disabled={loading}
            >
              <Text style={styles.buttonText}>{loading ? 'Verifying…' : 'Verify & Continue'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.linkRow} onPress={() => setStep('details')}>
              <Text style={styles.linkText}><Text style={styles.linkBold}>← Back</Text></Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    )
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView style={styles.flex} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.logoRow}><Logo /></View>

        <View style={styles.card}>
          <Text style={styles.title}>Create your account</Text>
          <Text style={styles.subtitle}>Find jobs and programs across all 15 counties of Liberia.</Text>

          {/* Full name */}
          <View style={styles.field}>
            <Text style={styles.label}>Full name <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={styles.input}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Your full name"
              placeholderTextColor={lwColors.mutedFg}
              autoCapitalize="words"
            />
          </View>

          {/* Phone number */}
          <View style={styles.field}>
            <Text style={styles.label}>Phone number <Text style={styles.required}>*</Text></Text>
            <View style={styles.phoneRow}>
              <View style={styles.dialCode}>
                <Text style={styles.dialCodeText}>🇱🇷 +231</Text>
              </View>
              <TextInput
                style={[styles.input, styles.phoneInput]}
                value={phone}
                onChangeText={setPhone}
                placeholder="XX XXX XXXX"
                placeholderTextColor={lwColors.mutedFg}
                keyboardType="phone-pad"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          {/* Email (optional) */}
          <View style={styles.field}>
            <Text style={styles.label}>Email address <Text style={styles.optional}>(optional)</Text></Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={lwColors.mutedFg}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* County */}
          <View style={styles.field}>
            <Text style={styles.label}>County <Text style={styles.required}>*</Text></Text>
            {statesLoading ? (
              <View style={[styles.input, styles.loadingRow]}>
                <ActivityIndicator size="small" color={lwColors.navy} />
                <Text style={styles.loadingText}>Loading counties…</Text>
              </View>
            ) : (
              <TouchableOpacity style={styles.input} onPress={() => setCountyModalOpen(true)}>
                <Text style={selectedCounty ? styles.selectValue : styles.selectPlaceholder}>
                  {selectedCounty ? selectedCounty.name : 'Select your county'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Date of birth */}
          <View style={styles.field}>
            <Text style={styles.label}>Date of birth</Text>
            <TextInput
              style={styles.input}
              value={dateOfBirth}
              onChangeText={setDateOfBirth}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={lwColors.mutedFg}
              keyboardType="numbers-and-punctuation"
              maxLength={10}
            />
          </View>

          {/* Gender */}
          <View style={styles.field}>
            <Text style={styles.label}>Gender</Text>
            <View style={styles.radioGroup}>
              {GENDER_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={styles.radioRow}
                  onPress={() => setGender(opt.value)}
                >
                  <View style={[styles.radioOuter, gender === opt.value && styles.radioOuterActive]}>
                    {gender === opt.value && <View style={styles.radioInner} />}
                  </View>
                  <Text style={styles.radioLabel}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Password */}
          <View style={styles.field}>
            <Text style={styles.label}>Password <Text style={styles.required}>*</Text></Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                value={password}
                onChangeText={setPassword}
                placeholder="Min. 12 characters"
                placeholderTextColor={lwColors.mutedFg}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity style={styles.eyeButton} onPress={() => setShowPassword((v) => !v)}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={lwColors.mutedFg} />
              </TouchableOpacity>
            </View>
            {password.length > 0 && (
              <View style={styles.requirements}>
                {PASSWORD_REQUIREMENTS.map((req, i) => (
                  <View key={req.label} style={styles.reqRow}>
                    <Text style={passwordMet[i] ? styles.reqMet : styles.reqUnmet}>
                      {passwordMet[i] ? '✓' : '✗'} {req.label}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Confirm password */}
          <View style={styles.field}>
            <Text style={styles.label}>Confirm password <Text style={styles.required}>*</Text></Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Repeat your password"
                placeholderTextColor={lwColors.mutedFg}
                secureTextEntry={!showConfirm}
              />
              <TouchableOpacity style={styles.eyeButton} onPress={() => setShowConfirm((v) => !v)}>
                <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={20} color={lwColors.mutedFg} />
              </TouchableOpacity>
            </View>
            {confirmPassword.length > 0 && (
              <Text style={passwordsMatch ? styles.reqMet : styles.reqUnmet}>
                {passwordsMatch ? '✓ Passwords match' : '✗ Passwords do not match'}
              </Text>
            )}
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            <Text style={styles.buttonText}>{loading ? 'Creating account…' : 'Continue'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.linkRow} onPress={() => router.back()}>
            <Text style={styles.linkText}>
              Already have an account? <Text style={styles.linkBold}>Sign in</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* County picker modal */}
      <Modal visible={countyModalOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setCountyModalOpen(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select County</Text>
            <TouchableOpacity onPress={() => setCountyModalOpen(false)}>
              <Text style={styles.modalClose}>Done</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={states ?? []}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.countyItem, countyId === item.id && styles.countyItemActive]}
                onPress={() => { setCountyId(item.id); setCountyModalOpen(false) }}
              >
                <Text style={[styles.countyItemText, countyId === item.id && styles.countyItemTextActive]}>
                  {item.name}
                </Text>
                {countyId === item.id && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: lwColors.background },
  container: { flexGrow: 1, padding: 20, paddingTop: 40, paddingBottom: 40 },
  logoRow: { alignItems: 'center', marginBottom: 24 },
  card: {
    backgroundColor: lwColors.surface,
    borderRadius: lwRadius.default,
    padding: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  title: { fontSize: 22, fontFamily: lwFont.familyBold, color: lwColors.foreground, marginBottom: 4 },
  subtitle: { fontSize: 13, fontFamily: lwFont.family, color: lwColors.mutedFg, marginBottom: 24, lineHeight: 18 },
  field: { marginBottom: 16 },
  label: { fontSize: 14, fontFamily: lwFont.family, color: lwColors.foreground, marginBottom: 6 },
  required: { color: lwColors.crimson },
  optional: { color: lwColors.mutedFg },
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
    justifyContent: 'center',
  },
  phoneRow: { flexDirection: 'row', gap: 8 },
  dialCode: {
    borderWidth: 1,
    borderColor: lwColors.border,
    borderRadius: lwRadius.default,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: lwColors.muted,
    justifyContent: 'center',
  },
  dialCodeText: { fontSize: 14, fontFamily: lwFont.family, color: lwColors.foreground },
  phoneInput: { flex: 1 },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  loadingText: { fontSize: 14, fontFamily: lwFont.family, color: lwColors.mutedFg },
  selectValue: { fontSize: 15, fontFamily: lwFont.family, color: lwColors.foreground },
  selectPlaceholder: { fontSize: 15, fontFamily: lwFont.family, color: lwColors.mutedFg },
  radioGroup: { gap: 12 },
  radioRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: lwRadius.full,
    borderWidth: 2,
    borderColor: lwColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterActive: { borderColor: lwColors.navy },
  radioInner: { width: 10, height: 10, borderRadius: lwRadius.full, backgroundColor: lwColors.navy },
  radioLabel: { fontSize: 15, fontFamily: lwFont.family, color: lwColors.foreground },
  passwordRow: { flexDirection: 'row', alignItems: 'center' },
  passwordInput: { flex: 1, borderTopRightRadius: 0, borderBottomRightRadius: 0 },
  eyeButton: {
    borderWidth: 1,
    borderLeftWidth: 0,
    borderColor: lwColors.border,
    borderTopRightRadius: lwRadius.default,
    borderBottomRightRadius: lwRadius.default,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: lwColors.surface,
    justifyContent: 'center',
  },

  requirements: { marginTop: 8, backgroundColor: lwColors.background, borderRadius: lwRadius.default, padding: 12, gap: 4 },
  reqRow: {},
  reqMet: { fontSize: 13, fontFamily: lwFont.family, color: lwColors.success },
  reqUnmet: { fontSize: 13, fontFamily: lwFont.family, color: lwColors.danger },
  button: {
    backgroundColor: lwColors.crimson,
    borderRadius: lwRadius.default,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: lwColors.white, fontFamily: lwFont.familyBold, fontSize: 16 },
  linkRow: { alignItems: 'center', marginTop: 20 },
  linkText: { fontSize: 14, fontFamily: lwFont.family, color: lwColors.mutedFg },
  linkBold: { color: lwColors.crimson, fontFamily: lwFont.familyBold },
  otpInput: { fontSize: 24, letterSpacing: 8, textAlign: 'center' },
  // Modal
  modalContainer: { flex: 1, backgroundColor: lwColors.surface },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: lwColors.muted,
  },
  modalTitle: { fontSize: 17, fontFamily: lwFont.familyBold, color: lwColors.foreground },
  modalClose: { fontSize: 15, fontFamily: lwFont.familyBold, color: lwColors.crimson },
  countyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: lwColors.background,
  },
  countyItemActive: { backgroundColor: lwColors.muted },
  countyItemText: { fontSize: 16, fontFamily: lwFont.family, color: lwColors.foreground },
  countyItemTextActive: { color: lwColors.navy, fontFamily: lwFont.familyBold },
  checkmark: { fontSize: 16, color: lwColors.navy },
})
