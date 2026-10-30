"use client";
import * as React from "react";
import { EVENTS, type EventClaim, type EventFact, type EventSource, type FactStatus, type Verdict } from "@/data/events";

const VERDICT: Record<Verdict, { label: string; color: string }> = {
  true: { label: "True", color: "#16a34a" },
  false: { label: "False", color: "#ef4444" },
  misleading: { label: "Misleading", color: "#d97706" },
  unconfirmed: { label: "Unconfirmed", color: "#2563eb" },
};
const STATUS: Record<FactStatus, { label: string; tip: string }> = {
  official: { label: "Binance says", tip: "From Binance's own statements" },
  independent: { label: "Independently counted", tip: "From blockchain analytics firms' on-chain work" },
  reported: { label: "Reported", tip: "From news reports" },
  disputed: { label: "Not settled", tip: "Sources disagree or nothing official yet" },
};
const PLATFORM: Record<string, string> = { binance: "Binance", x: "X", news: "News", web: "Investigators", reddit: "Reddit", youtube: "YouTube", tiktok: "TikTok", instagram: "Instagram", hackernews: "Hacker News" };
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const usd = (v: number) => (v >= 1e9 ? `$${(v / 1e9).toFixed(2)}B` : `$${Math.round(v / 1e6)}M`);
const day = (iso: string | null) => (iso ? `${Number(iso.slice(8, 10))} ${MONTHS[Number(iso.slice(5, 7)) - 1]}` : "");
const utc = (iso: string) => `${day(iso)}, ${iso.slice(11, 16)} UTC`;
const host = (u: string | null) => (u ? u.replace(/^https?:\/\/(www\.)?/, "").split("/")[0] : "");

function H2({ children, aside }: { children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className="mb-3 mt-12 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-t border-border pt-6">
      <h2 className="font-display text-2xl font-bold text-foreground">{children}</h2>
      {aside && <span className="font-mono text-[10px] text-muted-foreground">{aside}</span>}
    </div>
  );
}

function Src({ s }: { s: EventSource }) {
  return (
    <li className="border-l-2 border-border pl-3">
      <q className="text-sm leading-snug text-foreground">{s.quote}</q>
      <span className="mt-0.5 block font-mono text-[10px] text-muted-foreground">
        {s.url ? (
          <a href={s.url} target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
            {s.author || host(s.url)}
          </a>
        ) : (
          s.author || "source"
        )}
        {s.publishedAt ? ` · ${day(s.publishedAt)}` : ""}
      </span>
    </li>
  );
}

function Sources({ list, label = "Exact words in the source" }: { list: EventSource[]; label?: string }) {
  const [open, setOpen] = React.useState(false);
  if (!list.length) return null;
  return (
    <div className="mt-2">
      <button type="button" onClick={() => setOpen(!open)} className="font-mono text-[10px] text-muted-foreground underline hover:text-foreground" aria-expanded={open}>
        {open ? "Hide" : label} ({list.length})
      </button>
      {open && <ul className="mt-2 space-y-2">{list.map((s, i) => <Src key={i} s={s} />)}</ul>}
    </div>
  );
}

function FactCard({ f }: { f: EventFact }) {
  const st = STATUS[f.status];
  return (
    <div className="min-w-0 border border-border bg-background p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">{f.label}</span>
        <span title={st.tip} className={`border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] ${f.status === "disputed" ? "border-amber-500 text-amber-600" : "border-border text-muted-foreground"}`}>
          {st.label}
        </span>
      </div>
      <p className="mt-1 font-display text-lg font-bold leading-snug text-foreground">{f.value}</p>
      {f.note && <p className="mt-1 text-xs text-muted-foreground">{f.note}</p>}
      <Sources list={f.evidence} />
    </div>
  );
}

