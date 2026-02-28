/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // External packages that should not be bundled by webpack (native Node.js modules)
  // Next.js 14.x syntax:
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
