import type { Metadata } from "next";
import AIContributors from "@/views/AIContributors";

export const metadata: Metadata = {
  title: "AI Notebook",
  description: "The AI notebook — encyclopedia of AI contributors, roadmaps and concept maps.",
  alternates: { canonical: "/notebook/ai" },
  openGraph: { url: "/notebook/ai", title: "AI Notebook · Venkata Pagadala" },
};

export default function Page() {
  return <AIContributors />;
}
