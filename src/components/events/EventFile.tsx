"use client";
import * as React from "react";
import { ExternalLink, FileText, Users } from "lucide-react";
import PageSidebar from "@/components/PageSidebar";
import { EVENTS, type EventClaim, type EventFact, type EventFile as EventFileData, type EventSource, type FactStatus, type Verdict } from "@/data/events";
import { EventSources, PlatformMark } from "./EventSources";

const SITE = "https://venkatapagadala.com";
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
const COLORS: Record<string, string> = { news: "#2563eb", x: "#9ca3af", reddit: "#f97316", youtube: "#ef4444", tiktok: "#06b6d4", instagram: "#c026d3", hackernews: "#d97706", web: "#16a34a", binance: "#eab308" };
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const usd = (v: number) => (v >= 1e9 ? `$${(v / 1e9).toFixed(2)}B` : `$${Math.round(v / 1e6)}M`);
const day = (iso: string | null) => (iso ? `${Number(iso.slice(8, 10))} ${MONTHS[Number(iso.slice(5, 7)) - 1]} ${iso.slice(0, 4)}` : "");
const utc = (iso: string) => `${day(iso)}, ${iso.slice(11, 16)} UTC`;
const host = (u: string | null) => (u ? u.replace(/^https?:\/\/(www\.)?/, "").split("/")[0] : "");

