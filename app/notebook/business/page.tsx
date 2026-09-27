import { OG_IMAGE, SITE_NAME } from "@/lib/site";
import type { Metadata } from "next";
import BusinessNotebook from "@/views/BusinessNotebook";
import { withSeoOverrides } from "@/lib/seo-overrides";

const metadata: Metadata = {
  title: "Business Notebook",
  description: "Business-side AI notes, market notes, and strategy frameworks by Venkata Pagadala.",
  alternates: { canonical: "/notebook/business" },
  openGraph: {
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }], url: "/notebook/business", title: "Business Notebook" },
};
export const generateMetadata = withSeoOverrides("/notebook/business", metadata);

export default function Page() {
  return <BusinessNotebook />;
}
