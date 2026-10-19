import type { Metadata } from "next";
import { notFound } from "next/navigation";
import LinkedInArticleView from "@/views/LinkedInArticleView";
import { SITE_URL, OG_IMAGE, SITE_NAME } from "@/lib/site";
import { jsonLdScript } from "@/lib/jsonld";
import { withSeoOverrides } from "@/lib/seo-overrides";
import { breadcrumbJsonLd } from "@/lib/content-fetch";
import { LINKEDIN_PROFILE, clipText, formatDay, imageUrlFor, postPath, topicLabel } from "@/data/linkedinArchive";
import { LINKEDIN_SOCIAL_POSTS, getLinkedInPost } from "@/data/linkedinArchiveServer";

type Params = { slug: string };

// One static page per post (slugs are frozen); an unknown slug hard-404s.
export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return LINKEDIN_SOCIAL_POSTS.map((p) => ({ slug: p.id }));
}

const post = (slug: string) => {
  const p = getLinkedInPost(slug);
  return p && p.type === "post" ? p : undefined;
};
const image = imageUrlFor;

export const generateMetadata = withSeoOverrides("/linkedin/posts/[slug]", baseMetadata);

async function baseMetadata({ params }: { params: Params }): Promise<Metadata> {
  const p = post(params.slug);
  if (!p) return { title: "Not found", robots: { index: false, follow: false } };
  const description = p.excerpt.slice(0, 300);
  const img = image(p.cover);
  return {
    // The day keeps short or repeated titles ("#seo", "Interesting") distinct.
    title: { absolute: `${clipText(p.title, 64)} (${formatDay(p.date.slice(0, 10))}) | Venkata Pagadala on LinkedIn` },
    description,
    authors: [{ name: "Venkata Pagadala", url: SITE_URL }],
    alternates: { canonical: postPath(p) },
    openGraph: {
      type: "article",
      url: postPath(p),
      title: p.title,
      description,
      publishedTime: p.date,
      authors: ["Venkata Pagadala"],
      images: img ? [{ url: img }] : [{ url: OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }],
    },
  };
}

export default function Page({ params }: { params: Params }) {
  const p = post(params.slug);
  if (!p) notFound();
  const url = `${SITE_URL}${postPath(p)}`;
  const author = { "@type": "Person", name: "Venkata Pagadala", url: SITE_URL, sameAs: [LINKEDIN_PROFILE] };
  const e = p.engagement;
  const counter = (type: string, n?: number) => (n == null ? [] : [{ "@type": "InteractionCounter", interactionType: `https://schema.org/${type}`, userInteractionCount: n }]);
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "SocialMediaPosting",
      headline: p.title,
      description: p.excerpt,
      url,
      mainEntityOfPage: { "@type": "WebPage", "@id": url },
      datePublished: p.date,
      keywords: [...p.topics, ...p.subtopics].map(topicLabel).join(", "),
      ...(image(p.cover) ? { image: image(p.cover) } : {}),
      author,
      // The same post on LinkedIn.
      sameAs: p.url,
      ...(e ? { interactionStatistic: [...counter("LikeAction", e.reactions), ...counter("CommentAction", e.comments), ...counter("ShareAction", e.reposts)] } : {}),
      isPartOf: { "@type": "CollectionPage", name: "LinkedIn posts", url: `${SITE_URL}/linkedin/posts` },
    },
    breadcrumbJsonLd([
      { name: "LinkedIn archive", url: `${SITE_URL}/linkedin` },
      { name: "Posts", url: `${SITE_URL}/linkedin/posts` },
      { name: clipText(p.title, 80), url },
    ]),
  ];
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLd) }} />
      <LinkedInArticleView post={p} />
    </>
  );
}
