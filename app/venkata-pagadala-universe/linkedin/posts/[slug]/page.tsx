import type { Metadata } from "next";
import { notFound } from "next/navigation";
import LinkedInArticleView from "@/views/LinkedInArticleView";
import { SITE_URL, OG_IMAGE, SITE_NAME } from "@/lib/site";
import { jsonLdScript } from "@/lib/jsonld";
import { withSeoOverrides } from "@/lib/seo-overrides";
import { breadcrumbJsonLd } from "@/lib/content-fetch";
import { LINKEDIN_POSTS_PATH, LINKEDIN_PROFILE, UNIVERSE_NAME, UNIVERSE_PATH, clipText, imageUrlFor, postPath, topicLabel } from "@/data/linkedinArchive";
import { LINKEDIN_SOCIAL_POSTS, getLinkedInPost } from "@/data/linkedinArchiveServer";
import { seoFor } from "@/data/universeSeo";
import { clip, plain } from "@/lib/seoText";

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

export const generateMetadata = withSeoOverrides("/venkata-pagadala-universe/linkedin/posts/[slug]", baseMetadata);

async function baseMetadata({ params }: { params: Params }): Promise<Metadata> {
  const p = post(params.slug);
  if (!p) return { title: "Not found", robots: { index: false, follow: false } };
  const { title, description } = seoFor(p);
  // Share cards show more than a search result; X cuts at about 70 characters.
  const social = clip(plain(p.title), 90);
  const img = image(p.cover);
  const images = img ? [{ url: img }] : [{ url: OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }];
  return {
    title: { absolute: title },
    description,
    authors: [{ name: "Venkata Pagadala", url: SITE_URL }],
    alternates: { canonical: postPath(p) },
    openGraph: {
      type: "article",
      url: postPath(p),
      title: social,
      description,
      publishedTime: p.date,
      authors: ["Venkata Pagadala"],
      images,
    },
    twitter: { card: "summary_large_image", title: social, description, images },
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
      isPartOf: { "@type": "CollectionPage", name: "LinkedIn posts", url: `${SITE_URL}${LINKEDIN_POSTS_PATH}` },
    },
    breadcrumbJsonLd([
      { name: UNIVERSE_NAME, url: `${SITE_URL}${UNIVERSE_PATH}` },
      { name: "LinkedIn posts", url: `${SITE_URL}${LINKEDIN_POSTS_PATH}` },
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
