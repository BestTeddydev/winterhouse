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
  // Keep the Firebase Admin SDK out of the webpack bundle
  serverExternalPackages: ['firebase-admin'],
}

module.exports = nextConfig

