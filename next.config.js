/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  experimental: {
    serverComponentsExternalPackages: ['firebase', '@firebase/app', '@firebase/auth', '@firebase/firestore', '@firebase/storage'],
  },
};

module.exports = nextConfig;
