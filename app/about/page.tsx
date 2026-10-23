import type { Metadata } from "next";
import About from "@/views/About";
import { SITE_URL, OG_IMAGE, SITE_NAME } from "@/lib/site";
import { jsonLdScript } from "@/lib/jsonld";
import { withSeoOverrides } from "@/lib/seo-overrides";
import { personJsonLd } from "@/data/profile";

// Title plus the template's " · Venkata Pagadala" stays within the owner's 60
// characters; the description sits inside 140 to 160 (cms/rules.json).
const TITLE = "About: AI Product Leader and Researcher";
const DESCRIPTION =
  "Venkata Pagadala leads automation, AI and SEO product work at AT&T and researches search intelligence. His story, papers, talks and what peers say.";

const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/about" },
  openGraph: {
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }],
    type: "profile",
    url: "/about",
    title: `About ${SITE_NAME}`,
    description: DESCRIPTION,
  },
  twitter: { card: "summary_large_image", title: `About ${SITE_NAME}`, description: DESCRIPTION },
};
export const generateMetadata = withSeoOverrides("/about", metadata);

// An AboutPage whose main entity is the site's one Person node, embedded in
// full (the same object the layout emits under the same @id) so this page
// stands on its own for a parser that reads nothing else.
const aboutJsonLd = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  "@id": `${SITE_URL}/about#page`,
  url: `${SITE_URL}/about`,
  name: `About ${SITE_NAME}`,
  description: DESCRIPTION,
  inLanguage: "en",
  isPartOf: { "@type": "WebSite", url: SITE_URL, name: SITE_NAME },
  mainEntity: personJsonLd(),
};

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(aboutJsonLd) }} />
      <About />
    </>
  );
}
