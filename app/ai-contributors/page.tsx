import { OG_IMAGE, SITE_NAME } from "@/lib/site";
import type { Metadata } from "next";
import AIContributors from "@/views/AIContributors";

export const metadata: Metadata = {
  title: "AI Contributors",
  description:
    "The AI Contributors encyclopedia — 100+ experts who shaped modern artificial intelligence, curated by Venkata Pagadala.",
  // This route and /notebook/ai render byte-identical content. Both were
  // self-canonicalizing, so neither consolidated; point this one at the
  // notebook hub, which is the parent of the roadmap and encyclopedia tabs.
  alternates: { canonical: "/notebook/ai" },
  openGraph: {
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }], url: "/ai-contributors", title: "AI Contributors Encyclopedia" },
};

export default function Page() {
  return <AIContributors />;
}
