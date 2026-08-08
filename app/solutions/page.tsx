import { OG_IMAGE, SITE_NAME } from "@/lib/site";
import type { Metadata } from "next";
import Solutions from "@/views/Solutions";

export const metadata: Metadata = {
  title: "Solutions",
  description:
    "AI solution architecture, retrieval systems, agent systems, and enterprise AI engineering services by Venkata Pagadala.",
  alternates: { canonical: "/solutions" },
  openGraph: {
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }], url: "/solutions", title: "Solutions · Venkata Pagadala" },
};

export default function Page() {
  return <Solutions />;
}
