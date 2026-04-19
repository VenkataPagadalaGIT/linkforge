import type { Metadata } from "next";
import ServiceLanding from "@/pages/ServiceLanding";

type Params = { slug: string };

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
