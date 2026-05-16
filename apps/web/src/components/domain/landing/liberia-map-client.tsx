'use client'

import dynamic from 'next/dynamic'

export const LiberiaMapClient = dynamic(
  () => import('./liberia-map').then((m) => m.LiberiaMap),
  {
    ssr: false,
    loading: () => (
      <div
        style={{ aspectRatio: '1 / 1', width: '100%' }}
        aria-hidden="true"
      />
    ),
  },
)

export default LiberiaMapClient
