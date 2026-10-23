import type { Metadata } from "next";
import Credits from "@/views/Credits";
import { SITE_URL } from "@/lib/site";
import { inspirations } from "@/data/inspirations";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Credits & Inspiration",
  description:
    "The designs, explainers, and makers this site learned from, credited openly, with what each one taught us and where it shows up.",
  alternates: { canonical: "/credits" },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/credits`,
    title: "Credits & Inspiration · Venkata Pagadala",
    description: "The sources this site learned from, credited openly.",
  },
};

export default function Page() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": `${SITE_URL}/credits#list`,
    name: "Credits and inspiration",
    description:
      "Works and makers this site learned from, with what each taught us and where it is used.",
    numberOfItems: inspirations.length,
    itemListElement: inspirations.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "CreativeWork",
        name: item.title,
        creator: { "@type": "Organization", name: item.creator },
        url: item.url,
        description: item.whatWeLearned,
      },
    })),
  };
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Credits />
    </>
  );
}
