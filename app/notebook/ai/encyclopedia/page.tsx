import type { Metadata } from "next";
import AIContributors from "@/pages/AIContributors";

export const metadata: Metadata = {
  title: "AI Encyclopedia",
  description: "Comprehensive AI concepts encyclopedia — curated by Venkata Pagadala.",
  alternates: { canonical: "/notebook/ai/encyclopedia" },
  openGraph: { url: "/notebook/ai/encyclopedia", title: "AI Encyclopedia" },
};

export default function Page() {
  return <AIContributors />;
}
