import { OG_IMAGE, SITE_NAME } from "@/lib/site";
import type { Metadata } from "next";
import AIContributors from "@/views/AIContributors";

export const metadata: Metadata = {
  title: "AI Encyclopedia",
  description: "175 AI concepts across 10 categories, each with key terms, prerequisites, difficulty and curated free sources. From gradient descent to agent harnesses.",
  alternates: { canonical: "/notebook/ai/encyclopedia" },
  openGraph: {
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }], url: "/notebook/ai/encyclopedia", title: "AI Encyclopedia" },
};

export default function Page() {
  return <AIContributors />;
}
