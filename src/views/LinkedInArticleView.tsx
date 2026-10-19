import * as React from "react";
import ScrollReveal from "@/components/ScrollReveal";
import ArticleCard from "@/components/linkedin/ArticleCard";
import { LINKEDIN_POST_BODIES } from "@/data/linkedinPostBodiesData";
import { LINKEDIN_ITEMS, LINKEDIN_MEDIA_BASE, formatDateTime, fullUrl, readingMinutes, relatedPosts, topicLabel, topicSlug, type LiPost } from "@/data/linkedinArchive";

/**
 * One LinkedIn article, kept here in full: the text as published, its images
 * served from this site, the people it names, its topics, and the link back to
 * the original on LinkedIn. Server-rendered; no JavaScript needed.
 */

/** Typography for the article body (the HTML is rebuilt from an allowlist at build time, so only these tags occur). */
const BODY =
  "font-mono text-sm leading-relaxed text-muted-foreground " +
  "[&_p]:my-4 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-foreground [&_h2]:mt-10 [&_h2]:mb-4 " +
  "[&_h3]:font-display [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-foreground [&_h3]:mt-8 [&_h3]:mb-3 " +
  "[&_h4]:font-bold [&_h4]:text-foreground [&_h4]:mt-6 [&_h4]:mb-2 " +
  "[&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-5 [&_ol]:pl-5 [&_ul]:my-4 [&_ol]:my-4 [&_li]:my-1.5 [&_li>p]:my-0 " +
  "[&_strong]:text-foreground [&_a]:underline [&_a]:underline-offset-2 [&_a]:text-foreground [&_a:hover]:text-foreground/80 [&_a]:break-words " +
  "[&_blockquote]:border-l-2 [&_blockquote]:border-foreground/40 [&_blockquote]:pl-4 [&_blockquote]:italic " +
  "[&_pre]:bg-muted/40 [&_pre]:border [&_pre]:border-border [&_pre]:p-4 [&_pre]:overflow-x-auto [&_pre]:text-xs " +
  "[&_hr]:my-8 [&_hr]:border-border [&_figure]:my-6 [&_figure]:border [&_figure]:border-border " +
  "[&_img]:block [&_img]:w-full [&_img]:h-auto [&_figcaption]:px-3 [&_figcaption]:py-2 [&_figcaption]:text-xs [&_figcaption]:text-muted-foreground " +
  "[&>img]:my-6 [&>img]:border [&>img]:border-border";

