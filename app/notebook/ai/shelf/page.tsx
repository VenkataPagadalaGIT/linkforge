import type { Metadata } from "next";
import AIShelf from "@/views/AIShelf";
import { SITE_URL, OG_IMAGE, SITE_NAME } from "@/lib/site";
import { shelfBooks } from "@/data/libraryShelf";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "The Complete Shelf: 19 Free AI Books",
  description:
    "Browse a 3D shelf of nineteen genuinely free AI and machine learning books, from your first line of Python through to AI safety. Pull one out and read it free.",
  alternates: { canonical: "/notebook/ai/shelf" },
  openGraph: {
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }],
    type: "website",
    url: `${SITE_URL}/notebook/ai/shelf`,
    title: "The Complete Shelf: 19 Free AI Books in 3D",
    description:
      "A walnut shelf of nineteen free AI books you can browse and pull out, each linking to the publisher's free copy.",
  },
};

export default function Page() {
  // Two graphs on purpose. The ItemList is the content: nineteen real books
  // with authors, so a search engine or an assistant can answer "free AI
  // books" from this page instead of guessing. The WebApplication describes
  // the 3D shelf itself. Books authored by a profiled contributor carry a
  // sameAs pointing at that profile, which is the same entity link the page
  // renders visibly, in a form a crawler can follow.
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "@id": `${SITE_URL}/notebook/ai/shelf#list`,
      name: "19 free AI and machine learning books",
      description:
        "A curriculum-ordered shelf of AI books that are free to read at the publisher, from introductory programming to AI safety.",
      numberOfItems: shelfBooks.length,
      itemListOrder: "https://schema.org/ItemListOrderAscending",
      itemListElement: shelfBooks.map((b, i) => ({
        "@type": "ListItem",
        position: i + 1,
        item: {
          "@type": "Book",
          "@id": `${SITE_URL}/notebook/ai/shelf#${b.id}`,
          name: b.title,
          url: b.url,
          author: b.contributorId
            ? {
                "@type": "Person",
                name: b.author,
                sameAs: `${SITE_URL}/ai-contributors/${b.contributorId}`,
              }
            : { "@type": "Person", name: b.author },
          about: b.topic,
          description: b.note,
          isAccessibleForFree: true,
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        },
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "@id": `${SITE_URL}/notebook/ai/shelf#app`,
      name: "The Complete Shelf",
      url: `${SITE_URL}/notebook/ai/shelf`,
      applicationCategory: "EducationalApplication",
      operatingSystem: "Any browser with WebGL",
      browserRequirements: "Requires WebGL. No plugin or download.",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      author: { "@id": `${SITE_URL}/#person` },
      description:
        "A 3D walnut shelf of nineteen clothbound volumes, each a genuinely free AI book. Browse along the run, pull a book forward, and open the publisher's free copy. Every volume is generated geometry rather than a downloaded model.",
      featureList: [
        "Browse the shelf by drag, scroll wheel, arrow keys, buttons or position markers",
        "Pull any volume forward and inspect it with orbit, pan and zoom",
        "Each book links to its free copy at the publisher",
        "Authors who are profiled on the site link to their contributor page",
        "Entirely procedural geometry, no downloaded assets",
      ],
      mainEntity: { "@id": `${SITE_URL}/notebook/ai/shelf#list` },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Notebook", item: `${SITE_URL}/notebook` },
        { "@type": "ListItem", position: 3, name: "AI Notebook", item: `${SITE_URL}/notebook/ai` },
        {
          "@type": "ListItem",
          position: 4,
          name: "The Complete Shelf",
          item: `${SITE_URL}/notebook/ai/shelf`,
        },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "Are these AI books really free?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. Every book on the shelf is published free by its own author or publisher: an author-hosted site, a university page, an open-access edition, a publisher-released PDF, or the public domain. None of them are free trials, sample chapters, or pirated copies, and the links go to the publisher rather than to a file mirror.",
          },
        },
        {
          "@type": "Question",
          name: "What order should I read them in?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "The shelf is ordered as a curriculum, left to right. It starts with programming in Think Python, moves through the mathematics and statistics you actually need, then classical machine learning, deep learning, natural language processing, deploying models, reinforcement learning, and finishes with AI safety. Reading along the shelf is a complete path from beginner to advanced.",
          },
        },
        {
          "@type": "Question",
          name: "Do I need to install anything to use the 3D shelf?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "No. It runs in any browser with WebGL, and every book is geometry generated in code rather than a downloaded 3D model, so there are no assets to fetch. If a browser cannot run WebGL, the page lists all nineteen books as ordinary links instead.",
          },
        },
      ],
    },
  ];
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <AIShelf />
    </>
  );
}
