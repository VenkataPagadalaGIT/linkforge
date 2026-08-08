import type { Metadata } from "next";
import About from "@/views/About";
import { SITE_URL, OG_IMAGE, SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description:
    "About Venkata Pagadala: AI systems architect, researcher, and the story behind Mono Mind.",
  alternates: { canonical: "/about" },
  openGraph: {
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }], url: "/about", title: "About · Venkata Pagadala" },
};

// ProfilePage schema anchors the site's Person entity for search and AI
// assistants; sameAs ties the entity to its off-site profiles.
const profileJsonLd = {
  "@context": "https://schema.org",
  "@type": "ProfilePage",
  mainEntity: {
    "@type": "Person",
    "@id": `${SITE_URL}/#person`,
    name: "Venkata Pagadala",
    url: SITE_URL,
    image: OG_IMAGE,
    jobTitle: "AI Product Manager (Search · SEO · GEO)",
    worksFor: { "@type": "Organization", name: "AT&T" },
    description: SITE_DESCRIPTION,
    sameAs: [
      "https://github.com/VenkataPagadalaGIT",
      "https://linkedin.com/in/venkatapagadala",
    ],
  },
};

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(profileJsonLd) }}
      />
      <About />
    </>
  );
}
