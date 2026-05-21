import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  allowedDevOrigins: ['*.orb.local'],

  // Transpile cross-workspace packages (not pre-compiled for Next.js)
  transpilePackages: [
    '@liberia-works/shared-schemas',
    '@liberia-works/shared-types',
    '@liberia-works/shared-utils',
  ],

  // Images from Vercel Blob
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
      },
    ],
  },

  // Strict mode
  reactStrictMode: true,

  // Empty turbopack config satisfies Next.js 16's requirement when no webpack config is present.
  // Watch polling for Docker volume mounts is configured via WATCHPACK_POLLING env var instead.
  turbopack: {},

  // Proxy /api/* to the upstream Fastify API so browser requests stay same-origin.
  // This keeps the auth cookie (scoped to the Next.js host) attached on every API call.
  async rewrites() {
    const upstream = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL
    if (!upstream) return []
    return [{ source: '/api/:path*', destination: `${upstream}/api/:path*` }]
  },
}

export default nextConfig
