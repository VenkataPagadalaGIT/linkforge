import type { Metadata } from "next";
import ServiceLanding from "@/views/ServiceLanding";

type Params = { slug: string };

// Solutions are hardcoded in the frontend (src/components/ServicesGrid.tsx).
// Pre-render these 6 known slugs at build time.
export const revalidate = 3600;
export const dynamicParams = true;

const SOLUTION_SLUGS = [
  "ai-product",
  "aeo",
  "technical",
  "programmatic",
  "editorial",
  "performance",
] as const;

export async function generateStaticParams(): Promise<Params[]> {
  return SOLUTION_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const title = params.slug
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
  return {
    title,
    description: `${title} — AI solution details, delivery model and case studies by Venkata Pagadala.`,
    alternates: { canonical: `/solutions/${params.slug}` },
    openGraph: { url: `/solutions/${params.slug}`, title, type: "article" },
  };
}

export default function Page() {
  return <ServiceLanding />;
}
