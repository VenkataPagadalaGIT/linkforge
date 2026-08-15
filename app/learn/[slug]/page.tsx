import { OG_IMAGE, SITE_NAME, SITE_URL } from "@/lib/site";
import type { Metadata } from "next";
import { allLearnTopics, learnTopicBySlug, learnChapterOfTopic, learnPrevNext } from "@/data/learn";
import LearnShell from "@/components/learn/LearnShell";
import LearnTopicView from "@/components/learn/LearnTopicView";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return allLearnTopics.map((t) => ({ slug: t.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const topic = learnTopicBySlug(params.slug);
  if (!topic) return {};
  const title = `${topic.title} · The AI Tutorial`;
  return {
    title: { absolute: title },
    description: topic.summary,
    alternates: { canonical: `/learn/${topic.slug}` },
    openGraph: {
      images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }],
      url: `/learn/${topic.slug}`,
      title,
    },
  };
}

export default function Page({ params }: { params: { slug: string } }) {
  const topic = learnTopicBySlug(params.slug)!;
  const chapter = learnChapterOfTopic(topic.slug);
  const { prev, next } = learnPrevNext(topic.slug);

  // TechArticle + breadcrumb structured data, one block per lesson.
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "TechArticle",
        headline: topic.title,
        description: topic.summary,
        url: `${SITE_URL}/learn/${topic.slug}`,
        isPartOf: { "@type": "Course", name: "The AI Tutorial", url: `${SITE_URL}/learn` },
        author: { "@id": `${SITE_URL}/#person` },
        timeRequired: `PT${topic.minutes}M`,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Learn", item: `${SITE_URL}/learn` },
          { "@type": "ListItem", position: 2, name: chapter?.title ?? "Chapter" },
          { "@type": "ListItem", position: 3, name: topic.title, item: `${SITE_URL}/learn/${topic.slug}` },
        ],
      },
    ],
  };

  return (
    <LearnShell activeSlug={topic.slug}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <LearnTopicView topic={topic} />
      {/* crawlable hint of the linear order for engines */}
      <link rel="prev" href={prev ? `/learn/${prev.slug}` : "/learn"} />
      {next && <link rel="next" href={`/learn/${next.slug}`} />}
    </LearnShell>
  );
}
