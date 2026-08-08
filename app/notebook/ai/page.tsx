import { OG_IMAGE, SITE_NAME } from "@/lib/site";
import type { Metadata } from "next";
import AIContributors from "@/views/AIContributors";

export const metadata: Metadata = {
  title: "AI Notebook",
  description: "The AI notebook: encyclopedia of AI contributors, roadmaps, and concept maps.",
  alternates: { canonical: "/notebook/ai" },
  openGraph: {
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }], url: "/notebook/ai", title: "AI Notebook · Venkata Pagadala" },
};

export default function Page() {
  return <AIContributors />;
}
