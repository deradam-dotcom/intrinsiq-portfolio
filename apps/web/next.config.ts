import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@intrinsiq/core'],
  agentRules: false,
}

export default nextConfig
