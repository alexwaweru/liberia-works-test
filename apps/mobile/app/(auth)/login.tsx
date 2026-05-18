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
} from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { loginWithPassword } from '@/lib/api'
import { storeTokens, useAuth } from '@/lib/auth'
import { Logo } from '@/components/Logo'
import { lwColors, lwFont, lwRadius } from '@/lib/theme'

type LoginMethod = 'email' | 'phone'

export default function LoginScreen() {
  const { setUser } = useAuth()
  const [method, setMethod] = useState<LoginMethod>('email')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    const identifier = method === 'email' ? email.trim() : phone.trim()
    if (!identifier || !password.trim()) {
      Alert.alert('Validation', `Please enter your ${method === 'email' ? 'email' : 'phone number'} and password.`)
      return
    }

    setLoading(true)
    try {
      const digits = identifier.replace(/\D/g, '').replace(/^231/, '')
      const body = method === 'email'
        ? { email: identifier.toLowerCase(), password }
        : { phoneNumber: `+231${digits}`, password }

      const result = await loginWithPassword(body)
      const accessToken = result.accessToken

      if (!accessToken) {
        Alert.alert('Login Failed', 'Could not read authentication token. Please try again.')
        return
      }

      if (result.role !== 'INDIVIDUAL') {
        Alert.alert(
          'Wrong App',
          'Employer accounts are managed through the Liberia Works web portal. Please visit the website to sign in.',
          [{ text: 'OK' }],
        )
        return
      }

      await storeTokens(accessToken)
      setUser({ userId: result.userId, role: result.role, expiresAt: result.expiresAt })
      router.replace('/(tabs)/jobs')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed'
      Alert.alert('Login Failed', message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          {/* Logo — inside card, centered, matching web */}
          <View style={styles.logoRow}>
            <Logo />
          </View>

          <Text style={styles.title}>Sign in to your account</Text>
          <Text style={styles.subtitle}>Enter your credentials below to continue</Text>

          {/* Tab switcher */}
          <View style={styles.tabs}>
            <TouchableOpacity
              style={[styles.tab, method === 'email' && styles.tabActive]}
              onPress={() => setMethod('email')}
            >
              <Text style={[styles.tabText, method === 'email' && styles.tabTextActive]}>Email</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, method === 'phone' && styles.tabActive]}
              onPress={() => setMethod('phone')}
            >
              <Text style={[styles.tabText, method === 'phone' && styles.tabTextActive]}>Phone number</Text>
            </TouchableOpacity>
          </View>

          {method === 'email' ? (
            <View style={styles.field}>
              <Text style={styles.label}>Email <Text style={styles.required}>*</Text></Text>
              <View style={styles.inputRow}>
                <Text style={styles.inputIcon}>✉</Text>
                <TextInput
                  style={styles.inputWithIcon}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  placeholderTextColor={lwColors.mutedFg}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>
          ) : (
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
          )}

          <View style={styles.field}>
            <Text style={styles.label}>Password <Text style={styles.required}>*</Text></Text>
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.inputWithIcon, { flex: 1, borderRightWidth: 0, borderTopRightRadius: 0, borderBottomRightRadius: 0 }]}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={lwColors.mutedFg}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity style={styles.eyeButton} onPress={() => setShowPassword((v) => !v)}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={lwColors.mutedFg} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.forgotRow}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.buttonText}>{loading ? 'Signing in…' : 'Sign In'}</Text>
          </TouchableOpacity>

          <View style={styles.signupRow}>
            <Text style={styles.signupText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
              <Text style={styles.signupLink}>Sign up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: lwColors.background },
  container: { flexGrow: 1, justifyContent: 'center', padding: 20 },
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
  logoRow: { alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 24, fontFamily: lwFont.familyBold, color: lwColors.foreground, textAlign: 'center', marginBottom: 6 },
  subtitle: { fontSize: 14, fontFamily: lwFont.family, color: lwColors.mutedFg, textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  tabs: {
    flexDirection: 'row',
    backgroundColor: lwColors.muted,
    borderRadius: lwRadius.default,
    padding: 4,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: lwRadius.default,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: lwColors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  tabText: { fontSize: 14, fontFamily: lwFont.family, color: lwColors.mutedFg },
  tabTextActive: { color: lwColors.foreground, fontFamily: lwFont.familyBold },
  field: { marginBottom: 18 },
  label: { fontSize: 14, fontFamily: lwFont.familyBold, color: lwColors.foreground, marginBottom: 7 },
  required: { color: lwColors.crimson },
  input: {
    borderWidth: 1,
    borderColor: lwColors.border,
    borderRadius: lwRadius.default,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    fontFamily: lwFont.family,
    color: lwColors.foreground,
    backgroundColor: lwColors.surface,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: lwColors.border,
    borderRadius: lwRadius.default,
    backgroundColor: lwColors.surface,
    overflow: 'hidden',
  },
  inputIcon: {
    paddingLeft: 14,
    fontSize: 16,
    color: lwColors.mutedFg,
  },
  inputWithIcon: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 13,
    fontSize: 15,
    fontFamily: lwFont.family,
    color: lwColors.foreground,
    backgroundColor: lwColors.surface,
  },
  eyeButton: {
    paddingHorizontal: 14,
    paddingVertical: 13,
    justifyContent: 'center',
  },
  eyeText: { fontSize: 18 },
  phoneRow: { flexDirection: 'row', gap: 8 },
  dialCode: {
    borderWidth: 1,
    borderColor: lwColors.border,
    borderRadius: lwRadius.default,
    paddingHorizontal: 12,
    paddingVertical: 13,
    backgroundColor: lwColors.muted,
    justifyContent: 'center',
  },
  dialCodeText: { fontSize: 14, fontFamily: lwFont.family, color: lwColors.foreground },
  phoneInput: { flex: 1 },
  forgotRow: { alignItems: 'flex-end', marginTop: 8 },
  forgotText: { fontSize: 14, fontFamily: lwFont.family, color: lwColors.crimson },
  button: {
    backgroundColor: lwColors.crimson,
    borderRadius: lwRadius.default,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 20,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: lwColors.white, fontFamily: lwFont.familyBold, fontSize: 16 },
  signupRow: { flexDirection: 'row', justifyContent: 'center' },
  signupText: { fontSize: 14, fontFamily: lwFont.family, color: lwColors.mutedFg },
  signupLink: { fontSize: 14, fontFamily: lwFont.familyBold, color: lwColors.crimson },
})
