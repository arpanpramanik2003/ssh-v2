/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Next.js 14.2+ stable key (replaces experimental.serverComponentsExternalPackages)
  serverExternalPackages: ['sequelize', 'sqlite3', 'pg', 'pg-hstore', 'bcryptjs', 'bcrypt'],

  // Keep experimental key for older Next.js 14.x versions (harmless if ignored)
  experimental: {
    serverComponentsExternalPackages: ['sequelize', 'sqlite3', 'pg', 'pg-hstore', 'bcryptjs', 'bcrypt'],
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
