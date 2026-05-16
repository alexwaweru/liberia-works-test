/**
 * Liberia Works — design system tokens.
 *
 * Use these in StyleSheet.create() instead of hard-coding hex values.
 * Mirrors apps/web/src/app/globals.css :root --lw-* variables.
 *
 * Brand rule: crimson is an accent — use sparingly (CTAs, keystone, errors).
 * For everything else, reach for navy/foreground/muted-fg.
 */

export const lwColors = {
  navy: '#0B2342',
  navy700: '#15315A',
  navy300: '#6B7E97',
  crimson: '#BF1120',
  crimson700: '#8E0C17',
  crimson300: '#E5293A',
  white: '#FFFFFF',
  background: '#F7F8FA',
  surface: '#FFFFFF',
  muted: '#F0F2F4',
  foreground: '#0B0E14',
  mutedFg: '#57606E',
  border: 'rgba(11, 35, 66, 0.10)',
  borderStrong: 'rgba(11, 35, 66, 0.22)',
  // Semantic
  success: '#16A34A',
  warning: '#D97706',
  danger: '#DC2626',
} as const

export const lwFont = {
  family: 'Outfit_400Regular',
  familyBold: 'Outfit_600SemiBold',
} as const

export const lwRadius = {
  default: 0,
  full: 9999,
} as const

export const lwSpacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
} as const

export const theme = {
  colors: lwColors,
  font: lwFont,
  radius: lwRadius,
  spacing: lwSpacing,
} as const

export type Theme = typeof theme
