/** @type {import('next').NextConfig} */
const nextConfig = {
  // ตั้งค่าให้ใช้ src folder
  experimental: {
    appDir: true,
  },
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
}

module.exports = nextConfig

