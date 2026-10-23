import type { Metadata } from "next";
import ComponentLibrary from "@/views/ComponentLibrary";
import { withSeoOverrides } from "@/lib/seo-overrides";

// Internal tool: noindex, not in the sitemap, not linked from the nav.
const metadata: Metadata = {
  title: "Component Library",
  description: "Internal catalog of the site's reusable components, tokens, and utilities.",
  robots: { index: false, follow: false },
};
export const generateMetadata = withSeoOverrides("/library", metadata);

export default function Page() {
  return <ComponentLibrary />;
}
