import type { Metadata } from "next";
import AIContributors from "@/views/AIContributors";

export const metadata: Metadata = {
  title: "AI Learning Roadmap",
  description: "18-week AI learning roadmap curated by Venkata Pagadala — experts, concepts and study tracks.",
  alternates: { canonical: "/notebook/ai/roadmap" },
  openGraph: { url: "/notebook/ai/roadmap", title: "AI Learning Roadmap" },
};

export default function Page() {
  return <AIContributors />;
}
