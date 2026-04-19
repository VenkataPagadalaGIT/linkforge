import type { Metadata } from "next";
import PillarPage from "@/pages/PillarPage";

type Params = { slug: string };

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const title = params.slug
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
  return {
    title,
    description: `Pillar content on ${title} — Venkata Pagadala's in-depth guide with linked cluster posts.`,
    alternates: { canonical: `/insights/${params.slug}` },
    openGraph: {
      url: `/insights/${params.slug}`,
      type: "article",
      title,
    },
  };
}

export default function Page() {
  return <PillarPage />;
}
