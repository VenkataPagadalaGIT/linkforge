import type { Metadata } from "next";
import BrandClient from "./BrandClient";

// Internal tool, same treatment as /library: noindex, absent from the
// sitemap, unlinked from the nav. It was previously a bare client page with
// no metadata, which left an internal colour reference indexable.
export const metadata: Metadata = {
  title: "Brand Tokens",
  description: "Internal reference for the site's colour tokens across light and dark themes.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <BrandClient />;
}
