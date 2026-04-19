export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://github-checker-8.preview.emergentagent.com";

export const SITE_NAME = "Venkata Pagadala";
export const SITE_TAGLINE = "AI Systems Architect · Mono Mind";
export const SITE_DESCRIPTION =
  "Mono Mind — AI systems, research, and real-world solutions by Venkata Pagadala. Insights, the AI Contributors encyclopedia, updates, and engineering notebooks optimised for humans, search engines and AI retrieval.";

export const OG_IMAGE =
  "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/8ef4310c-a642-44ea-b390-81e1664989fd/id-preview-0a5abc9b--ea32d82b-f342-495d-9482-7a7ad7f0e594.lovable.app-1772436089590.png";

export const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.REACT_APP_BACKEND_URL ||
  "";

export const API = `${BACKEND_URL}/api`;
