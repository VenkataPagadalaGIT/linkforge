import type { Metadata } from "next";
import Publications from "@/views/Publications";

export const metadata: Metadata = {
  title: "Publications",
  description:
    "Research publications, papers, and long-form writings by Venkata Pagadala on AI systems, retrieval, and context engineering.",
  alternates: { canonical: "/publications" },
  openGraph: { url: "/publications", title: "Publications · Venkata Pagadala" },
};

export default function Page() {
  return <Publications />;
}
