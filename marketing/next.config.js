/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Don't try to rewrite during static generation
  // Client-side will use NEXT_PUBLIC_API_URL directly
  skipTrailingSlashRedirect: true,
  trailingSlash: false,
}

module.exports = nextConfig