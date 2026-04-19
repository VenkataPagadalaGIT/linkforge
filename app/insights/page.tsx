import type { Metadata } from "next";
import Insights from "@/pages/Insights";

export const metadata: Metadata = {
  title: "Insights",
  description:
    "AI insights, essays and pillar content optimised for search engines and AI retrieval — by Venkata Pagadala.",
  alternates: { canonical: "/insights" },
  openGraph: { url: "/insights", title: "Insights · Venkata Pagadala" },
};

export default function Page() {
  return <Insights />;
}
