import type { Metadata } from "next";
import BrandClient from "./BrandClient";
import { withSeoOverrides } from "@/lib/seo-overrides";

// Internal tool, same treatment as /library: noindex, absent from the
// sitemap, unlinked from the nav. It was previously a bare client page with
// no metadata, which left an internal colour reference indexable.
const metadata: Metadata = {
  title: "Brand Tokens",
  description: "Internal reference for the site's colour tokens across light and dark themes.",
  robots: { index: false, follow: false },
};
export const generateMetadata = withSeoOverrides("/brand", metadata);

export default function Page() {
  return <BrandClient />;
}
