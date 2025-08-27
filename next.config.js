import createMDX from '@next/mdx';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const withMDX = createMDX({
  // Configure MDX with basic options
});

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
  
  // Configure MDX file extensions
  pageExtensions: ['js', 'jsx', 'mdx', 'ts', 'tsx'],
}

export default withMDX(withNextIntl(nextConfig));