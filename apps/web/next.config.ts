import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',

  // Transpile cross-workspace packages (not pre-compiled for Next.js)
  transpilePackages: [
    '@liberia-works/shared-schemas',
    '@liberia-works/shared-types',
    '@liberia-works/shared-utils',
  ],

  // Images from DO Spaces CDN
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.digitaloceanspaces.com',
      },
    ],
  },

  // Strict mode
  reactStrictMode: true,
}

export default nextConfig
