import type { Metadata } from "next";
import Research from "@/views/Research";

export const metadata: Metadata = {
  title: "Research",
  description: "Active AI research threads, experiments, and open questions by Venkata Pagadala.",
  alternates: { canonical: "/research" },
  openGraph: { url: "/research", title: "Research · Venkata Pagadala" },
};

export default function Page() {
  return <Research />;
}
