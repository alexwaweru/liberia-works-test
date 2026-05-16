import React from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native'
import { router } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { getMe } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import LoadingView from '@/components/LoadingView'
import { lwColors, lwFont, lwRadius } from '@/lib/theme'

function getInitials(name: string | null): string {
  if (!name) return '?'
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

type NavItemProps = {
  icon: React.ComponentProps<typeof Ionicons>['name']
  label: string
  onPress: () => void
}

function NavItem({ icon, label, onPress }: NavItemProps) {
  return (
    <TouchableOpacity style={styles.navItem} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.navItemLeft}>
        <Ionicons name={icon} size={20} color={lwColors.navy} style={styles.navIcon} />
        <Text style={styles.navLabel}>{label}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={lwColors.border} />
    </TouchableOpacity>
  )
}

export default function ProfileScreen() {
  const { signOut } = useAuth()

  const { data: me, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: getMe,
  })

  function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ])
  }

  if (isLoading) return <LoadingView />

  const initials = getInitials(me?.fullName ?? null)

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Avatar + name */}
      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.name}>{me?.fullName ?? 'User'}</Text>
        <Text style={styles.phone}>{me?.phoneNumber ?? ''}</Text>
      </View>

      {/* Navigation links */}
      <View style={styles.navSection}>
        <Text style={styles.navSectionTitle}>Account</Text>
        <View style={styles.navCard}>
          <NavItem
            icon="person-outline"
            label="General Info"
            onPress={() => router.push('/(tabs)/profile/general')}
          />
          <View style={styles.divider} />
          <NavItem
            icon="school-outline"
            label="Education"
            onPress={() => router.push('/(tabs)/profile/education')}
          />
          <View style={styles.divider} />
          <NavItem
            icon="briefcase-outline"
            label="Work Experience"
            onPress={() => router.push('/(tabs)/profile/experience')}
          />
        </View>
      </View>

      {/* Sign out */}
      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Ionicons name="log-out-outline" size={18} color={lwColors.danger} />
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: lwColors.background },
  content: { padding: 20, paddingBottom: 40 },
  avatarSection: { alignItems: 'center', paddingVertical: 24 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: lwRadius.full,
    backgroundColor: lwColors.navy,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: { fontSize: 28, fontFamily: lwFont.familyBold, color: lwColors.white },
  name: { fontSize: 20, fontFamily: lwFont.familyBold, color: lwColors.foreground },
  phone: { fontSize: 14, fontFamily: lwFont.family, color: lwColors.mutedFg, marginTop: 4 },
  navSection: { marginBottom: 24 },
  navSectionTitle: {
    fontSize: 13,
    fontFamily: lwFont.familyBold,
    color: lwColors.mutedFg,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  navCard: {
    backgroundColor: lwColors.surface,
    borderRadius: lwRadius.default,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  navItemLeft: { flexDirection: 'row', alignItems: 'center' },
  navIcon: { marginRight: 12 },
  navLabel: { fontSize: 15, fontFamily: lwFont.family, color: lwColors.foreground },
  divider: { height: 1, backgroundColor: lwColors.muted, marginLeft: 52 },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: lwColors.muted,
    borderRadius: lwRadius.default,
    paddingVertical: 14,
  },
  signOutText: { fontSize: 15, fontFamily: lwFont.familyBold, color: lwColors.danger },
})
