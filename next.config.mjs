/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Next.js 14.2 compatible: mark server-only packages that shouldn't be bundled for client
  // Vercel automatically includes these packages in serverless functions
  experimental: {
    serverComponentsExternalPackages: ['sequelize', 'sqlite3', 'pg', 'pg-hstore', 'bcryptjs', 'bcrypt'],
  },

  // Keep webpack externals simple — push strings so webpack preserves require() calls
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('pg-native');
    }
    return config;
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },
};

export default nextConfig;
