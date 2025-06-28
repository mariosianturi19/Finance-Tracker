/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Kurangi logging untuk development
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
  // Experimental features untuk mengurangi noise
  experimental: {
    serverComponentsExternalPackages: [],
  },
};

module.exports = nextConfig;