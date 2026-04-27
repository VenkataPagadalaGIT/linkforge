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
  // Limit build-time concurrency so SSG of 336 pages fits in a 1Gi K8s pod.
  // Without this, parallel SSG of three.js / framer-motion / R3F-heavy routes
  // peaks at ~2.4GB RSS and OOMs on Emergent's 1Gi deployment pod.
  experimental: {
    cpus: 1,
    workerThreads: false,
  },
};

export default nextConfig;
