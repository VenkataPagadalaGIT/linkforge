import { OG_IMAGE, SITE_NAME } from "@/lib/site";
import type { Metadata } from "next";
import ServiceLanding from "@/views/ServiceLanding";
import { withSeoOverrides } from "@/lib/seo-overrides";

type Params = { slug: string };

// Solutions are hardcoded in the frontend (src/components/ServicesGrid.tsx).
// Pre-render these 6 known slugs at build time.
export const revalidate = 3600;
// Only the six real solutions exist. Any other slug is a 404, not a 200 that
// invents a title-cased page and canonicalises it to itself.
export const dynamicParams = false;

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

export const generateMetadata = withSeoOverrides("/solutions/[slug]", baseMetadata);

async function baseMetadata({ params }: { params: Params }): Promise<Metadata> {
  const title = params.slug
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
  return {
    title,
    description: `${title}: AI solution details, delivery model, and case studies by Venkata Pagadala.`,
    alternates: { canonical: `/solutions/${params.slug}` },
    openGraph: {
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }], url: `/solutions/${params.slug}`, title, type: "article" },
  };
}

export default function Page() {
  return <ServiceLanding />;
}
