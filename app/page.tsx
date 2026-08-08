import { OG_IMAGE, SITE_NAME } from "@/lib/site";
import type { Metadata } from "next";
import Home from "@/views/Home";

export const metadata: Metadata = {
  title: "Venkata Pagadala · AI Systems Architect · Mono Mind",
  description:
    "Mono Mind, the personal research hub of Venkata Pagadala. AI systems architecture, engineering notebooks, the AI Contributors encyclopedia, and practical solutions, optimized for humans, search engines, and AI retrieval.",
  alternates: { canonical: "/" },
  openGraph: {
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }],
    url: "/",
    title: "Venkata Pagadala · AI Systems Architect · Mono Mind",
    description:
      "AI systems research, engineering notebooks and the AI Contributors encyclopedia by Venkata Pagadala.",
  },
};

export default function Page() {
  return <Home />;
}
