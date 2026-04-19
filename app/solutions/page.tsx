import type { Metadata } from "next";
import Solutions from "@/pages/Solutions";

export const metadata: Metadata = {
  title: "Solutions",
  description:
    "AI solution architecture, retrieval systems, agent systems, and enterprise AI engineering services by Venkata Pagadala.",
  alternates: { canonical: "/solutions" },
  openGraph: { url: "/solutions", title: "Solutions · Venkata Pagadala" },
};

export default function Page() {
  return <Solutions />;
}
