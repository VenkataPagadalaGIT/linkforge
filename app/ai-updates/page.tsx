import type { Metadata } from "next";
import AIUpdatesIndex from "@/pages/AIUpdates";

export const metadata: Metadata = {
  title: "AI Updates",
  description:
    "Curated AI updates — the latest in models, papers, and systems, summarised by Venkata Pagadala.",
  alternates: { canonical: "/ai-updates" },
  openGraph: { url: "/ai-updates", title: "AI Updates · Venkata Pagadala" },
};

export default function Page() {
  return <AIUpdatesIndex />;
}
