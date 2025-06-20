/** @type {import('next').NextConfig} */
const nextConfig = {
  // React Strict Mode untuk debugging yang lebih baik
  reactStrictMode: true,
  
  // SWC Minification untuk performa yang lebih baik
  swcMinify: true,
  
  // Experimental features (opsional)
  experimental: {
    // Untuk optimasi bundle size
    optimizePackageImports: ['@radix-ui/react-icons', 'lucide-react'],
  },
  
  // Image optimization
  images: {
    domains: ['supabase.co', 'cdn.supabase.co'],
    formats: ['image/webp', 'image/avif'],
  },
  
  // Headers untuk keamanan
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
  
  // PWA support (opsional)
  async rewrites() {
    return [
      {
        source: '/sw.js',
        destination: '/_next/static/sw.js',
      },
    ];
  },
  
  // Bundle analyzer (untuk debugging, bisa dihapus)
  webpack: (config, { dev, isServer }) => {
    // Hanya untuk development debugging
    if (dev && !isServer) {
      console.log('🔧 Webpack config loaded for client');
    }
    
    return config;
  },
  
  // Environment variables yang diperlukan
  env: {
    CUSTOM_KEY: 'finance-tracker-app',
  },
  
  // Output untuk static export (jika diperlukan)
  // output: 'export',
  // trailingSlash: true,
  
  // Compress untuk production
  compress: true,
  
  // PoweredByHeader
  poweredByHeader: false,
  
  // Generate ETags untuk caching
  generateEtags: true,
  
  // Page extensions yang dikenali
  pageExtensions: ['ts', 'tsx', 'js', 'jsx'],
  
  // Redirects (jika diperlukan)
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/dashboard',
        permanent: true,
      },
    ];
  },
}

module.exports = nextConfig;