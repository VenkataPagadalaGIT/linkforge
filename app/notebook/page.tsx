import { OG_IMAGE, SITE_NAME } from "@/lib/site";
import type { Metadata } from "next";
import Notebook from "@/views/Notebook";

export const metadata: Metadata = {
  title: "Notebook",
  description:
    "Working notebooks and engineering notes on AI systems, retrieval, agents, and business — by Venkata Pagadala.",
  alternates: { canonical: "/notebook" },
  openGraph: {
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }], url: "/notebook", title: "Notebook · Venkata Pagadala" },
};

export default function Page() {
  return <Notebook />;
}
