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
      {
        // The 3D game ships a Markdown twin for the same reason the guides do:
        // assistants and crawlers that prefer plain text get the real content
        // instead of a WebGL canvas they cannot read, and the header points
        // every one of them back at the HTML page as the canonical.
        source: "/:page(3d-game).md",
        headers: [
          {
            key: "Link",
            value: '<https://venkatapagadala.com/3d-game>; rel="canonical"',
          },
        ],
      },
      // Fingerprinted build assets never change under the same URL, so the
      // revalidation round trip bought nothing. PRODUCTION ONLY: dev chunk
      // URLs are stable across edits, so marking them immutable made every
      // browser hydrate fresh HTML with year-old cached JS. That served
      // stale pages on localhost no matter how hard anyone reloaded.
      ...(process.env.NODE_ENV === "production"
        ? [{
            source: "/_next/static/:path*",
            headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
          }]
        : []),
      {
        // Posters, photos and the OG card change only on deploy: a day of
        // caching with revalidation is honest and stops the repeat fetches.
        source: "/:file(.*\\.(?:png|jpg|jpeg|webp|avif|svg|ico|woff2))",
        headers: [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }],
      },
    ];
  },
  async redirects() {
    return [
      {
        // www served the entire site at 200 with no redirect, so every URL had
        // a crawlable twin held together only by a canonical tag.
        source: "/:path*",
        has: [{ type: "host", value: "www.venkatapagadala.com" }],
        destination: "https://venkatapagadala.com/:path*",
        permanent: true,
      },
    ];
  },
  experimental: {
    cpus: 1,
    workerThreads: false,
  },
};

export default nextConfig;
