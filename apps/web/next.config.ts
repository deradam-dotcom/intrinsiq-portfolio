import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@intrinsiq/core', '@intrinsiq/ui'],
  agentRules: false,
}

export default nextConfig
