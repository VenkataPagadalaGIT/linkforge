import type { Metadata } from "next";
import ThreeDHub from "@/views/ThreeDHub";
import { SITE_URL, OG_IMAGE, SITE_NAME } from "@/lib/site";
import { threeDExperiences } from "@/data/threeD";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Everything in 3D",
  description:
    "Eight interactive 3D experiences built as code: a playable 2040 city, an explorable LLM, a browsable library of free AI books, a glass album of 100 AI contributors, and more.",
  alternates: { canonical: "/3d" },
  openGraph: {
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }],
    type: "website",
    url: `${SITE_URL}/3d`,
    title: "Everything in 3D · Venkata Pagadala",
    description:
      "Every three-dimensional experience on the site: generated geometry, no downloads.",
  },
};

export default function Page() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${SITE_URL}/3d#page`,
    name: "Everything in 3D",
    description:
      "Every interactive 3D experience on venkatapagadala.com, all generated geometry running in the browser.",
    url: `${SITE_URL}/3d`,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: threeDExperiences.length,
      itemListElement: threeDExperiences.map((x, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: x.title,
        url: `${SITE_URL}${x.to === "/" ? "" : x.to}`,
      })),
    },
  };
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ThreeDHub />
    </>
  );
}
