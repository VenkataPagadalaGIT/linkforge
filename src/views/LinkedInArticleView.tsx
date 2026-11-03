import * as React from "react";
import ScrollReveal from "@/components/ScrollReveal";
import ArticleCard from "@/components/linkedin/ArticleCard";
import { LINKEDIN_POST_BODIES } from "@/data/linkedinPostBodiesData";
import {
  KIND_LABEL,
  LINKEDIN_ITEMS,
  engagementSource,
  LINKEDIN_MEDIA_BASE,
  formatDateTime,
  formatDuration,
  fullUrl,
  posterUrl,
  readingMinutes,
  thumbUrl,
  getTopic,
  topicLabel,
  topicPath,
  type LiItem,
  LINKEDIN_ARTICLES_PATH,
  LINKEDIN_POSTS_PATH,
  UNIVERSE_NAME,
  UNIVERSE_PATH,
  type LiPost,
} from "@/data/linkedinArchive";
import { relatedPosts } from "@/data/linkedinArchiveServer";

/**
 * One LinkedIn article or post, kept here in full: the text as published, its
 * images, videos and documents served from this site, the people it names, its
 * topics, its engagement (with date and source), and the link back to the
 * original on LinkedIn. Server-rendered; no JavaScript needed.
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
  const isPost = post.type === "post";
  const hub = isPost ? { href: LINKEDIN_POSTS_PATH, label: "LinkedIn posts" } : { href: LINKEDIN_ARTICLES_PATH, label: "LinkedIn articles" };
  // Articles carry their images inside the text (cover above it); a post's media follows its text.
  const cover = !isPost && post.cover ? LINKEDIN_ITEMS.find((i) => i.idx === post.cover) : undefined;
  const media = isPost ? post.media.map((m) => LINKEDIN_ITEMS.find((i) => i.idx === m)).filter((x): x is LiItem => !!x) : [];
  const commentMedia = (post.commentMedia ?? []).map((m) => LINKEDIN_ITEMS.find((i) => i.idx === m)).filter((x): x is LiItem => !!x);

  return (
    <div className="min-h-screen bg-background pt-24 pb-20 px-6">
      <div className="max-w-3xl mx-auto">
        <ScrollReveal>
          <nav className="font-mono text-xs text-muted-foreground mb-8 flex items-center gap-2 flex-wrap" aria-label="Breadcrumb">
            <a href={UNIVERSE_PATH} className="hover:text-foreground transition-colors">{UNIVERSE_NAME}</a>
            <span aria-hidden="true">/</span>
            <a href={hub.href} className="hover:text-foreground transition-colors">{hub.label}</a>
          </nav>
          <p className="font-mono text-[10px] text-muted-foreground/70 tracking-widest uppercase mb-4">
            LinkedIn {post.type} · <time dateTime={post.date}>{formatDateTime(post.date)}</time>
            {isPost ? "" : ` · ${post.words.toLocaleString("en-US")} words · ${readingMinutes(post.words)} min read`}
            {post.series ? ` · ${post.series}${post.edition ? `, edition ${post.edition}` : ""}` : ""}
          </p>
          <h1 className={`font-display font-bold text-foreground text-glow mb-6 ${isPost ? "text-2xl sm:text-3xl" : "text-3xl sm:text-4xl lg:text-5xl"}`}>{post.title}</h1>
          <div className="flex flex-wrap items-center gap-2 mb-6">
            {post.topics.map((t) => {
              const area = getTopic(t)?.parent;
              return (
                <span key={t} className="inline-flex items-center gap-1.5">
                  {area && (
                    <a href={topicPath(area)} className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground/80 hover:text-foreground">
                      {topicLabel(area)} ›
                    </a>
                  )}
                  <a href={topicPath(t)} className="font-mono text-[10px] uppercase tracking-[0.15em] border border-border px-2 py-1 text-muted-foreground hover:text-foreground hover:border-foreground/50">
                    {topicLabel(t)}
                  </a>
                  {post.subtopics
                    .filter((x) => getTopic(x)?.parent === t)
                    .map((x) => (
                      <a key={x} href={topicPath(x)} className="font-mono text-[10px] uppercase tracking-[0.15em] border border-dashed border-border px-2 py-1 text-muted-foreground hover:text-foreground hover:border-foreground/50">
                        {topicLabel(x)}
                      </a>
                    ))}
                </span>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-3 mb-10">
            <a
              href={post.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-[11px] uppercase tracking-[0.15em] px-3 py-2 border border-foreground text-foreground hover:bg-foreground hover:text-background transition-colors"
              data-testid="linkedin-article-original"
            >
              {isPost ? "See it on LinkedIn ↗" : "Read it on LinkedIn ↗"}
            </a>
            <a href={UNIVERSE_PATH} className="font-mono text-[11px] uppercase tracking-[0.15em] px-3 py-2 border border-border text-muted-foreground hover:text-foreground hover:border-foreground/50 transition-colors">
              See it in the Universe
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
                  [e.impressionsAtLeast ? "Impressions (at least)" : "Impressions", e.impressions],
                  [e.engagementsAtLeast ? "Engagements (at least)" : "Engagements", e.engagements],
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
            <p className="mt-3 font-mono text-[10px] text-muted-foreground/70">Source: {engagementSource(e)}.</p>
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

        {media.length > 0 && (
          <section aria-label="Media in this post" className="mt-8 grid gap-4" data-testid="linkedin-post-media">
            {media.map((it) =>
              it.kind === "video" ? (
                <figure key={it.idx} className="border border-border">
                  <video src={fullUrl(it)} poster={posterUrl(it.idx)} controls preload="none" playsInline className="block w-full bg-black" />
                  <figcaption className="px-3 py-2 font-mono text-[11px] text-muted-foreground">
                    Video · {formatDuration(it.duration)} · {it.description}
                  </figcaption>
                </figure>
              ) : it.kind === "document" ? (
                <a key={it.idx} href={fullUrl(it)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 border border-border p-3 hover:border-foreground/50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={thumbUrl(it)} alt="" loading="lazy" className="w-20 h-20 object-cover border border-border" />
                  <span className="font-mono text-[11px] text-foreground">
                    {KIND_LABEL[it.kind]} ({(it.docExt ?? "pdf").toUpperCase()}): {it.description} ↗
                  </span>
                </a>
              ) : (
                <figure key={it.idx} className="border border-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={fullUrl(it)} alt={it.description} width={it.width} height={it.height} loading="lazy" decoding="async" className="block w-full h-auto" />
                </figure>
              ),
            )}
          </section>
        )}

        {commentMedia.length > 0 && (
          <section aria-labelledby="li-cm-h" className="mt-8">
            <h2 id="li-cm-h" className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70 mb-3">
              Shared in my comments on this {post.type}
            </h2>
            <div className="grid gap-4">
              {commentMedia.map((it) => (
                <figure key={it.idx} className="border border-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={fullUrl(it)} alt={it.description} width={it.width} height={it.height} loading="lazy" decoding="async" className="block w-full h-auto" />
                </figure>
              ))}
            </div>
          </section>
        )}

        {post.people.length > 0 && (
          <section aria-labelledby="li-people-h" className="border-t border-border mt-12 pt-8">
            <h2 id="li-people-h" className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70 mb-3">
              People named in this {post.type} ({post.people.length})
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
          ). Kept here in full so it stays available
          {media.length + commentMedia.length > 0 || (!isPost && post.media.length > 0) ? (
            <>
              ; the media are this site&apos;s copies of the ones on LinkedIn, also in{" "}
              <a href={UNIVERSE_PATH} className="underline hover:text-foreground">{UNIVERSE_NAME}</a>
            </>
          ) : null}
          .
        </p>

        {related.length > 0 && (
          <section aria-labelledby="li-rel-h" className="border-t border-border mt-12 pt-8">
            <h2 id="li-rel-h" className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70 mb-4">More {isPost ? "posts" : "articles"} on these topics</h2>
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
