import { OG_IMAGE, SITE_NAME } from "@/lib/site";
import type { Metadata } from "next";
import Solutions from "@/views/Solutions";
import { withSeoOverrides } from "@/lib/seo-overrides";

const metadata: Metadata = {
  title: "Solutions",
  description:
    "AI solution architecture, retrieval systems, agent systems, and enterprise AI engineering services by Venkata Pagadala.",
  alternates: { canonical: "/solutions" },
  openGraph: {
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }], url: "/solutions", title: "Solutions · Venkata Pagadala" },
};
export const generateMetadata = withSeoOverrides("/solutions", metadata);

export default function Page() {
  return <Solutions />;
}
