import { OG_IMAGE, SITE_NAME } from "@/lib/site";
import type { Metadata } from "next";
import Contact from "@/views/Contact";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with Venkata Pagadala: engagements, collaborations, and inquiries.",
  alternates: { canonical: "/contact" },
  openGraph: {
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }], url: "/contact", title: "Contact · Venkata Pagadala" },
};

export default function Page() {
  return <Contact />;
}
