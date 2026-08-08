export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, "") ||
  // Hard fallback: an unset env var must never blank canonicals or crash
  // metadataBase (new URL("") throws at build time).
  "https://venkatapagadala.com";

export const SITE_NAME = "Venkata Pagadala";
export const SITE_TAGLINE = "AI Systems Architect · Mono Mind";
export const SITE_DESCRIPTION =
  "Mono Mind: AI systems, research, and real-world solutions by Venkata Pagadala. Insights, the AI Contributors encyclopedia, updates, and engineering notebooks optimized for humans, search engines, and AI retrieval.";

export const OG_IMAGE = `${SITE_URL}/og-image.png`;
// Was a stale Lovable preview screenshot on a pub-*.r2.dev bucket: wrong
// shape for a card, wrong content, and not on a domain we control.

export const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.REACT_APP_BACKEND_URL ||
  "";

export const API = `${BACKEND_URL}/api`;