function Section({ id, title, icon, aside, children }: { id: string; title: string; icon?: React.ReactNode; aside?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section id={id} className="mb-12 scroll-mt-28" aria-labelledby={`${id}-h`}>
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <div className="flex items-center gap-2">
          {icon}
          <h2 id={`${id}-h`} className="font-display text-xl font-bold text-foreground">{title}</h2>
        </div>
        {aside && <span className="font-mono text-[10px] text-muted-foreground">{aside}</span>}
      </div>
      {children}
    </section>
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

/** Folded for readers, but in the HTML for crawlers and agents (a details element, not conditional rendering). */
function Sources({ list, label = "Exact words in the source" }: { list: EventSource[]; label?: string }) {
  if (!list.length) return null;
  return (
    <details className="group mt-2">
      <summary className="cursor-pointer list-none font-mono text-[10px] text-muted-foreground underline hover:text-foreground">
        {label} ({list.length})
      </summary>
      <ul className="mt-2 space-y-2">{list.map((s, i) => <Src key={i} s={s} />)}</ul>
    </details>
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
  return (
    <li className="min-w-0 border-b border-border py-4">
      <div className="flex flex-wrap items-start gap-3">
        <span className="mt-0.5 shrink-0 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-white" style={{ background: v.color }}>{v.label}</span>
        <div className="min-w-0 flex-1">
          <p className="font-display text-lg font-bold leading-snug text-foreground">&ldquo;{c.claim}&rdquo;</p>
          <p className="mt-1 text-sm text-muted-foreground">{c.explain}</p>
          <p className="mt-1 font-mono text-[10px] text-muted-foreground">
            {c.spread.total ? `Found in ${c.spread.total} items: ` + Object.entries(c.spread.byPlatform).map(([p, n]) => `${PLATFORM[p] ?? p} ${n}`).join(", ") : "Not found in what we read"}
          </p>
          {(c.examples.length > 0 || c.evidence.length > 0) && (
            <details className="mt-1">
              <summary className="cursor-pointer list-none font-mono text-[10px] text-muted-foreground underline hover:text-foreground">What people said, and the source</summary>
              <div className="mt-2 space-y-2">
                {c.examples.map((x, i) => (
                  <p key={i} className="border-l-2 border-border pl-3 text-sm text-foreground">
                    <span className="mr-1 inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
                      <PlatformMark platform={x.platform} size={10} /> {PLATFORM[x.platform] ?? x.platform}
                      {x.who ? ` · ${x.who}` : ""}
                    </span>
                    {x.url ? <a href={x.url} target="_blank" rel="noopener noreferrer" className="hover:underline">{x.text}</a> : x.text}
                  </p>
                ))}
                <ul className="space-y-2">{c.evidence.map((s, i) => <Src key={i} s={s} />)}</ul>
              </div>
            </details>
          )}
        </div>
      </div>
    </li>
  );
}

function Coverage({ hours }: { hours: [string, Record<string, number>][] }) {
  if (hours.length < 2) return null;
  const platforms = [...new Set(hours.flatMap(([, c]) => Object.keys(c)))];
  const tot = hours.map(([, c]) => Object.values(c).reduce((a, b) => a + b, 0));
  const max = Math.max(1, ...tot);
  return (
    <figure className="mt-8 min-w-0">
      <figcaption className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">When it was published: items per hour (UTC) · peak {max}</figcaption>
      <div className="mt-2 flex h-24 items-end gap-px border-b border-l border-border" role="img" aria-label={`Items published each hour, peak ${max}`}>
        {hours.map(([h, c], i) => (
          <div key={h} className="flex min-w-0 flex-1 flex-col-reverse" style={{ height: `${(tot[i] / max) * 100}%` }} title={`${day(h)} ${h.slice(11, 13)}:00 UTC: ${tot[i]} items`}>
            {platforms.filter((p) => c[p]).map((p) => <div key={p} style={{ height: `${(c[p] / tot[i]) * 100}%`, background: COLORS[p] ?? "#94a3b8" }} />)}
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
            <span className="inline-block h-2 w-2" style={{ background: COLORS[p] ?? "#94a3b8" }} /> {PLATFORM[p] ?? p}
          </li>
        ))}
      </ul>
    </figure>
  );
}

const TOC = [
  { label: "Key Takeaways", id: "takeaways" },
  { label: "Sources at a Glance", id: "sources" },
  { label: "Primary Documents", id: "documents" },
  { label: "What Happened", id: "what-happened" },
  { label: "The Numbers", id: "numbers" },
  { label: "Is It True?", id: "claims" },
  { label: "People in This Story", id: "people" },
  { label: "What Happens Next", id: "next" },
  { label: "Data for AI Agents", id: "data" },
];

export function EventFile({ slug }: { slug: string }) {
  const e: EventFileData | undefined = EVENTS[slug];
  if (!e) return null;
  const url = `${SITE}/notebook/events/${e.slug}`;
  const primary = e.sources.filter((s) => (s.group === "official" || s.group === "investigators") && s.platform !== "x");
  const maxChain = Math.max(...e.money.rows.map((r) => r.usd));
  const files = [
    { href: `/notebook/events/${e.slug}.md`, label: "Markdown", note: "the whole page as text, for language models" },
    { href: `/notebook/events/${e.slug}.json`, label: "JSON", note: "facts, quotes, claims, timeline and every source" },
    { href: `/notebook/events/${e.slug}-sources.csv`, label: "CSV", note: "one row per source" },
    { href: `/notebook/events/${e.slug}.rss.xml`, label: "RSS", note: "new moments as they are added" },
  ];
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:flex lg:gap-10">
      <article className="min-w-0 flex-1 lg:max-w-4xl" data-testid="event-file">
        <p className="mb-3 flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          <span className="border border-[#ef4444] px-2 py-0.5 text-[#ef4444]">Event file</span>
          <span>Updated <time dateTime={e.updatedAt + "Z"}>{utc(e.updatedAt)}</time></span>
        </p>
        <h1 className="mb-4 font-display text-3xl font-bold leading-tight text-foreground sm:text-4xl">{e.title}</h1>
        {e.summary && <p className="mb-3 border-l-2 border-foreground/20 pl-4 font-mono text-sm leading-relaxed text-muted-foreground">{e.summary}</p>}
        <p className="mb-10 font-mono text-[10px] text-muted-foreground">
          Read {e.coverage.items.toLocaleString("en-US")} items: {e.coverage.byPlatform.map((p) => `${p.label} ${p.items}`).join(" · ")}
        </p>

        <Section id="takeaways" title="Key Takeaways" aside="each line opens to the exact words in its source">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {e.facts.map((f) => <FactCard key={f.key} f={f} />)}
          </div>
        </Section>

        <Section id="sources" title="Sources at a Glance" aside="news, videos and posts from every platform">
          <EventSources e={e} />
          <Coverage hours={e.coverage.hours} />
        </Section>

        <Section id="documents" title="Primary Documents" icon={<FileText size={14} className="text-foreground/50" />}>
          <div className="grid gap-3 sm:grid-cols-2">
            {primary.map((d) => (
              <a key={d.id} href={d.url ?? undefined} target="_blank" rel="noopener noreferrer" className="group border border-border p-4 transition-all hover:bg-secondary/20">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="mb-1 font-mono text-xs leading-snug text-foreground">{d.title}</div>
                    <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                      {d.logo && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={d.logo} alt="" width={14} height={14} loading="lazy" className="h-3.5 w-3.5 rounded-sm" />
                      )}
                      {d.publisher || d.domain}
                      {d.date ? `, ${day(d.date)}` : ""}
                    </div>
                  </div>
                  <ExternalLink size={12} className="mt-0.5 flex-shrink-0 text-muted-foreground/70 transition-colors group-hover:text-foreground" />
                </div>
              </a>
            ))}
          </div>
        </Section>

        <Section id="what-happened" title="What Happened" aside="all times UTC">
          <ol className="relative space-y-3 border-l border-border pl-4">
            {e.moments.map((m) => (
              <li key={m.at + m.label} className="min-w-0">
                <span className="absolute -left-[5px] mt-1.5 h-2.5 w-2.5 rounded-full bg-[#ef4444]" aria-hidden="true" />
                <p className="font-mono text-[10px] text-muted-foreground"><time dateTime={m.at}>{utc(m.at)}</time></p>
                <p className="font-bold text-foreground">{m.label}</p>
                <p className="text-sm text-muted-foreground">
                  <q>{m.quote}</q>{" "}
                  {m.url && <a href={m.url} target="_blank" rel="noopener noreferrer" className="whitespace-nowrap font-mono text-[10px] underline">{m.author || host(m.url)}</a>}
                </p>
              </li>
            ))}
          </ol>
        </Section>

        <Section id="numbers" title="The Numbers" aside={e.money.note ?? undefined}>
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
            {e.money.source?.url && <>{" · "}<a href={e.money.source.url} target="_blank" rel="noopener noreferrer" className="underline">{e.money.source.author || host(e.money.source.url)}</a></>}
          </p>
          {e.money.frozen.map((f) => (
            <p key={f.who} className="mt-2 text-sm text-foreground"><span className="font-bold">Frozen: {usd(f.usd)}</span> by {f.who}.</p>
          ))}
        </Section>

        <Section id="claims" title="Is It True? What People Are Saying" aside="matched in every story, post, transcript and comment we read">
          <ul>{e.claims.map((c) => <ClaimRow key={c.key} c={c} />)}</ul>
        </Section>

        <Section id="people" title="People in This Story" icon={<Users size={14} className="text-foreground/50" />}>
          <ul className="grid gap-2 sm:grid-cols-2">
            {e.actors.map((a) => (
              <li key={a.name} className="min-w-0 border border-border p-2.5">
                <p className="font-bold text-foreground">{a.name}</p>
                <p className="text-sm text-muted-foreground">{a.role}</p>
              </li>
            ))}
          </ul>
        </Section>

        <Section id="next" title="What Happens Next">
          <ul className="space-y-3">
            {e.watch.map((w) => (
              <li key={w.label} className="min-w-0 border-l-2 border-[#ef4444] pl-3">
                <p className="font-bold text-foreground">
                  {w.label}
                  {w.when && <span className="ml-2 font-mono text-[10px] font-normal text-muted-foreground">expected <time dateTime={w.when}>{day(w.when)}</time></span>}
                </p>
                {w.note && <p className="text-sm text-muted-foreground">{w.note}</p>}
                <p className="text-sm text-muted-foreground">
                  <q>{w.quote}</q>{" "}
                  {w.url && <a href={w.url} target="_blank" rel="noopener noreferrer" className="font-mono text-[10px] underline">{w.author || host(w.url)}</a>}
                </p>
              </li>
            ))}
          </ul>
        </Section>

        <Section id="data" title="Data for AI Agents and Researchers" aside="free to read and cite, with a link back">
          <ul className="grid gap-2 sm:grid-cols-2">
            {files.map((f) => (
              <li key={f.href}>
                <a href={f.href} className="block border border-border p-3 hover:bg-secondary/20">
                  <span className="font-mono text-xs text-foreground">{f.label}</span>
                  <span className="block font-mono text-[10px] text-muted-foreground">{f.note}</span>
                </a>
              </li>
            ))}
          </ul>
          <p className="mt-3 font-mono text-[10px] leading-relaxed text-muted-foreground">
            How this page is made: every fact, moment and verdict carries the exact words of its source, checked word for word against the stored page before
            publishing. Official statements, investigator reports and news are read in full; posts, videos and threads come from X, YouTube, TikTok, Instagram,
            Reddit and Hacker News, with transcripts for the most-watched videos. Public posts are shown without their authors&apos; names; videos play through
            each platform&apos;s own player. Cite as: {e.title}, Venkata Pagadala, {url}
          </p>
        </Section>
      </article>
      <PageSidebar sections={TOC} shareTitle={e.title} canonicalUrl={url} />
    </div>
  );
}
