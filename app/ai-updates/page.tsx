import { OG_IMAGE, SITE_NAME, SITE_URL } from "@/lib/site";
import type { Metadata } from "next";
import NewsFront from "@/views/NewsFront";
import { getNews } from "@/lib/news-source";
import { getBusiness } from "@/lib/business-source";
import { EVENTS } from "@/data/events";
import { buildFront } from "@/lib/news-front";
import { jsonLdScript } from "@/lib/jsonld";
import { withSeoOverrides } from "@/lib/seo-overrides";

const TITLE = "Tech & Business: News and Updates";
const DESCRIPTION =
  "AI, technology and business news on one front page: deals, launches, earnings calls, filings and live event files, every story with its primary sources.";

const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/ai-updates" },
  openGraph: {
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }], url: "/ai-updates", title: `${TITLE} · Venkata Pagadala`, description: DESCRIPTION },
};
export const generateMetadata = withSeoOverrides("/ai-updates", metadata);

// A newspaper front page of every news-like item (src/lib/news-front.ts). AI Updates and Business Notebook notes are
// published without a deploy (docs/NO_DEPLOY_PUBLISHING.md), refreshed by the signed revalidate message; the event
// files come with the build.
export default async function Page() {
  const [updates, business] = await Promise.all([getNews(), getBusiness()]);
  const front = buildFront({ updates, business, events: Object.values(EVENTS), today: new Date().toISOString().slice(0, 10) });
  const ld = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: TITLE,
    description: DESCRIPTION,
    url: `${SITE_URL}/ai-updates`,
    mainEntity: {
      "@type": "ItemList",
      itemListOrder: "https://schema.org/ItemListOrderDescending",
      numberOfItems: front.latest.length,
      itemListElement: front.latest.map((s, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE_URL}${s.href}`, name: s.title })),
    },
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(ld) }} />
      <NewsFront front={front} />
    </>
  );
}
