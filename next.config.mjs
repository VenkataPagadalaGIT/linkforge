/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // The image optimizer is OFF on purpose. Nothing in the codebase imports
  // next/image, yet the previous config allowed every https host
  // (hostname "**"), which turned /_next/image on the self-hosted Railway
  // deployment into an open proxy: anyone could make this server fetch,
  // process and cache arbitrary URLs (bandwidth abuse, disk-cache growth,
  // and the exact shape of GHSA-9g9p-9gw9-jx7f). Disabling the optimizer
  // removes the endpoint. If next/image is ever adopted, re-enable with an
  // explicit hostname allowlist, never a wildcard.
  images: { unoptimized: true },
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
        // Baseline security headers, site-wide. HSTS is safe to send in dev
        // too because browsers ignore it over plain http; it only takes
        // effect once served over https, which is Railway behind Cloudflare.
        // A full Content-Security-Policy is deliberately NOT here yet: the
        // 3D scenes and inline Next runtime need a worked allowlist, and a
        // hasty CSP that breaks the flagship guides is worse than none.
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
        ],
      },
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
