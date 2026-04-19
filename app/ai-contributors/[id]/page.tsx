import type { Metadata } from "next";
import AIContributorProfilePage from "@/pages/AIContributorProfilePage";

type Params = { id: string };

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const name = params.id
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
  return {
    title: `${name} — AI Contributor`,
    description: `Profile of ${name} in the AI Contributors encyclopedia — bio, contributions, and key papers.`,
    alternates: { canonical: `/ai-contributors/${params.id}` },
    openGraph: { url: `/ai-contributors/${params.id}`, title: `${name} — AI Contributor`, type: "profile" },
  };
}

export default function Page() {
  return <AIContributorProfilePage />;
}
