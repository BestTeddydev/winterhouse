/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // For Docker standalone build
  output: 'standalone',
  // Disable static generation for pages that use useSearchParams
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
}

module.exports = nextConfig

