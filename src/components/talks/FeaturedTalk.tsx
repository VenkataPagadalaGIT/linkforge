"use client";

import { useState } from "react";
import Link from "next/link";
import TalkVideo from "./TalkVideo";
import { BRIGHTONSEO_2026 as T, formatClock, formatTalkDate } from "@/data/talks";

/**
 * The featured talk: the recording, the facts of the session, and its chapters.
 *
 * Chapters are buttons only when there is a recording to move through. Before
 * the video is hosted they are a plain outline of what the talk covers, which
 * is true and useful, rather than eighteen controls that do nothing.
 */
export default function FeaturedTalk({
  hideLinkTo,
  videoHref,
  chapterAnchor,
}: {
  hideLinkTo?: string;
  videoHref?: string;
  /** Anchor prefix for chapters on a page that carries the transcript, e.g. "#t-" (a string: props from a server page must serialize). */
  chapterAnchor?: string;
} = {}) {
  const [seek, setSeek] = useState<{ at: number; nonce: number } | undefined>();
  const playable = Boolean(T.video.src || T.video.youtubeId);
  // On a page that is itself one of these links, the button would point at itself.
  const links = hideLinkTo ? T.links.filter((l) => l.url !== hideLinkTo) : T.links;

  return (
    <div className="border border-border bg-card/20">
      <div className="grid lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <div className="p-4 lg:p-5 border-b lg:border-b-0 lg:border-r border-border">
          <TalkVideo video={T.video} title={`${T.title}, ${T.event}`} seekTo={seek} />
          {!playable && (
            <p className="font-mono text-[10px] text-muted-foreground mt-2 leading-relaxed">
              Recording from the stage, edited to fifteen minutes.{" "}
              {T.video.linkedinPost ? (
                <>
                  Watch the full talk{" "}
                  <a
                    href={videoHref ?? T.video.linkedinPost}
                    {...(videoHref ? {} : { target: "_blank", rel: "noopener noreferrer" })}
                    className="text-foreground underline decoration-border hover:decoration-foreground underline-offset-4"
                  >
                    {videoHref ? "below" : "on LinkedIn ↗"}
                  </a>
                  .
                </>
              ) : (
                "The slides are on Speaker Deck while the video is being published."
              )}
            </p>
          )}
        </div>

        <div className="p-5 lg:p-6 flex flex-col">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-2">
            {T.event} · {T.track}
          </p>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground leading-tight text-balance">
            {T.title}
          </h2>
          <p className="font-mono text-sm text-foreground/85 mt-1">{T.tagline}</p>
          <p className="font-mono text-[11px] text-muted-foreground mt-3">
            <time dateTime={T.startDate}>{formatTalkDate(T.startDate.slice(0, 10))}</time>, 9:15 AM ·{" "}
            {T.city} · 15 min edit
          </p>
          <p className="font-mono text-xs text-muted-foreground leading-relaxed mt-4">{T.summary}</p>

          <div className="flex flex-wrap gap-2 mt-5">
            {links.map((l) =>
              l.internal ? (
                <Link
                  key={l.url}
                  href={l.url}
                  className="font-mono text-[11px] border border-foreground/40 px-3 py-1.5 text-foreground hover:bg-foreground/5 transition-colors"
                >
                  {l.label}
                </Link>
              ) : (
                <a
                  key={l.url}
                  href={l.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-[11px] border border-border px-3 py-1.5 text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors"
                >
                  {l.label} ↗
                </a>
              ),
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-border p-4 lg:p-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-3">
          {playable ? "Chapters · jump to any section" : "What the talk covers"}
        </p>
        <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-1">
          {T.chapters.map((c) => (
            <li key={c.at}>
              {playable ? (
                <button
                  type="button"
                  onClick={() => setSeek({ at: c.at, nonce: Date.now() })}
                  className="w-full flex items-baseline gap-3 py-1 text-left group"
                >
                  <span className="font-mono text-[11px] text-muted-foreground tabular-nums w-10 shrink-0 group-hover:text-foreground">
                    {formatClock(c.at)}
                  </span>
                  <span className="font-mono text-xs text-foreground group-hover:underline decoration-border">
                    {c.title}
                  </span>
                </button>
              ) : chapterAnchor ? (
                <a href={`${chapterAnchor}${c.at}`} className="flex items-baseline gap-3 py-1 group">
                  <span className="font-mono text-[11px] text-muted-foreground tabular-nums w-10 shrink-0 group-hover:text-foreground">
                    {formatClock(c.at)}
                  </span>
                  <span className="font-mono text-xs text-foreground group-hover:underline decoration-border">{c.title}</span>
                </a>
              ) : (
                <span className="flex items-baseline gap-3 py-1">
                  <span className="font-mono text-[11px] text-muted-foreground tabular-nums w-10 shrink-0">
                    {formatClock(c.at)}
                  </span>
                  <span className="font-mono text-xs text-foreground">{c.title}</span>
                </span>
              )}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
