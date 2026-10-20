import type { Metadata } from "next";
import { notFound } from "next/navigation";
import LinkedInTopicView from "@/views/LinkedInTopicView";
import { SITE_URL, OG_IMAGE, SITE_NAME } from "@/lib/site";
import { jsonLdScript } from "@/lib/jsonld";
import { withSeoOverrides } from "@/lib/seo-overrides";
import { breadcrumbJsonLd } from "@/lib/content-fetch";
import { LINKEDIN_PROFILE, PUBLIC_ITEMS, UNIVERSE_NAME, UNIVERSE_PATH, fullUrl, inTopic, isoDuration, linkedinUrl, postPath, posterUrl, thumbUrl, topicPath, topicTrail, type LiItem } from "@/data/linkedinArchive";
import { ALL_LINKEDIN_TOPICS, getLinkedInTopic } from "@/data/linkedinArchiveServer";

type Params = { topic: string };

// One static page per node of the topic tree (slugs are frozen); an unknown slug hard-404s.
// A node with no entries today still renders, noindex, so a live URL never breaks.
export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return ALL_LINKEDIN_TOPICS.map((t) => ({ topic: t.slug }));
}

export const generateMetadata = withSeoOverrides("/venkata-pagadala-universe/topics/[topic]", baseMetadata);

const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? "" : "s"}`;

async function baseMetadata({ params }: { params: Params }): Promise<Metadata> {
  const topic = getLinkedInTopic(params.topic);
  if (!topic) return { title: "Topic not found" };
  const trail = topicTrail(topic.id);
  const parts = [
    topic.posts.length ? plural(topic.posts.length, "post") : "",
    topic.articles.length ? plural(topic.articles.length, "article") : "",
    topic.itemCount ? `${topic.itemCount} images, videos and documents` : "",
  ].filter(Boolean);
  const where = trail.length > 1 ? ` (${trail.slice(0, -1).map((n) => n.label).join(" › ")})` : "";
  const description = `${parts.join(", ") || "Nothing yet"} on ${topic.label}${where} from Venkata Pagadala's LinkedIn. ${topic.description}`.slice(0, 300);
  return {
    title: { absolute: `${topic.label} | ${UNIVERSE_NAME}` },
    description,
    alternates: { canonical: topicPath(topic.id) },
    ...(topic.entries.length === 0 ? { robots: { index: false, follow: true } } : {}),
    openGraph: {
      type: "website",
      url: topicPath(topic.id),
      title: `${topic.label} | ${UNIVERSE_NAME}`,
      description,
      images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }],
    },
  };
}

const author = { "@type": "Person", name: "Venkata Pagadala", url: SITE_URL, sameAs: [LINKEDIN_PROFILE] };

function itemLd(it: LiItem) {
  if (it.kind === "document") {
    return {
      "@type": "DigitalDocument",
      name: it.description,
      url: fullUrl(it),
      encodingFormat: it.docExt === "pptx" ? "application/vnd.openxmlformats-officedocument.presentationml.presentation" : "application/pdf",
      thumbnailUrl: thumbUrl(it),
      datePublished: it.date,
      author,
    };
  }
  if (it.kind === "video") {
    return {
      "@type": "VideoObject",
      name: it.description,
      description: it.description,
      thumbnailUrl: posterUrl(it.idx),
      contentUrl: fullUrl(it),
      uploadDate: it.date,
      duration: isoDuration(it.duration),
      author,
    };
  }
  return {
    "@type": "ImageObject",
    name: it.description,
    caption: it.description,
    contentUrl: fullUrl(it),
    thumbnailUrl: thumbUrl(it),
    uploadDate: it.date,
    creator: author,
  };
}

export default function Page({ params }: { params: Params }) {
  const topic = getLinkedInTopic(params.topic);
  if (!topic) notFound();

  const url = `${SITE_URL}${topicPath(topic.id)}`;
  const trail = topicTrail(topic.id);
  const items = PUBLIC_ITEMS.filter((i) => inTopic(i, topic.id)).slice(0, 30);
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: `${topic.label}: ${UNIVERSE_NAME}`,
      description: topic.description,
      url,
      isPartOf: { "@type": "CollectionPage", name: UNIVERSE_NAME, url: `${SITE_URL}${UNIVERSE_PATH}` },
      hasPart: [
        ...topic.articles.map((p) => ({ "@type": "Article", headline: p.title, url: `${SITE_URL}${postPath(p)}`, datePublished: p.date, author })),
        ...topic.posts.slice(0, 60).map((p) => ({
          "@type": "SocialMediaPosting",
          headline: p.title,
          url: `${SITE_URL}${postPath(p)}`,
          datePublished: p.date,
          author,
          ...(linkedinUrl(p) ? { sameAs: linkedinUrl(p) } : {}),
        })),
        ...items.map(itemLd),
      ],
    },
    breadcrumbJsonLd([
      { name: UNIVERSE_NAME, url: `${SITE_URL}${UNIVERSE_PATH}` },
      ...trail.map((n) => ({ name: n.label, url: `${SITE_URL}${topicPath(n.id)}` })),
    ]),
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLd) }} />
      <LinkedInTopicView topic={topic} />
    </>
  );
}
