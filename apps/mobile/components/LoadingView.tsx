import React from 'react'
import { View, ActivityIndicator, StyleSheet } from 'react-native'
import { lwColors } from '@/lib/theme'

export default function LoadingView() {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={lwColors.navy} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: lwColors.surface,
  },
})
