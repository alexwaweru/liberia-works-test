import React from 'react'
import { View, ActivityIndicator, StyleSheet } from 'react-native'

export default function LoadingView() {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#E84A1F" />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
})
