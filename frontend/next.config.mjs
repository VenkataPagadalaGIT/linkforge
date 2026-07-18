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
  // Markdown twins (/guides/<slug>.md) are AI-crawler conveniences that duplicate
  // the HTML page. Markdown cannot carry <link rel="canonical">, so we send the
  // canonical as an HTTP Link header (Google supports this for non-HTML files).
  // Result: AI crawlers get clean markdown, Google consolidates all ranking
  // signal into the HTML URL instead of treating the .md as duplicate content.
  async headers() {
    return [
      {
        source: "/guides/:slug([^/.]+).md",
        headers: [
          {
            key: "Link",
            value: '<https://venkatapagadala.com/guides/:slug>; rel="canonical"',
          },
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
        ],
      },
    ];
  },
  experimental: {
    cpus: 1,
    workerThreads: false,
  },
};

export default nextConfig;
