/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Next.js 14.2+ stable key
  serverExternalPackages: ['sequelize', 'sqlite3', 'pg', 'pg-hstore', 'bcryptjs', 'bcrypt'],

  // Fallback for older Next.js 14.x
  experimental: {
    serverComponentsExternalPackages: ['sequelize', 'sqlite3', 'pg', 'pg-hstore', 'bcryptjs', 'bcrypt'],
  },

  // Belt-and-suspenders: explicitly mark native Node packages as webpack externals
  // This guarantees pg/sequelize/sqlite3 are NEVER bundled, even in API routes
  webpack: (config, { isServer }) => {
    if (isServer) {
      const nativeExternals = ['pg', 'pg-hstore', 'pg-native', 'sequelize', 'sqlite3', 'bcrypt', 'bcryptjs'];
      config.externals = [
        ...(Array.isArray(config.externals) ? config.externals : [config.externals].filter(Boolean)),
        ({ request }, callback) => {
          if (nativeExternals.includes(request)) {
            return callback(null, `commonjs ${request}`);
          }
          callback();
        },
      ];
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
