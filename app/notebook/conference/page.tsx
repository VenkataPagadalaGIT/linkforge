import { OG_IMAGE, SITE_NAME } from "@/lib/site";
import type { Metadata } from "next";
import ConferenceNotebook from "@/views/ConferenceNotebook";

export const metadata: Metadata = {
  title: "Conference Notebook",
  description:
    "Field notes, talks, and takeaways from AI, SEO, and engineering conferences — a live notebook by Venkata Pagadala.",
  alternates: { canonical: "/notebook/conference" },
  openGraph: {
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }],
    url: "/notebook/conference",
    title: "Conference Notebook · Venkata Pagadala",
    description: "Field notes from AI, SEO, and engineering conferences.",
  },
};

export default function Page() {
  return <ConferenceNotebook />;
}
