import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EVENTS, type EventFile, type EventSourceCard } from "@/data/events";
import { OG_IMAGE, SITE_NAME, SITE_URL } from "@/lib/site";
import { jsonLdScript } from "@/lib/jsonld";
import { withSeoOverrides } from "@/lib/seo-overrides";
import EventFileView from "@/views/EventFileView";

interface Props {
  params: { slug: string };
}

// One page per breaking event (data/corpus/gen_events_ts.py), built at build time; an unknown slug is a real 404.
// Everything a reader can open is also in the server HTML, in JSON-LD, and in the .md/.json/.csv/.rss.xml copies
// beside the page, so search engines and AI agents read the same file people do.
export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(EVENTS).map((slug) => ({ slug }));
}

export const generateMetadata = withSeoOverrides("/notebook/events/[slug]", baseMetadata);

const pagePath = (slug: string) => `/notebook/events/${slug}`;

async function baseMetadata({ params }: Props): Promise<Metadata> {
  const e = EVENTS[params.slug];
  if (!e) notFound();
  const url = pagePath(e.slug);
  const title = `${e.title}: what happened, sourced`;
  const description = (e.summary ?? "").slice(0, 300);
  return {
    title,
    description,
    alternates: {
      canonical: url,
      types: {
        "text/markdown": `${url}.md`,
        "application/json": `${url}.json`,
        "text/csv": `${url}-sources.csv`,
        "application/rss+xml": `${url}.rss.xml`,
      },
    },
    openGraph: { images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }], url, type: "article", title, description, siteName: "Venkata Pagadala · Mono Mind", modifiedTime: e.updatedAt + "Z" },
    twitter: { card: "summary_large_image", title, description },
  };
}

const AUTHOR = { "@type": "Person", name: "Venkata Pagadala", url: SITE_URL };
const RATING: Record<string, number> = { false: 1, misleading: 2, unconfirmed: 3, true: 5 };
const RATING_LABEL: Record<string, string> = { false: "False", misleading: "Misleading", unconfirmed: "Unconfirmed", true: "True" };

function sourceLd(s: EventSourceCard) {
  const base = {
    url: s.url,
    name: s.title.slice(0, 200),
    ...(s.date ? { datePublished: s.date.length === 19 ? s.date + "Z" : s.date } : {}),
    ...(s.publisher ? { publisher: { "@type": "Organization", name: s.publisher } } : {}),
    ...(s.thumb ? { thumbnailUrl: `${SITE_URL}${s.thumb}`, image: `${SITE_URL}${s.thumb}` } : {}),
  };
  if (s.platform === "youtube" || s.platform === "tiktok")
    return { "@type": "VideoObject", ...base, ...(s.embed?.type === "youtube" ? { embedUrl: `https://www.youtube.com/embed/${s.embed.id}` } : {}), ...(s.views ? { interactionStatistic: { "@type": "InteractionCounter", interactionType: "https://schema.org/WatchAction", userInteractionCount: s.views } } : {}) };
  if (s.platform === "reddit" || s.platform === "hackernews") return { "@type": "DiscussionForumPosting", ...base, headline: base.name };
  if (s.platform === "x" || s.platform === "instagram") return { "@type": "SocialMediaPosting", ...base, headline: base.name };
  if (s.group === "investigators" || s.group === "official") return { "@type": "Report", ...base, headline: base.name };
  return { "@type": "NewsArticle", ...base, headline: base.name };
}

function graph(e: EventFile) {
  const url = `${SITE_URL}${pagePath(e.slug)}`;
  const updated = e.updatedAt + "Z";
  const start = e.moments[0]?.at;
  const linked = e.sources.filter((s) => s.url);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "LiveBlogPosting",
        "@id": `${url}#article`,
        url,
        headline: e.title,
        description: e.summary,
        datePublished: start,
        dateModified: updated,
        coverageStartTime: start,
        coverageEndTime: `${e.window[1]}T23:59:59Z`,
        author: AUTHOR,
        publisher: AUTHOR,
        image: OG_IMAGE,
        inLanguage: "en",
        isAccessibleForFree: true,
        mainEntityOfPage: url,
        about: { "@type": "Thing", name: e.title },
        citation: e.facts.flatMap((f) => f.evidence.map((v) => v.url)).filter((u, i, a) => u && a.indexOf(u) === i),
        liveBlogUpdate: e.moments.map((m) => ({
          "@type": "BlogPosting",
          headline: m.label,
          datePublished: m.at,
          articleBody: m.quote,
          url: `${url}#what-happened`,
          ...(m.url ? { citation: m.url } : {}),
        })),
      },
      ...e.claims.map((c) => ({
        "@type": "ClaimReview",
        url: `${url}#claims`,
        claimReviewed: c.claim,
        datePublished: updated,
        author: AUTHOR,
        reviewBody: c.explain,
        reviewRating: { "@type": "Rating", ratingValue: RATING[c.verdict], bestRating: 5, worstRating: 1, alternateName: RATING_LABEL[c.verdict] },
        itemReviewed: {
          "@type": "Claim",
          ...(c.examples.filter((x) => x.url).length ? { appearance: c.examples.filter((x) => x.url).map((x) => ({ "@type": "CreativeWork", url: x.url })) } : {}),
        },
      })),
      {
        "@type": "ItemList",
        "@id": `${url}#sources`,
        name: `Sources for ${e.title}`,
        numberOfItems: linked.length,
        itemListElement: linked.slice(0, 60).map((s, i) => ({ "@type": "ListItem", position: i + 1, item: sourceLd(s) })),
      },
      {
        "@type": "Dataset",
        "@id": `${url}#data`,
        name: `${e.title}: sources, quotes, claims and timeline`,
        description: `Every source read about ${e.title} (${e.sources.length} items across news, X, YouTube, TikTok, Instagram, Reddit and Hacker News), the facts with the exact words of their sources, ${e.claims.length} claims with verdicts, and a UTC timeline.`,
        url,
        creator: AUTHOR,
        isAccessibleForFree: true,
        dateModified: updated,
        temporalCoverage: `${e.window[0]}/${e.window[1]}`,
        distribution: [
          { "@type": "DataDownload", encodingFormat: "application/json", contentUrl: `${url}.json` },
          { "@type": "DataDownload", encodingFormat: "text/csv", contentUrl: `${url}-sources.csv` },
          { "@type": "DataDownload", encodingFormat: "text/markdown", contentUrl: `${url}.md` },
        ],
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: "Notebook", item: `${SITE_URL}/notebook` },
          { "@type": "ListItem", position: 3, name: e.title, item: url },
        ],
      },
    ],
  };
}

export default function Page({ params }: Props) {
  const e = EVENTS[params.slug];
  if (!e) notFound();
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(graph(e)) }} />
      <EventFileView slug={e.slug} />
    </>
  );
}
