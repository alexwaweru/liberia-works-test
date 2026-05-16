import Svg, { Rect } from 'react-native-svg'
import { lwColors } from '../lib/theme'

interface LogoMarkProps {
  tone?: 'navy' | 'white'
  size?: number
  keystone?: boolean
}

export function LogoMark({ tone = 'navy', size = 44, keystone = true }: LogoMarkProps) {
  const brick = tone === 'white' ? lwColors.white : lwColors.navy
  const keystoneColor = lwColors.crimson
  return (
    <Svg width={size} height={size} viewBox="0 0 44 44">
      <Rect x={2} y={30} width={12} height={10} fill={brick} />
      <Rect x={16} y={30} width={12} height={10} fill={brick} />
      <Rect x={30} y={30} width={12} height={10} fill={brick} />
      <Rect x={9} y={18} width={12} height={10} fill={brick} />
      <Rect x={23} y={18} width={12} height={10} fill={brick} />
      <Rect x={16} y={6} width={12} height={10} fill={keystone ? keystoneColor : brick} />
    </Svg>
  )
}

export default LogoMark
