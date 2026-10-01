import { OG_IMAGE, SITE_NAME } from "@/lib/site";
import type { Metadata } from "next";
import Research from "@/views/Research";
import { withSeoOverrides } from "@/lib/seo-overrides";

const metadata: Metadata = {
  title: "Research",
  description: "Active AI research threads, experiments, and open questions by Venkata Pagadala.",
  alternates: { canonical: "/research" },
  openGraph: {
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }], url: "/research", title: "Research · Venkata Pagadala" },
};
export const generateMetadata = withSeoOverrides("/research", metadata);

export default function Page() {
  return <Research />;
}
