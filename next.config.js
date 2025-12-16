/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    // Allow unoptimized images for static assets like logo
    unoptimized: false,
  },
  // For Docker standalone build
  output: 'standalone',
  // Ensure native modules are bundled in standalone mode
  serverExternalPackages: [],
  // Disable static generation for pages that use useSearchParams
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
  // Ensure public folder is included in standalone build
  publicRuntimeConfig: {
    // This ensures public assets are accessible
  },
}

module.exports = nextConfig

