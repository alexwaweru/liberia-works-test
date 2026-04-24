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

  // Prevent Turbopack from parsing partial file writes on Docker volume mounts.
  // aggregateTimeout waits until writes settle before triggering a rebuild.
  webpack(config, { dev }) {
    if (dev) {
      config.watchOptions = {
        aggregateTimeout: 400,
        poll: 1000,
      }
    }
    return config
  },
}

export default nextConfig
