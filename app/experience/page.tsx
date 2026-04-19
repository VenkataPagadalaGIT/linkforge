import type { Metadata } from "next";
import Experience from "@/views/Experience";

export const metadata: Metadata = {
  title: "Experience",
  description: "Work experience, roles and engagements — Venkata Pagadala, AI Systems Architect.",
  alternates: { canonical: "/experience" },
  openGraph: { url: "/experience", title: "Experience · Venkata Pagadala" },
};

export default function Page() {
  return <Experience />;
}
