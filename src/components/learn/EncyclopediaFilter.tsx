"use client";
import { useEffect, useState } from "react";

/**
 * EncyclopediaFilter: search and difficulty filtering over the server-
 * rendered concept cards. Progressive enhancement: the cards are plain
 * crawlable links; this component only shows/hides them by matching the
 * data-search attribute, so with JavaScript blocked the full catalog
 * still renders and every link still works.
 */
export default function EncyclopediaFilter() {
  const [q, setQ] = useState("");
  const [diff, setDiff] = useState<string>("");

  useEffect(() => {
    const needle = q.trim().toLowerCase();
    const cards = document.querySelectorAll<HTMLElement>("[data-concept-card]");
    let anyVisible = false;
    cards.forEach((el) => {
      const hay = el.dataset.search ?? "";
      const okQ = !needle || hay.includes(needle);
      const okD = !diff || el.dataset.difficulty === diff;
      const show = okQ && okD;
      el.style.display = show ? "" : "none";
      if (show) anyVisible = true;
    });
    // hide category sections that filtered to empty
    document.querySelectorAll<HTMLElement>("[data-category-section]").forEach((sec) => {
      const visible = sec.querySelector<HTMLElement>('[data-concept-card]:not([style*="display: none"])');
      sec.style.display = visible ? "" : "none";
    });
    const empty = document.getElementById("encyclopedia-empty");
    if (empty) empty.style.display = anyVisible ? "none" : "";
  }, [q, diff]);

  return (
    <div className="flex flex-wrap items-center gap-3 mb-8">
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search 187 concepts…"
        aria-label="Search concepts"
        className="w-full sm:w-80 bg-transparent border border-border px-3 py-2 font-mono text-xs text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:border-foreground/50"
      />
      <div className="flex items-center gap-1.5">
        {["", "beginner", "intermediate", "advanced"].map((d) => (
          <button
            key={d || "all"}
            type="button"
            onClick={() => setDiff(d)}
            className={`font-mono text-[10px] uppercase tracking-wider px-2.5 py-1.5 border transition-colors ${
              diff === d
                ? "border-foreground/60 text-foreground bg-secondary/40"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {d || "all"}
          </button>
        ))}
      </div>
    </div>
  );
}
