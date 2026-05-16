import * as React from 'react'

export interface LogoMarkProps extends Omit<React.SVGProps<SVGSVGElement>, 'fill'> {
  tone?: 'navy' | 'white' | 'current'
  size?: number
  keystone?: boolean
  keystoneColor?: string
  title?: string
}

const BRICK_FILL: Record<NonNullable<LogoMarkProps['tone']>, string> = {
  navy: '#0B2342',
  white: '#FFFFFF',
  current: 'currentColor',
}

export const LogoMark = React.forwardRef<SVGSVGElement, LogoMarkProps>(function LogoMark(
  {
    tone = 'navy',
    size = 44,
    keystone = true,
    keystoneColor = '#BF1120',
    title = 'Liberia Works',
    ...rest
  },
  ref,
) {
  const brick = BRICK_FILL[tone]
  const a11y = title
    ? { role: 'img' as const, 'aria-label': title }
    : { 'aria-hidden': true as const }
  return (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 44 44"
      width={size}
      height={size}
      {...a11y}
      {...rest}
    >
      {title ? <title>{title}</title> : null}
      <rect x="2" y="30" width="12" height="10" fill={brick} />
      <rect x="16" y="30" width="12" height="10" fill={brick} />
      <rect x="30" y="30" width="12" height="10" fill={brick} />
      <rect x="9" y="18" width="12" height="10" fill={brick} />
      <rect x="23" y="18" width="12" height="10" fill={brick} />
      <rect x="16" y="6" width="12" height="10" fill={keystone ? keystoneColor : brick} />
    </svg>
  )
})

export default LogoMark
