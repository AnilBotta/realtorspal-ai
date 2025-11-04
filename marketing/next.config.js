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
  // Proxy API requests to the existing FastAPI backend
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://draft-activity-mgr.preview.emergentagent.com/api/:path*',
      },
    ];
  },
}

module.exports = nextConfig