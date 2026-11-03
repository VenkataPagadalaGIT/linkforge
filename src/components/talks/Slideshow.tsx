"use client";

/**
 * A row of slides that moves sideways, so a long run of pictures or posts
 * takes one row of the page instead of a wall.
 *
 * Without JavaScript it is a plain horizontal scroller with snap points:
 * every slide is still reachable by swiping or scrolling. With it, arrow
 * buttons and a "1-3 of 23" counter appear. The buttons are not rendered
 * until they work: a control that does nothing is worse than none.
 */

import { Children, useCallback, useEffect, useRef, useState, type ReactNode } from "react";

export default function Slideshow({
  label,
  children,
  slideClassName = "w-[85%] sm:w-[22rem]",
}: {
  /** What the row holds, for screen readers: "Photos from the talk". */
  label: string;
  children: ReactNode;
  /** Width of each slide; the row shows as many as fit. */
  slideClassName?: string;
}) {
  const slides = Children.toArray(children);
  const track = useRef<HTMLDivElement | null>(null);
  const [ready, setReady] = useState(false);
  const [view, setView] = useState({ first: 1, last: 1, atStart: true, atEnd: slides.length <= 1 });

  const measure = useCallback(() => {
    const el = track.current;
    if (!el) return;
    const box = el.getBoundingClientRect();
    const items = Array.from(el.children) as HTMLElement[];
    const seen = items
      .map((c, i) => ({ i, r: c.getBoundingClientRect() }))
      .filter(({ r }) => r.right > box.left + 8 && r.left < box.right - 8)
      .map(({ i }) => i);
    setView({
      first: (seen[0] ?? 0) + 1,
      last: (seen[seen.length - 1] ?? 0) + 1,
      atStart: el.scrollLeft <= 4,
      atEnd: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4,
    });
  }, []);

  useEffect(() => {
    setReady(true);
    measure();
    const el = track.current;
    if (!el) return;
    el.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      el.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, [measure]);

  const move = (dir: 1 | -1) => {
    const el = track.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.9, behavior: "smooth" });
  };

  const btn =
    "font-mono text-sm w-9 h-9 border border-border text-foreground hover:border-foreground/40 disabled:opacity-40 disabled:hover:border-border transition-colors";

  return (
    <div role="region" aria-roledescription="carousel" aria-label={label}>
      {ready && slides.length > 1 && (
        <div className="flex items-center justify-end gap-3 mb-3">
          <p className="font-mono text-[11px] text-muted-foreground tabular-nums mr-auto" aria-live="polite">
            {view.first === view.last ? view.first : `${view.first}–${view.last}`} of {slides.length}
          </p>
          <button type="button" className={btn} onClick={() => move(-1)} disabled={view.atStart} aria-label={`Previous: ${label}`}>
            ←
          </button>
          <button type="button" className={btn} onClick={() => move(1)} disabled={view.atEnd} aria-label={`Next: ${label}`}>
            →
          </button>
        </div>
      )}
      <div
        ref={track}
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory overscroll-x-contain pb-3 [scrollbar-width:thin]"
      >
        {slides.map((s, i) => (
          <div key={i} role="group" aria-roledescription="slide" aria-label={`${i + 1} of ${slides.length}`} className={`snap-start shrink-0 ${slideClassName}`}>
            {s}
          </div>
        ))}
      </div>
    </div>
  );
}
