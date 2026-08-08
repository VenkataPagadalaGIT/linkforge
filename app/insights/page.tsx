import { OG_IMAGE, SITE_NAME } from "@/lib/site";
import type { Metadata } from "next";
import Insights from "@/views/Insights";

export const metadata: Metadata = {
  title: "Insights",
  description:
    "AI insights, essays and pillar content optimised for search engines and AI retrieval — by Venkata Pagadala.",
  alternates: { canonical: "/insights" },
  openGraph: {
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }], url: "/insights", title: "Insights · Venkata Pagadala" },
};

export default function Page() {
  return <Insights />;
}
