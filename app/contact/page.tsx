import { OG_IMAGE, SITE_NAME } from "@/lib/site";
import type { Metadata } from "next";
import Contact from "@/views/Contact";
import { withSeoOverrides } from "@/lib/seo-overrides";

const metadata: Metadata = {
  title: "Contact",
  description:
    "Email Venkata Pagadala or connect with him on LinkedIn about engagements, collaborations, research, speaking invitations and podcast guest spots.",
  alternates: { canonical: "/contact" },
  openGraph: {
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }], url: "/contact", title: "Contact · Venkata Pagadala" },
};
export const generateMetadata = withSeoOverrides("/contact", metadata);

export default function Page() {
  return <Contact />;
}
