import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@intrinsiq/core', '@intrinsiq/ui'],
  agentRules: false,
  poweredByHeader: false,
  headers: async () => [
    {
      source: '/api/:path*',
      headers: [{ key: 'X-Content-Type-Options', value: 'nosniff' }],
    },
  ],
}

export default nextConfig
