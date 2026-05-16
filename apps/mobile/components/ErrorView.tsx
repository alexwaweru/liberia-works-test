import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { lwColors, lwFont, lwRadius } from '@/lib/theme'

type Props = {
  message?: string
  onRetry?: () => void
}

export default function ErrorView({ message = 'Something went wrong.', onRetry }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.message}>{message}</Text>
      {onRetry && (
        <TouchableOpacity style={styles.button} onPress={onRetry}>
          <Text style={styles.buttonText}>Try Again</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: lwColors.surface,
  },
  message: {
    fontSize: 15,
    fontFamily: lwFont.family,
    color: lwColors.mutedFg,
    textAlign: 'center',
    marginBottom: 16,
  },
  button: {
    backgroundColor: lwColors.crimson,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: lwRadius.default,
  },
  buttonText: {
    color: lwColors.white,
    fontFamily: lwFont.familyBold,
    fontSize: 14,
  },
})
