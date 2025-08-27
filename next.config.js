/** @type {import('next').NextConfig} */
const nextConfig = {
  // Azure Static Web Apps configuration
  output: 'export',
  distDir: 'out',
  trailingSlash: true,
  assetPrefix: process.env.NODE_ENV === 'production' ? '' : '',
  images: {
    unoptimized: true,
  },
  
  // Enable experimental features for better Azure compatibility
  experimental: {
    esmExternals: true,
  },
  
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  typescript: {
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig