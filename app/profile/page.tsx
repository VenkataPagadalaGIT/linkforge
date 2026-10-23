import type { Metadata } from "next";
import Profile from "@/views/Profile";
import { SITE_URL, OG_IMAGE, SITE_NAME } from "@/lib/site";
import { jsonLdScript } from "@/lib/jsonld";
import { withSeoOverrides } from "@/lib/seo-overrides";
import { personJsonLd } from "@/data/profile";

// Title plus the template's " · Venkata Pagadala" stays within the owner's 60
// characters; the description sits inside 140 to 160 (cms/rules.json).
const TITLE = "Profile: Talks, Research, Bios and Links";
const DESCRIPTION =
  "Venkata Pagadala at a glance: AI product leader at AT&T, published researcher, conference speaker and podcast guest. Bios, headshot, profiles and peer quotes.";

const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/profile" },
  openGraph: {
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }],
    type: "profile",
    url: "/profile",
    title: `${SITE_NAME}: profile`,
    description: DESCRIPTION,
  },
  twitter: { card: "summary_large_image", title: `${SITE_NAME}: profile`, description: DESCRIPTION },
};
export const generateMetadata = withSeoOverrides("/profile", metadata);

// ProfilePage is the type Google reads for a page about one person; its main
// entity is the site's one Person node, embedded whole under the shared @id.
const profileJsonLd = {
  "@context": "https://schema.org",
  "@type": "ProfilePage",
  "@id": `${SITE_URL}/profile#page`,
  url: `${SITE_URL}/profile`,
  name: `${SITE_NAME}: profile`,
  description: DESCRIPTION,
  inLanguage: "en",
  dateCreated: "2026-10-22",
  dateModified: "2026-10-22",
  isPartOf: { "@type": "WebSite", url: SITE_URL, name: SITE_NAME },
  mainEntity: personJsonLd(),
};

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(profileJsonLd) }} />
      <Profile />
    </>
  );
}
