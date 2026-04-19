import type { Metadata } from "next";
import AIUpdateDetail from "@/pages/AIUpdateDetail";

type Params = { slug: string };

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const title = params.slug
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
  return {
    title,
    description: `${title} — AI update curated and summarised by Venkata Pagadala.`,
    alternates: { canonical: `/ai-updates/${params.slug}` },
    openGraph: { url: `/ai-updates/${params.slug}`, title, type: "article" },
  };
}

export default function Page() {
  return <AIUpdateDetail />;
}
