import { OG_IMAGE, SITE_NAME } from "@/lib/site";
import type { Metadata } from "next";
import Experience from "@/views/Experience";

// SSG of this page imports three.js + R3F bundles during prerender,
// which spikes build-time memory above the 1Gi K8s pod ceiling.
// Render it dynamically at request time instead — three.js is client-only
// anyway, so SSG buys us nothing here.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Experience",
  description: "Work experience, roles, and engagements: Venkata Pagadala, AI Systems Architect.",
  alternates: { canonical: "/experience" },
  openGraph: {
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }], url: "/experience", title: "Experience · Venkata Pagadala" },
};

export default function Page() {
  return <Experience />;
}