function ClaimRow({ c }: { c: EventClaim }) {
  const v = VERDICT[c.verdict];
  const [open, setOpen] = React.useState(false);
  return (
    <li className="min-w-0 border-b border-border py-4">
      <div className="flex flex-wrap items-start gap-3">
        <span className="mt-0.5 shrink-0 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-white" style={{ background: v.color }}>
          {v.label}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display text-lg font-bold leading-snug text-foreground">&ldquo;{c.claim}&rdquo;</p>
          <p className="mt-1 text-sm text-muted-foreground">{c.explain}</p>
          <p className="mt-1 font-mono text-[10px] text-muted-foreground">
            {c.spread.total ? `Found in ${c.spread.total} items: ` + Object.entries(c.spread.byPlatform).map(([p, n]) => `${PLATFORM[p] ?? p} ${n}`).join(", ") : "Not found in what we read"}
          </p>
          {(c.examples.length > 0 || c.evidence.length > 0) && (
            <button type="button" onClick={() => setOpen(!open)} className="mt-1 font-mono text-[10px] text-muted-foreground underline hover:text-foreground" aria-expanded={open}>
              {open ? "Hide" : "What people said, and the source"}
            </button>
          )}
          {open && (
            <div className="mt-2 space-y-2">
              {c.examples.map((x, i) => (
                <p key={i} className="border-l-2 border-border pl-3 text-sm text-foreground">
                  <span className="mr-1 font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground">{PLATFORM[x.platform] ?? x.platform}{x.who ? ` · ${x.who}` : ""}</span>
                  {x.url ? (
                    <a href={x.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      {x.text}
                    </a>
                  ) : (
                    x.text
                  )}
                </p>
              ))}
              <ul className="space-y-2">{c.evidence.map((s, i) => <Src key={i} s={s} />)}</ul>
            </div>
          )}
        </div>
      </div>
    </li>
  );
}

function Coverage({ hours, platforms }: { hours: [string, Record<string, number>][]; platforms: string[] }) {
  if (hours.length < 2) return null;
  const tot = hours.map(([, c]) => Object.values(c).reduce((a, b) => a + b, 0));
  const max = Math.max(1, ...tot);
  return (
    <figure className="mt-3 min-w-0">
      <figcaption className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">Items published each hour (UTC) · max {max}</figcaption>
      <div className="mt-2 flex h-24 items-end gap-px border-b border-l border-border" role="img" aria-label="Items published each hour">
        {hours.map(([h, c], i) => (
          <div key={h} className="flex min-w-0 flex-1 flex-col-reverse" style={{ height: `${(tot[i] / max) * 100}%` }} title={`${day(h)} ${h.slice(11, 13)}:00 UTC: ${tot[i]} items`}>
            {platforms.filter((p) => c[p]).map((p) => (
              <div key={p} style={{ height: `${(c[p] / tot[i]) * 100}%`, background: COLORS[p] ?? "#94a3b8" }} />
            ))}
          </div>
        ))}
      </div>
      <div className="flex justify-between font-mono text-[9px] text-muted-foreground">
        <span>{day(hours[0][0])} {hours[0][0].slice(11, 13)}:00</span>
        <span>{day(hours[hours.length - 1][0])} {hours[hours.length - 1][0].slice(11, 13)}:00</span>
      </div>
      <ul className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
        {platforms.map((p) => (
          <li key={p} className="flex items-center gap-1 font-mono text-[10px] text-foreground">
            <span className="inline-block h-2 w-2" style={{ background: COLORS[p] ?? "#94a3b8" }} />
            {PLATFORM[p] ?? p}
          </li>
        ))}
      </ul>
    </figure>
  );
}
const COLORS: Record<string, string> = { news: "#2563eb", x: "#111827", reddit: "#f97316", youtube: "#ef4444", tiktok: "#06b6d4", instagram: "#c026d3", hackernews: "#d97706", web: "#16a34a", binance: "#eab308" };

export function EventFile({ slug }: { slug: string }) {
  const e = EVENTS[slug];
  const [tab, setTab] = React.useState<string | null>(null);
  if (!e) return null;
  const tops = Object.entries(e.top);
  const active = tab ?? tops[0]?.[0] ?? null;
  const talkPlatforms = [...new Set(e.coverage.hours.flatMap(([, c]) => Object.keys(c)))];
  const maxChain = Math.max(...e.money.rows.map((r) => r.usd));
  return (
    <article data-testid="event-file">
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Event file · updated {utc(e.updatedAt + "Z")}</p>
      <h1 className="mt-2 font-display text-3xl font-bold leading-tight text-foreground sm:text-5xl">{e.title}</h1>
      {e.summary && <p className="mt-4 max-w-3xl text-base leading-relaxed text-foreground sm:text-lg">{e.summary}</p>}
      <p className="mt-3 font-mono text-[10px] text-muted-foreground">
        Read {e.coverage.items.toLocaleString("en-US")} items: {e.coverage.byPlatform.map((p) => `${p.label} ${p.items}`).join(" · ")}
      </p>

      <H2 aside="each line opens to the exact words in its source">What do we know for sure?</H2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {e.facts.map((f) => (
          <FactCard key={f.key} f={f} />
        ))}
      </div>

      <H2 aside={e.money.note ?? undefined}>Where did the money go?</H2>
      <ul className="space-y-1.5">
        {e.money.rows.map((r) => (
          <li key={r.chain} className="grid min-w-0 grid-cols-[minmax(0,9rem)_1fr_auto] items-center gap-2 text-sm">
            <span className="truncate text-foreground">{r.chain}</span>
            <span className="h-3 bg-[#ef4444]/80" style={{ width: `${Math.max(1, (r.usd / maxChain) * 100)}%` }} title={r.quote} />
            <span className="font-mono text-xs tabular-nums text-foreground">{usd(r.usd)}</span>
          </li>
        ))}
      </ul>
      <p className="mt-2 font-mono text-[10px] text-muted-foreground">
        Total {usd(e.money.total)} by chain
        {e.money.source?.url && (
          <>
            {" · "}
            <a href={e.money.source.url} target="_blank" rel="noopener noreferrer" className="underline">
              {e.money.source.author || host(e.money.source.url)}
            </a>
          </>
        )}
      </p>
      {e.money.frozen.map((f) => (
        <p key={f.who} className="mt-2 text-sm text-foreground">
          <span className="font-bold">Frozen: {usd(f.usd)}</span> by {f.who}.
        </p>
      ))}

      <H2 aside="all times UTC">How did it unfold?</H2>
      <ol className="relative space-y-3 border-l border-border pl-4">
        {e.moments.map((m) => (
          <li key={m.at + m.label} className="min-w-0">
            <span className="absolute -left-[5px] mt-1.5 h-2.5 w-2.5 rounded-full bg-[#ef4444]" aria-hidden="true" />
            <p className="font-mono text-[10px] text-muted-foreground">{utc(m.at)}</p>
            <p className="font-bold text-foreground">{m.label}</p>
            <p className="text-sm text-muted-foreground">
              <q>{m.quote}</q>{" "}
              {m.url && (
                <a href={m.url} target="_blank" rel="noopener noreferrer" className="whitespace-nowrap font-mono text-[10px] underline">
                  {m.author || host(m.url)}
                </a>
              )}
            </p>
          </li>
        ))}
      </ol>

      <H2 aside="matched in every story, post, transcript and comment we read">What are people saying, and is it true?</H2>
      <ul>
        {e.claims.map((c) => (
          <ClaimRow key={c.key} c={c} />
        ))}
      </ul>

      <H2 aside="public posts are shown without their authors' names">Where is it being discussed?</H2>
      <Coverage hours={e.coverage.hours} platforms={talkPlatforms} />
      {tops.length > 0 && (
        <div className="mt-6">
          <div className="flex flex-wrap gap-1.5" role="tablist">
            {tops.map(([p, t]) => (
              <button key={p} type="button" role="tab" aria-selected={active === p} onClick={() => setTab(p)}
                className={`border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] ${active === p ? "border-foreground text-foreground" : "border-border text-muted-foreground hover:text-foreground"}`}>
                {t.label} {t.items.length}
              </button>
            ))}
          </div>
          {active && (
            <ul className="mt-3 divide-y divide-border border-y border-border">
              {e.top[active].items.map((it, i) => (
                <li key={i} className="flex min-w-0 items-baseline gap-2 py-2 text-sm">
                  {it.date && <span className="w-12 shrink-0 font-mono text-[10px] text-muted-foreground">{day(it.date)}</span>}
                  <span className="min-w-0 flex-1 break-words">
                    {it.url ? (
                      <a href={it.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                        {it.title}
                      </a>
                    ) : (
                      it.title
                    )}
                    {(it.meta || it.transcript) && (
                      <span className="block font-mono text-[10px] text-muted-foreground">{[it.meta, it.transcript ? "transcript read" : null].filter(Boolean).join(" · ")}</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <H2>Who is involved?</H2>
      <ul className="grid gap-2 sm:grid-cols-2">
        {e.actors.map((a) => (
          <li key={a.name} className="min-w-0 border border-border p-2.5">
            <p className="font-bold text-foreground">{a.name}</p>
            <p className="text-sm text-muted-foreground">{a.role}</p>
          </li>
        ))}
      </ul>

      <H2>What happens next?</H2>
      <ul className="space-y-3">
        {e.watch.map((w) => (
          <li key={w.label} className="min-w-0 border-l-2 border-[#ef4444] pl-3">
            <p className="font-bold text-foreground">
              {w.label}
              {w.when && <span className="ml-2 font-mono text-[10px] font-normal text-muted-foreground">expected {day(w.when)}</span>}
            </p>
            {w.note && <p className="text-sm text-muted-foreground">{w.note}</p>}
            <p className="text-sm text-muted-foreground">
              <q>{w.quote}</q>{" "}
              {w.url && (
                <a href={w.url} target="_blank" rel="noopener noreferrer" className="font-mono text-[10px] underline">
                  {w.author || host(w.url)}
                </a>
              )}
            </p>
          </li>
        ))}
      </ul>

      <p className="mt-12 border-t border-border pt-4 font-mono text-[10px] leading-relaxed text-muted-foreground">
        How this page is made: every fact, moment and verdict carries the exact words of its source, checked word for word against the stored page before
        publishing. Official statements, investigator reports and news are read in full; posts, videos and threads come from X, YouTube, TikTok, Instagram,
        Reddit and Hacker News, with transcripts for the most-watched videos. Public posts are shown without their authors&apos; names.
      </p>
    </article>
  );
}
