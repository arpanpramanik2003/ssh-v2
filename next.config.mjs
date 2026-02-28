/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Next.js 14.2+ stable key
  serverExternalPackages: ['sequelize', 'sqlite3', 'pg', 'pg-hstore', 'bcryptjs', 'bcrypt'],

  // Fallback for older Next.js 14.x
  experimental: {
    serverComponentsExternalPackages: ['sequelize', 'sqlite3', 'pg', 'pg-hstore', 'bcryptjs', 'bcrypt'],
  },

  // Force Vercel's file tracer to include pg + sub-packages in every API serverless function
  outputFileTracingIncludes: {
    '/api/**/*': ['./node_modules/pg/**/*', './node_modules/pg-pool/**/*', './node_modules/pg-protocol/**/*', './node_modules/pg-types/**/*', './node_modules/pg-hstore/**/*', './node_modules/pg-connection-string/**/*', './node_modules/pgpass/**/*', './node_modules/pg-int8/**/*'],
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
