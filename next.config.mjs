/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['pg', 'pg-cloudflare', '@prisma/client', 'bcryptjs'],
};

export default nextConfig;
