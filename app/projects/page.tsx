import { OG_IMAGE, SITE_NAME } from "@/lib/site";
import type { Metadata } from "next";
import Projects from "@/views/Projects";

export const metadata: Metadata = {
  title: "Projects",
  description: "Selected AI systems and engineering work: interactive 3D explainers, a 455-entity map of the AI economy, knowledge graphs, and search tooling.",
  alternates: { canonical: "/projects" },
  openGraph: {
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }], url: "/projects", title: "Projects · Venkata Pagadala" },
};

export default function Page() {
  return <Projects />;
}
