import { View, Text, Image, StyleSheet } from 'react-native'

export function Logo() {
  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/flag.png')}
        style={styles.flag}
        resizeMode="cover"
      />
      <View>
        <Text style={styles.brand}>LIBERIA WORKS</Text>
        <Text style={styles.sub}>MINISTRY OF LABOUR</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  flag: {
    width: 48,
    height: 32,
    borderRadius: 2,
  },
  brand: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 2,
    color: '#111827',
  },
  sub: {
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 2,
    color: '#6B7280',
    marginTop: 2,
  },
})