export default function LinkedInArticleView({ post }: { post: LiPost }) {
  const html = (LINKEDIN_POST_BODIES[post.id] ?? "").replaceAll("{{media}}", LINKEDIN_MEDIA_BASE);
  const related = relatedPosts(post);
  const e = post.engagement;
  const cover = post.cover ? LINKEDIN_ITEMS.find((i) => i.idx === post.cover) : undefined;

  return (
    <div className="min-h-screen bg-background pt-24 pb-20 px-6">
      <div className="max-w-3xl mx-auto">
        <ScrollReveal>
          <nav className="font-mono text-xs text-muted-foreground mb-8 flex items-center gap-2 flex-wrap" aria-label="Breadcrumb">
            <a href="/linkedin" className="hover:text-foreground transition-colors">LinkedIn archive</a>
            <span aria-hidden="true">/</span>
            <a href="/linkedin/articles" className="hover:text-foreground transition-colors">Articles</a>
          </nav>
          <p className="font-mono text-[10px] text-muted-foreground/70 tracking-widest uppercase mb-4">
            LinkedIn article · <time dateTime={post.date}>{formatDateTime(post.date)}</time> · {post.words.toLocaleString("en-US")} words · {readingMinutes(post.words)} min read
            {post.series ? ` · ${post.series}${post.edition ? `, edition ${post.edition}` : ""}` : ""}
          </p>
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground text-glow mb-6">{post.title}</h1>
          <div className="flex flex-wrap items-center gap-2 mb-6">
            {post.topics.map((t) => (
              <a key={t} href={`/linkedin/topics/${topicSlug(t)}`} className="font-mono text-[10px] uppercase tracking-[0.15em] border border-border px-2 py-1 text-muted-foreground hover:text-foreground hover:border-foreground/50">
                {topicLabel(t)}
              </a>
            ))}
          </div>
          <div className="flex flex-wrap gap-3 mb-10">
            <a
              href={post.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-[11px] uppercase tracking-[0.15em] px-3 py-2 border border-foreground text-foreground hover:bg-foreground hover:text-background transition-colors"
              data-testid="linkedin-article-original"
            >
              Read it on LinkedIn ↗
            </a>
            <a href="/linkedin" className="font-mono text-[11px] uppercase tracking-[0.15em] px-3 py-2 border border-border text-muted-foreground hover:text-foreground hover:border-foreground/50 transition-colors">
              See it in the knowledge graph
            </a>
          </div>
          {post.review && (
            <p className="mb-6 font-mono text-[10px] uppercase tracking-[0.15em] px-2 py-1 bg-amber-300 text-black inline-block">Unpublished draft: local preview only</p>
          )}
        </ScrollReveal>

        {e && (
          <section aria-labelledby="li-eng-h" className="border border-border p-4 mb-10">
            <h2 id="li-eng-h" className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70 mb-3">
              Engagement on LinkedIn, as of {e.asOf}
            </h2>
            <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(
                [
                  ["Reactions", e.reactions],
                  ["Comments", e.comments],
                  ["Reposts", e.reposts],
                  ["Impressions", e.impressions],
                ] as const
              )
                .filter(([, v]) => v != null)
                .map(([k, v]) => (
                  <div key={k}>
                    <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">{k}</dt>
                    <dd className="font-display text-2xl font-bold text-foreground">{v!.toLocaleString("en-US")}</dd>
                  </div>
                ))}
            </dl>
            <p className="mt-3 font-mono text-[10px] text-muted-foreground/70">Source: {e.source}.</p>
          </section>
        )}

        {cover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={fullUrl(cover)}
            alt={cover.description}
            width={cover.width}
            height={cover.height}
            decoding="async"
            className="block w-full h-auto border border-border mb-10"
            data-testid="linkedin-article-cover"
          />
        )}

        <article className={`border-t border-border pt-8 ${BODY}`} data-testid="linkedin-article-body" dangerouslySetInnerHTML={{ __html: html }} />

        {post.people.length > 0 && (
          <section aria-labelledby="li-people-h" className="border-t border-border mt-12 pt-8">
            <h2 id="li-people-h" className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70 mb-3">
              People named in this article ({post.people.length})
            </h2>
            <ul className="flex flex-wrap gap-1.5">
              {post.people.map((p) => (
                <li key={p.url}>
                  <a href={p.url} target="_blank" rel="noopener noreferrer" className="inline-block font-mono text-[11px] px-2 py-1 border border-border text-foreground hover:border-foreground/50">
                    {p.name} <span className="text-muted-foreground/70" aria-hidden="true">↗</span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        <p className="mt-12 font-mono text-[11px] text-muted-foreground/70 leading-relaxed">
          First published on LinkedIn on {formatDateTime(post.date)} (
          <a href={post.url} target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">original</a>
          ). Kept here in full so it stays available; the images are this site&apos;s copies of the ones in the article, also in{" "}
          <a href="/linkedin" className="underline hover:text-foreground">the LinkedIn archive</a>.
        </p>

        {related.length > 0 && (
          <section aria-labelledby="li-rel-h" className="border-t border-border mt-12 pt-8">
            <h2 id="li-rel-h" className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70 mb-4">More articles on these topics</h2>
            <ul className="grid sm:grid-cols-3 gap-3">
              {related.map((r) => (
                <li key={r.id}>
                  <ArticleCard post={r} compact />
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
