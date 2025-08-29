/** @type {import('next').NextConfig} */
const nextConfig = {
  // Run in server/standalone mode so `next start -p 3000` serves the app
  output: 'standalone',

  // IMPORTANT: do NOT set distDir to "out" or use trailingSlash here
  images: {
    unoptimized: true,
    domains: [
      'source.unsplash.com',
      'images.unsplash.com',
      'ext.same-assets.com',
      'ugc.same-assets.com',
    ],
    remotePatterns: [
      { protocol: 'https', hostname: 'source.unsplash.com', pathname: '/**' },
      { protocol: 'https', hostname: 'images.unsplash.com', pathname: '/**' },
      { protocol: 'https', hostname: 'ext.same-assets.com', pathname: '/**' },
      { protocol: 'https', hostname: 'ugc.same-assets.com', pathname: '/**' },
    ],
  },
}

module.exports = nextConfig

