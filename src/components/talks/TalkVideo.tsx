"use client";

/**
 * One video slot, three honest states.
 *
 *   src        a self-hosted file: a native <video>, which works with scripts
 *              blocked because the browser plays it, not our JavaScript.
 *   youtubeId  a click-to-load facade: the poster and a real link to YouTube
 *              render server-side, and the iframe (with its third-party script
 *              and cookies) only arrives when someone asks for it.
 *   neither    the poster as a still figure, with no play control at all. A
 *              play button that does nothing is worse than no play button.
 *
 * `seekTo` lets the chapter list move the playhead when there is something to
 * move; the page only renders chapters as buttons in that case.
 */

import { useEffect, useRef, useState } from "react";
import type { TalkVideo as Video } from "@/data/talks";

export default function TalkVideo({
  video,
  title,
  seekTo,
  className = "",
}: {
  video: Video;
  title: string;
  /** Seconds; changes to this value seek the player. */
  seekTo?: { at: number; nonce: number };
  className?: string;
}) {
  const ref = useRef<HTMLVideoElement | null>(null);
  const [ytOn, setYtOn] = useState(false);
  const [ytStart, setYtStart] = useState(0);
  const tall = video.aspect === "9:16";
  const ratio = tall ? "aspect-[9/16]" : "aspect-video";

  useEffect(() => {
    if (!seekTo) return;
    if (video.src && ref.current) {
      ref.current.currentTime = seekTo.at;
      ref.current.play().catch(() => {});
    } else if (video.youtubeId) {
      setYtStart(seekTo.at);
      setYtOn(true);
    }
  }, [seekTo, video.src, video.youtubeId]);

  const frame = `relative w-full overflow-hidden border border-border bg-card ${ratio} ${className}`;

  if (video.src) {
    return (
      <div className={frame}>
        <video
          ref={ref}
          controls
          playsInline
          preload="metadata"
          poster={video.poster}
          className="absolute inset-0 w-full h-full object-cover bg-black"
          aria-label={title}
        >
          <source src={video.src} type="video/mp4" />
          <a href={video.src}>Download the video</a>
        </video>
      </div>
    );
  }

  if (video.youtubeId) {
    const watch = `https://www.youtube.com/watch?v=${video.youtubeId}`;
    if (ytOn) {
      return (
        <div className={frame}>
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${video.youtubeId}?autoplay=1&rel=0&start=${Math.floor(ytStart)}`}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 w-full h-full"
          />
        </div>
      );
    }
    return (
      <div className={frame}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={video.poster} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <a
          href={watch}
          onClick={(e) => {
            e.preventDefault();
            setYtOn(true);
          }}
          className="absolute inset-0 flex items-center justify-center group focus-visible:outline focus-visible:outline-2 focus-visible:outline-foreground"
          aria-label={`Play: ${title}`}
        >
          <span className="flex items-center gap-2 bg-background/90 border border-border px-4 py-2.5 font-mono text-xs uppercase tracking-wider text-foreground group-hover:bg-background transition-colors">
            <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
              <path d="M2 1l9 5-9 5z" fill="currentColor" />
            </svg>
            Play
          </span>
        </a>
      </div>
    );
  }

  // No hosted video yet: a still, and nothing that pretends to play.
  return (
    <figure className={`${frame} m-0`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={video.poster} alt={title} className="absolute inset-0 w-full h-full object-cover" />
    </figure>
  );
}
