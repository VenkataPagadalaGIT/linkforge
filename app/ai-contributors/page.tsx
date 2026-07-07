import type { Metadata } from "next";
import AIContributors from "@/views/AIContributors";

export const metadata: Metadata = {
  title: "AI Contributors",
  description:
    "The AI Contributors encyclopedia — 100+ experts who shaped modern artificial intelligence, curated by Venkata Pagadala.",
  alternates: { canonical: "/ai-contributors" },
  openGraph: { url: "/ai-contributors", title: "AI Contributors Encyclopedia" },
};

export default function Page() {
  return <AIContributors />;
}
