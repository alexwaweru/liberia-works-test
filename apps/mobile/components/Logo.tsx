import { View, Text, StyleSheet } from 'react-native'
import { lwColors, lwFont } from '../lib/theme'
import { LogoMark } from './LogoMark'

interface LogoProps {
  layout?: 'horizontal' | 'stacked'
  tone?: 'light' | 'dark'
  size?: 'sm' | 'md' | 'lg' | number
  hideSubtitle?: boolean
}

const SIZE_PX: Record<'sm' | 'md' | 'lg', number> = { sm: 22, md: 28, lg: 40 }

export function Logo({
  layout = 'horizontal',
  tone = 'light',
  size = 'md',
  hideSubtitle = false,
}: LogoProps) {
  const markSize = typeof size === 'number' ? size : SIZE_PX[size]
  const isHorizontal = layout === 'horizontal'
  const main = tone === 'dark' ? lwColors.white : lwColors.navy
  const sub = tone === 'dark' ? 'rgba(255,255,255,0.55)' : lwColors.mutedFg
  const markTone = tone === 'dark' ? 'white' : 'navy'

  const mainFs = Math.round(markSize * 0.45)
  const subFs = Math.max(9, Math.round(markSize * 0.24))
  const gap = Math.round(markSize * 0.36)

  return (
    <View
      style={[
        styles.container,
        {
          flexDirection: isHorizontal ? 'row' : 'column',
          gap,
        },
      ]}
    >
      <LogoMark tone={markTone} size={markSize} />
      <View style={{ alignItems: isHorizontal ? 'flex-start' : 'center' }}>
        <Text style={[styles.main, { color: main, fontSize: mainFs }]}>LIBERIA WORKS</Text>
        {hideSubtitle ? null : (
          <Text
            style={[
              styles.sub,
              { color: sub, fontSize: subFs, marginTop: Math.round(subFs * 0.4) },
            ]}
          >
            MINISTRY OF LABOR
          </Text>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  main: {
    fontFamily: lwFont.familyBold,
    fontWeight: '600',
    letterSpacing: 1.2,
  },
  sub: {
    fontFamily: lwFont.family,
    fontWeight: '500',
    letterSpacing: 0.6,
  },
})

export default Logo
