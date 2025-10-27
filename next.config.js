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
  // Ensure native modules are bundled in standalone mode
  serverExternalPackages: [],
  // Disable static generation for pages that use useSearchParams
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
}

module.exports = nextConfig

