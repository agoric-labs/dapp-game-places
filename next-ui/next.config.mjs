/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: [
      '@agoric/ui-components',
      '@agoric/ui-components/dist/next',
      'zustand',
    ],
  },
};

export default nextConfig;
