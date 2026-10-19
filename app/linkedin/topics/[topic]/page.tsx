import type { Metadata } from "next";
import { notFound } from "next/navigation";
import LinkedInTopicView from "@/views/LinkedInTopicView";
import { SITE_URL, OG_IMAGE, SITE_NAME } from "@/lib/site";
import { jsonLdScript } from "@/lib/jsonld";
import { withSeoOverrides } from "@/lib/seo-overrides";
import { breadcrumbJsonLd } from "@/lib/content-fetch";
import { ALL_LINKEDIN_TOPICS, LINKEDIN_PROFILE, fullUrl, getLinkedInTopic, isoDuration, posterUrl, thumbUrl, type LiItem } from "@/data/linkedinArchive";

type Params = { topic: string };

// One static page per topic id (slugs are frozen); an unknown slug hard-404s.
// A topic with no items today still renders, noindex, so a live URL never breaks.
export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return ALL_LINKEDIN_TOPICS.map((t) => ({ topic: t.slug }));
}

export const generateMetadata = withSeoOverrides("/linkedin/topics/[topic]", baseMetadata);

async function baseMetadata({ params }: { params: Params }): Promise<Metadata> {
  const topic = getLinkedInTopic(params.topic);
  if (!topic) return { title: "Topic not found" };
  const n = topic.items.length;
  const description = `${n} item${n === 1 ? "" : "s"} on ${topic.label} from Venkata Pagadala's LinkedIn. ${topic.blurb}`.slice(0, 300);
  return {
    title: { absolute: `${topic.label}: LinkedIn Archive | Venkata Pagadala` },
    description,
    alternates: { canonical: `/linkedin/topics/${topic.slug}` },
    ...(n === 0 ? { robots: { index: false, follow: true } } : {}),
    openGraph: {
      type: "website",
      url: `/linkedin/topics/${topic.slug}`,
      title: `${topic.label}: LinkedIn Archive`,
      description,
      images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }],
    },
  };
}

function itemLd(it: LiItem) {
  const author = { "@type": "Person", name: "Venkata Pagadala", url: SITE_URL, sameAs: [LINKEDIN_PROFILE] };
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

  const url = `${SITE_URL}/linkedin/topics/${topic.slug}`;
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: `${topic.label}: LinkedIn archive`,
      description: topic.blurb,
      url,
      isPartOf: { "@type": "CollectionPage", name: "LinkedIn archive", url: `${SITE_URL}/linkedin` },
      hasPart: topic.items.slice(0, 60).map(itemLd),
    },
    breadcrumbJsonLd([
      { name: "LinkedIn archive", url: `${SITE_URL}/linkedin` },
      { name: topic.label, url },
    ]),
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLd) }} />
      <LinkedInTopicView topic={topic} />
    </>
  );
}
