/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
  webpack: (config) => {
    config.module.rules.push({
      test: /\.(jpe?g|png|gif|svg)$/i,
      type: "asset/resource",
    });
    return config;
  },
};

export default nextConfig;
