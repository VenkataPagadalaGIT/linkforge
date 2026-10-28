"use client";
import * as React from "react";
import { Link } from "@/lib/router-shim";
import { getNode } from "@/data/aiOntology";
import { AI_INTEL, type IntelEvidence } from "@/data/aiIntel";
import { AI_360, type Affiliation, type FundingRound, type Hiring, type InvestorKind, type LegalCase, type Person360, type PersonGroup } from "@/data/ai360";
import { dayMonthYear, monthYear } from "./intelModel";

/**
 * The 360 layer of a company file: who runs it and where else they work, who paid for it round by round,
 * who it is fighting in court, who audits and underwrites it, and who it is hiring. Every line carries the
 * exact sentence from its source. Shared by the dashboard tabs and the full company page.
 */

// ---------------------------------------------------------------------------
// Small parts
// ---------------------------------------------------------------------------

export const has360 = (id: string) => {
  const f = AI_360[id];
  return !!f && (f.people.length > 0 || f.rounds.length > 0 || f.legal.length > 0 || f.facts.length > 0 || !!f.hiring || !!f.site || !!f.attention);
};

/** Money in short form: $124M, $3.5B, $13B, $1.2T. */
export function money(v: number | null | undefined): string {
  if (v == null) return "not stated";
  const t = (x: number) => x.toFixed(1).replace(/\.0$/, "");
  if (v >= 1e12) return `$${t(v / 1e12)}T`;
  if (v >= 1e9) return `$${t(v / 1e9)}B`;
  if (v >= 1e6) return `$${Math.round(v / 1e6)}M`;
  return `$${v.toLocaleString("en-US")}`;
}
const price = (v: number | null) => (v == null ? "" : `$${v >= 100 ? v.toFixed(2) : v.toFixed(2)}`);
const fmt = (v: number) => v.toLocaleString("en-US");
const ym = (s: string | null) => {
  if (!s) return "";
  const [y, m] = s.split("-");
  return m ? monthYear(`${y}-${m}-01`) : y;
};
const span = (a: string | null, b: string | null) => (a && b && a !== b ? `${ym(a)} to ${ym(b)}` : ym(a ?? b));

const H = ({ children, aside, id }: { children: React.ReactNode; aside?: React.ReactNode; id?: string }) => (
  <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1" id={id}>
    <h3 className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">{children}</h3>
    {aside && <span className="font-mono text-[10px] text-muted-foreground">{aside}</span>}
  </div>
);

function Kpis({ items }: { items: [string, string, string?][] }) {
  return (
    <dl className="grid grid-cols-2 gap-px border border-border bg-border sm:grid-cols-4">
      {items.map(([label, value, sub]) => (
        <div key={label} className="bg-background p-3">
          <dt className="font-mono text-[9px] uppercase leading-tight tracking-[0.18em] text-muted-foreground">{label}</dt>
          <dd className="mt-1 font-display text-xl font-bold tabular-nums text-foreground">{value}</dd>
          {sub && <dd className="font-mono text-[9px] text-muted-foreground">{sub}</dd>}
        </div>
      ))}
    </dl>
  );
}

/** The exact sentences behind a line, folded away until asked for. */
export function Quotes({ evidence, label = "Exact text in the source" }: { evidence: IntelEvidence[]; label?: string }) {
  if (!evidence.length) return null;
  return (
    <details className="mt-1.5">
      <summary className="cursor-pointer font-mono text-[10px] text-muted-foreground/80 hover:text-foreground">
        {label}
        {evidence.length > 1 ? ` (${evidence.length})` : ""}
      </summary>
      <ul className="mt-1.5 space-y-1.5">
        {evidence.map((e, i) => (
          <li key={i}>
            <blockquote className="border-l-2 border-border pl-2 font-mono text-[10px] leading-relaxed text-muted-foreground">&ldquo;{e.quote}&rdquo;</blockquote>
            <p className="pl-2.5 font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground/80">
              {e.url ? (
                <a href={e.url} target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
                  {e.source || "Source"}
                  {e.publishedOn ? `, ${dayMonthYear(e.publishedOn)}` : ""} ↗
                </a>
              ) : (
                e.source
              )}
              {e.locator ? ` · ${e.locator}` : ""}
            </p>
          </li>
        ))}
      </ul>
    </details>
  );
}

const initials = (name: string) =>
  name
    .replace(/[“”"].*?[“”"]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .filter((c) => /[A-Za-z]/.test(c))
    .slice(0, 2)
    .join("")
    .toUpperCase();

/** A free-licensed photo with its credit, or initials. Never a scraped headshot. */
export function Avatar({ p, size = 48 }: { p: Pick<Person360, "name" | "photo">; size?: number }) {
  return p.photo ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={p.photo.src}
      alt={p.name}
      width={size}
      height={size}
      loading="lazy"
      className="shrink-0 border border-border bg-foreground/5 object-cover object-top"
      style={{ width: size, height: size }}
      title={`Photo: ${p.photo.credit ?? "see file page"}, ${p.photo.license ?? ""}, via Wikimedia Commons`}
    />
  ) : (
    <span
      className="flex shrink-0 items-center justify-center border border-border bg-foreground/[0.04] font-mono font-bold text-muted-foreground"
      style={{ width: size, height: size, fontSize: size * 0.32 }}
      aria-hidden="true"
    >
      {initials(p.name)}
    </span>
  );
}

/** An organization the graph knows: in the dashboard it re-focuses the graph; on a page it opens that entity's page. */
function EntityLink({ id, onPick, className, title, children }: { id: string | null; onPick?: (id: string) => void; className: string; title?: string; children: React.ReactNode }) {
  if (!id || !getNode(id)) return <span className={className.replace(/underline\S*|decoration-\S+|hover:\S+/g, "")} title={title}>{children}</span>;
  return onPick ? (
    <button type="button" onClick={() => onPick(id)} className={className} title={title}>
      {children}
    </button>
  ) : (
    <Link to={`/notebook/ai/map/${id}`} className={className} title={title}>
      {children}
    </Link>
  );
}

function OrgName({ a, onPick }: { a: Pick<Affiliation, "org" | "entity">; onPick?: (id: string) => void }) {
  return (
    <EntityLink id={a.entity} onPick={onPick} className="font-bold text-foreground underline decoration-dotted underline-offset-2 hover:decoration-solid">
      {a.org}
    </EntityLink>
  );
}

// ---------------------------------------------------------------------------
// People
// ---------------------------------------------------------------------------

const GROUPS: { id: PersonGroup; label: string }[] = [
  { id: "officer", label: "Executive officers" },
  { id: "director", label: "Board of directors" },
  { id: "founder", label: "Co-founders" },
  { id: "trustee", label: "Long-Term Benefit Trust" },
  { id: "leader", label: "Leaders" },
  { id: "former_director", label: "Former directors" },
];
const KIND_WORD: Record<string, string> = {
  executive: "Executive",
  director: "Board",
  founder: "Founder",
  trustee: "Trustee",
  employee: "Worked at",
  investor: "Investor at",
  advisor: "Adviser",
  government: "Government",
  academic: "Academic",
  nonprofit: "Nonprofit",
};

function PersonCard({ p, onPick }: { p: Person360; onPick?: (id: string) => void }) {
  const [all, setAll] = React.useState(false);
  const aff = [...p.affiliations].sort((a, b) => Number(b.current) - Number(a.current));
  const shown = all ? aff : aff.slice(0, 3);
  return (
    <li className="flex gap-3 border border-border p-3" data-testid="ai-person">
      <Avatar p={p} />
      <div className="min-w-0 flex-1 font-mono text-[11px]">
        {p.sitePath ? (
          <Link to={p.sitePath} className="font-display text-sm font-bold text-foreground hover:underline">
            {p.name}
          </Link>
        ) : (
          <span className="font-display text-sm font-bold text-foreground">{p.name}</span>
        )}
        <p className="leading-snug text-foreground/85">{p.role}</p>
        {shown.length > 0 && (
          <ul className="mt-1.5 space-y-0.5 text-[10px] leading-snug text-muted-foreground">
            {shown.map((a, i) => (
              <li key={i}>
                {a.current && <span className="mr-1 border border-emerald-600/40 px-1 text-[8px] uppercase tracking-[0.15em] text-emerald-700 dark:text-emerald-300">Now</span>}
                <OrgName a={a} onPick={onPick} /> · {a.title}
                {a.period && a.period !== "current" ? ` · ${a.period}` : ""}
              </li>
            ))}
            {aff.length > 3 && (
              <li>
                <button type="button" onClick={() => setAll(!all)} className="underline decoration-dotted hover:text-foreground">
                  {all ? "Fewer" : `+${aff.length - 3} more roles`}
                </button>
              </li>
            )}
          </ul>
        )}
        <Quotes evidence={[...p.evidence, ...p.affiliations.flatMap((a) => a.evidence)].filter((e, i, xs) => xs.findIndex((x) => x.quote === e.quote) === i)} />
        {p.photo && (
          <p className="mt-1 text-[9px] text-muted-foreground/70">
            Photo:{" "}
            <a href={p.photo.page ?? undefined} target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
              {p.photo.credit}, {p.photo.license}, Wikimedia Commons
            </a>
          </p>
        )}
      </div>
    </li>
  );
}

export function PeopleSection({ ids, onPick }: { ids: string[]; onPick?: (id: string) => void }) {
  const people = ids.flatMap((id) => (AI_360[id]?.people ?? []).map((p) => ({ ...p, at: id })));
  if (!people.length) return null;
  const single = ids.length === 1;
  const orgs = new Set(people.flatMap((p) => p.affiliations.map((a) => a.org)));
  const photos = people.filter((p) => p.photo).length;
  return (
    <div className="space-y-4" data-testid="ai-people">
      <H aside={`${people.length} people · ${orgs.size} other organizations · ${photos} free-licensed photos`}>People in public roles</H>
      {GROUPS.map((g) => {
        const ps = people.filter((p) => p.group === g.id);
        if (!ps.length) return null;
        return (
          <div key={g.id}>
            <p className="mb-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-foreground">
              {g.label} <span className="font-normal text-muted-foreground">{ps.length}</span>
            </p>
            <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {ps.map((p) => (
                <React.Fragment key={p.slug}>
                  {!single && <li className="sr-only">{getNode(p.at)?.name}</li>}
                  <PersonCard p={p} onPick={onPick} />
                </React.Fragment>
              ))}
            </ul>
          </div>
        );
      })}
      <p className="font-mono text-[10px] leading-relaxed text-muted-foreground">
        Names, titles and other roles come from the company&apos;s own filings and announcements, with the exact sentence for each. Photos are free-licensed files from
        Wikimedia Commons with their credit; people without one show initials. Staff are not listed by name, and personal profiles are never scraped.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Hiring
// ---------------------------------------------------------------------------

const BOARD_NAME: Record<string, string> = { greenhouse: "Greenhouse", ashby: "Ashby", lever: "Lever" };
const boardLabel = (b: string | null) => (b ? `${BOARD_NAME[b.split(":")[0]] ?? b.split(":")[0]} job board` : "job board");

function Bars({ rows, total }: { rows: { name: string; count: number }[]; total: number }) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <ul className="space-y-1">
      {rows.map((r) => (
        <li key={r.name} className="grid grid-cols-[minmax(0,11.5rem)_minmax(0,1fr)_3.2rem] items-center gap-2 font-mono text-[11px]">
          <span className="truncate text-foreground" title={r.name}>
            {r.name}
          </span>
          <span className="block h-1.5 bg-foreground/10" aria-hidden="true">
            <span className="block h-full bg-foreground/60" style={{ width: `${Math.max(2, (r.count / max) * 100)}%` }} />
          </span>
          <span className="text-right tabular-nums text-muted-foreground" title={`${Math.round((r.count / total) * 100)}% of open roles`}>
            {fmt(r.count)}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function HiringSection({ id }: { id: string }) {
  const h: Hiring | null | undefined = AI_360[id]?.hiring;
  if (!h) return null;
  const remote = h.workplace["Remote"] ?? 0;
  const friendly = h.workplace["Remote-friendly"] ?? 0;
  return (
    <div className="space-y-4" data-testid="ai-hiring">
      <H aside={`${boardLabel(h.board)} · read ${dayMonthYear(h.asOf)}`}>Hiring now</H>
      <Kpis
        items={[
          ["Open roles", fmt(h.open), "on the public job board"],
          ["New in 30 days", fmt(h.new30), `${Math.round((h.new30 / h.open) * 100)}% of open roles`],
          ["Teams hiring", fmt(h.teamCount), "as the board names them"],
          remote || !friendly ? ["Fully remote", remote ? fmt(remote) : "none stated", "roles the board marks remote"] : ["Remote-friendly", fmt(friendly), "none marked fully remote"],
        ]}
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <div>
          <H aside="from role titles">What they hire for</H>
          <Bars rows={h.themes.map((t) => ({ name: t.label, count: t.count }))} total={h.open} />
        </div>
        <div>
          <H>Biggest teams</H>
          <Bars rows={h.teams} total={h.open} />
        </div>
        <div>
          <H aside="every city a posting names">Where</H>
          <Bars rows={h.cities} total={h.open} />
        </div>
      </div>
      <div>
        <H aside="newest first">Latest roles</H>
        <ol className="divide-y divide-border border border-border">
          {h.latest.map((r) => (
            <li key={r.url} className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-3 px-3 py-1.5 font-mono text-[11px] sm:grid-cols-[6.5rem_minmax(0,1fr)_minmax(0,12rem)]">
              <span className="tabular-nums text-muted-foreground">{r.published ? dayMonthYear(r.published) : ""}</span>
              <a href={r.url} target="_blank" rel="noopener noreferrer" className="min-w-0 truncate text-foreground hover:underline">
                {r.title} ↗
              </a>
              <span className="hidden truncate text-muted-foreground sm:block">{[r.team, r.location].filter(Boolean).join(" · ")}</span>
            </li>
          ))}
        </ol>
      </div>
      <p className="font-mono text-[10px] leading-relaxed text-muted-foreground">
        Every open role on the company&apos;s public {boardLabel(h.board)}, the page it publishes for its careers site
        {h.careersUrl && (
          <>
            {" "}
            (
            <a href={h.careersUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
              careers ↗
            </a>
            )
          </>
        )}
        . Roles, not people. Themes are matched from words in role titles, so they are approximate. Roles that come off the board are tracked from {dayMonthYear(h.trackedSince)}
        {h.closed30 != null ? `; ${fmt(h.closed30)} closed in the last 30 days.` : ", so closed-role counts appear after a month of history."}
      </p>
    </div>
  );
}

/** Who is hiring across the companies in view: size, momentum and what for. */
export function HiringTable({ ids, onPick }: { ids: string[]; onPick: (id: string) => void }) {
  const rows = ids
    .filter((id) => AI_360[id]?.hiring)
    .map((id) => {
      const h = AI_360[id]!.hiring!;
      const t = Object.fromEntries(h.themes.map((x) => [x.key, x.count]));
      const pct = (n: number) => Math.round((n / h.open) * 100);
      return { id, h, top: h.themes.find((x) => x.key !== "other")!, sales: pct(t.gtm ?? 0), research: pct(t.research ?? 0), build: pct((t.datacenters ?? 0) + (t.chips ?? 0)) };
    })
    .sort((a, b) => b.h.open - a.h.open);
  if (!rows.length) return null;
  return (
    <div data-testid="ai-hiring-table">
      <H aside={`${rows.length} companies with public job boards`}>Who is hiring in AI</H>
      <div className="overflow-x-auto border border-border">
        <table className="w-full min-w-[640px] font-mono text-[11px]">
          <thead className="text-left text-[9px] uppercase tracking-[0.15em] text-muted-foreground">
            <tr className="border-b border-border">
              <th className="px-3 py-2 font-normal">Company</th>
              <th className="px-2 py-2 text-right font-normal">Open</th>
              <th className="px-2 py-2 text-right font-normal">New 30d</th>
              <th className="px-2 py-2 font-normal">Biggest theme</th>
              <th className="px-2 py-2 text-right font-normal" title="Sales, partnerships and customer roles">Sales</th>
              <th className="px-2 py-2 text-right font-normal">Research</th>
              <th className="px-2 py-2 text-right font-normal" title="Data centers, compute, chips and hardware">Build-out</th>
              <th className="px-3 py-2 font-normal">Top city</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="px-3 py-1.5">
                  <button type="button" onClick={() => onPick(r.id)} className="font-bold text-foreground hover:underline">
                    {getNode(r.id)?.name ?? r.id}
                  </button>
                </td>
                <td className="px-2 py-1.5 text-right tabular-nums text-foreground">{fmt(r.h.open)}</td>
                <td className="px-2 py-1.5 text-right tabular-nums text-foreground">{fmt(r.h.new30)}</td>
                <td className="px-2 py-1.5 text-foreground/85">{r.top?.label}</td>
                <td className="px-2 py-1.5 text-right tabular-nums">{r.sales}%</td>
                <td className="px-2 py-1.5 text-right tabular-nums">{r.research}%</td>
                <td className="px-2 py-1.5 text-right tabular-nums">{r.build}%</td>
                <td className="px-3 py-1.5 text-muted-foreground">{r.h.cities[0]?.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 font-mono text-[10px] text-muted-foreground">
        Shares are of each company&apos;s open roles; themes come from role titles. Build-out means data centers, compute, chips and hardware.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Investors
// ---------------------------------------------------------------------------

export const INVESTOR_KIND: Record<InvestorKind, { label: string; color: string }> = {
  individual: { label: "Individuals", color: "#f59e0b" },
  nonprofit: { label: "Nonprofits", color: "#94a3b8" },
  venture: { label: "Venture capital", color: "#10b981" },
  growth: { label: "Growth and private equity", color: "#06b6d4" },
  corporate: { label: "Corporations", color: "#f97316" },
  asset_manager: { label: "Asset managers and banks", color: "#6366f1" },
  hedge_fund: { label: "Hedge funds and trading firms", color: "#a855f7" },
  sovereign: { label: "Sovereign and pension funds", color: "#ec4899" },
  other: { label: "Other", color: "#64748b" },
};
const KIND_ORDER = Object.keys(INVESTOR_KIND) as InvestorKind[];
const ROUND_KIND: Record<FundingRound["kind"], string> = {
  priced_round: "Priced round",
  note_conversion: "Notes converted",
  safe_conversion: "SAFEs converted",
  secondary_resale: "Shares resold",
  convertible_note: "Convertible notes",
  strategic_commitment: "Strategic investment",
  ipo: "IPO filing",
};
/** The same investor written two ways in two announcements. */
const SAME: Record<string, string> = { "Jim McClave": "James McClave", "Altimeter Capital": "Altimeter", "D.E. Shaw Ventures": "D. E. Shaw Ventures" };
const canon = (n: string) => SAME[n] ?? n;
const shortRound = (r: FundingRound) => (r.round.startsWith("Series ") ? r.round.slice(7) : `${r.round.split(" ")[0]} ’${(r.started ?? "").slice(2, 4)}`);

/** Price per share at each priced round, on a log scale: what an early share became. */
function PriceLadder({ rounds }: { rounds: FundingRound[] }) {
  const pts = rounds.filter((r) => r.kind === "priced_round" && r.voting && r.pricePerShare && r.started);
  const ref = React.useRef<HTMLDivElement>(null);
  const [W, setW] = React.useState(640);
  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setW(Math.max(300, Math.round(el.clientWidth))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  if (pts.length < 2) return null;
  const t = (s: string) => new Date(`${s}-15T00:00:00Z`).getTime();
  const t0 = t(pts[0].started!), t1 = t(pts[pts.length - 1].started!);
  const Hh = 230, L = 52, R = 64, T = 26, B = 28;
  const x = (s: string) => L + ((t(s) - t0) / Math.max(1, t1 - t0)) * (W - L - R);
  const lo = Math.floor(Math.log10(Math.min(...pts.map((p) => p.pricePerShare!))));
  const hi = Math.ceil(Math.log10(Math.max(...pts.map((p) => p.pricePerShare!))));
  const y = (v: number) => T + (1 - (Math.log10(v) - lo) / Math.max(1, hi - lo)) * (Hh - T - B);
  const path = pts.map((p, i) => `${i ? "L" : "M"}${x(p.started!).toFixed(1)},${y(p.pricePerShare!).toFixed(1)}`).join(" ");
  const first = pts[0], last = pts[pts.length - 1];
  // On a phone the points sit close together: letters only; the list below carries the prices.
  const compact = W < 560;
  const years = Array.from({ length: Number(last.started!.slice(0, 4)) - Number(first.started!.slice(0, 4)) + 1 }, (_, i) => Number(first.started!.slice(0, 4)) + i);
  return (
    <figure className="border border-border p-3">
      <H aside={`${price(first.pricePerShare)} to ${price(last.pricePerShare)} · ${Math.round(last.pricePerShare! / first.pricePerShare!)}x`}>Price per share, round by round</H>
      <div ref={ref} className="w-full">
      <svg width={W} height={Hh} viewBox={`0 0 ${W} ${Hh}`} className="block" role="img" aria-label={`Price per preferred share rose from ${price(first.pricePerShare)} in the ${first.round} to ${price(last.pricePerShare)} in the ${last.round}.`}>
        {Array.from({ length: hi - lo + 1 }, (_, i) => 10 ** (lo + i)).map((v) => (
          <g key={v}>
            <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke="currentColor" strokeOpacity={0.12} />
            <text x={L - 6} y={y(v) + 3} textAnchor="end" className="fill-muted-foreground font-mono" fontSize={9}>
              ${v >= 1 ? v.toLocaleString("en-US") : v}
            </text>
          </g>
        ))}
        {years.map((yr) => {
          const s = `${yr}-01`;
          if (t(s) < t0 || t(s) > t1) return null;
          return (
            <text key={yr} x={x(s)} y={Hh - 8} textAnchor="middle" className="fill-muted-foreground font-mono" fontSize={9}>
              {yr}
            </text>
          );
        })}
        <path d={path} fill="none" stroke="#10b981" strokeWidth={2} />
        {pts.map((p) => (
          <g key={p.slug}>
            <circle cx={x(p.started!)} cy={y(p.pricePerShare!)} r={4} fill="#10b981" />
            <text x={x(p.started!)} y={y(p.pricePerShare!) - 9} textAnchor="middle" className="fill-foreground font-mono" fontSize={10} fontWeight={700}>
              {compact ? shortRound(p) : `${shortRound(p)} ${price(p.pricePerShare)}`}
            </text>
            {p.postMoney && !compact && (
              <text x={x(p.started!)} y={y(p.pricePerShare!) + 16} textAnchor="middle" className="fill-muted-foreground font-mono" fontSize={8.5}>
                {money(p.postMoney)} post
              </text>
            )}
          </g>
        ))}
      </svg>
      </div>
      <figcaption className="font-mono text-[10px] text-muted-foreground">Original issue price of each round&apos;s preferred stock, from the S-1; valuations are post-money, from the company&apos;s announcements.</figcaption>
    </figure>
  );
}

function RoundRow({ r, onPick }: { r: FundingRound; onPick?: (id: string) => void }) {
  const leads = r.who.filter((w) => w.role !== "participant");
  const rest = r.who.filter((w) => w.role === "participant");
  return (
    <li className="border border-border p-3" data-testid="ai-round">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 font-mono">
        <p className="text-[12px] text-foreground">
          <span className="font-display text-sm font-bold">{r.round}</span>
          {r.tranche && r.tranche !== r.round.slice(-1) && <span className="ml-1.5 text-[10px] text-muted-foreground">{r.tranche}</span>}
          <span className="ml-2 border border-border px-1 text-[9px] uppercase tracking-[0.12em] text-muted-foreground">{ROUND_KIND[r.kind]}</span>
          {!r.voting && <span className="ml-1 border border-border px-1 text-[9px] uppercase tracking-[0.12em] text-muted-foreground">Non-voting</span>}
        </p>
        <p className="text-[11px] tabular-nums text-muted-foreground">{r.announcedOn ? dayMonthYear(r.announcedOn) : span(r.started, r.ended)}</p>
      </div>
      <p className="mt-1 font-mono text-[11px] text-foreground">
        <span className="font-bold">{r.amount != null ? `${r.qualifier && r.qualifier !== "approximately" ? `${r.qualifier} ` : ""}${money(r.amount)}` : "Amount not stated"}</span>
        {r.pricePerShare != null && <span className="text-muted-foreground"> · {price(r.pricePerShare)} a share</span>}
        {r.postMoney != null && <span className="text-muted-foreground"> · {money(r.postMoney)} post-money</span>}
        {r.investors != null && <span className="text-muted-foreground"> · {fmt(r.investors)} investor{r.investors === 1 ? "" : "s"}</span>}
      </p>
      <p className="mt-0.5 font-mono text-[11px] leading-snug text-foreground/80">{r.summary}</p>
      {leads.length > 0 && (
        <p className="mt-1 font-mono text-[10px] text-muted-foreground">
          {r.kind === "strategic_commitment" ? "From" : "Led by"}{" "}
          {leads.map((w, i) => (
            <React.Fragment key={w.name}>
              {i > 0 && ", "}
              <EntityLink id={w.entity} onPick={onPick} className="text-foreground underline decoration-dotted hover:decoration-solid">
                {w.name}
              </EntityLink>
              {w.role === "co_lead" && <span> (co-lead)</span>}
            </React.Fragment>
          ))}
        </p>
      )}
      {rest.length > 0 && (
        <details className="mt-1">
          <summary className="cursor-pointer font-mono text-[10px] text-muted-foreground hover:text-foreground">{rest.length} other named investors</summary>
          <p className="mt-1 font-mono text-[10px] leading-relaxed text-muted-foreground">{rest.map((w) => w.name).join(" · ")}</p>
        </details>
      )}
      <Quotes evidence={r.evidence} />
    </li>
  );
}

/** Investors who came back, round by round: L led, C co-led, a dot took part. */
function InvestorMatrix({ rounds }: { rounds: FundingRound[] }) {
  const cols = rounds.filter((r) => r.who.length > 0);
  const cells = new Map<string, Map<string, string>>();
  const kindOf = new Map<string, InvestorKind>();
  for (const r of cols)
    for (const w of r.who) {
      const n = canon(w.name);
      kindOf.set(n, w.kind);
      if (!cells.has(n)) cells.set(n, new Map());
      cells.get(n)!.set(r.slug, w.role === "lead" ? "L" : w.role === "co_lead" ? "C" : "•");
    }
  const repeat = [...cells.entries()].filter(([, m]) => m.size > 1).sort((a, b) => b[1].size - a[1].size || a[0].localeCompare(b[0]));
  if (!repeat.length) return null;
  return (
    <div>
      <H aside={`${cells.size} named investors · ${repeat.length} came back`}>Investors who came back</H>
      <div className="overflow-x-auto border border-border">
        <table className="font-mono text-[10px]">
          <thead>
            <tr className="border-b border-border text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
              <th className="px-3 py-1.5 text-left font-normal">Investor</th>
              {cols.map((r) => (
                <th key={r.slug} className="w-12 px-1.5 py-1.5 text-center font-normal" title={r.round}>
                  {shortRound(r)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {repeat.map(([name, m]) => (
              <tr key={name}>
                <td className="whitespace-nowrap px-3 py-1 text-foreground">
                  <span className="mr-1.5 inline-block h-2 w-2" style={{ background: INVESTOR_KIND[kindOf.get(name)!].color }} aria-hidden="true" />
                  {name}
                </td>
                {cols.map((r) => (
                  <td key={r.slug} className={`px-1.5 py-1 text-center ${m.get(r.slug) === "L" || m.get(r.slug) === "C" ? "font-bold text-foreground" : "text-muted-foreground"}`}>
                    {m.get(r.slug) ?? ""}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-1 font-mono text-[10px] text-muted-foreground">L led · C co-led · • took part. Named investors only: announcements name the leads and the larger investors, not all of them.</p>
    </div>
  );
}

/** Who wrote the cheques, by type, round by round: the move from people to funds to states. */
function InvestorMix({ rounds }: { rounds: FundingRound[] }) {
  const cols = rounds.filter((r) => r.who.length > 0 && (r.kind === "priced_round" || r.kind === "strategic_commitment"));
  if (cols.length < 2) return null;
  return (
    <div>
      <H aside="named investors in each round, by type">From people to funds to states</H>
      <ul className="space-y-1">
        {cols.map((r) => {
          const n = r.who.length;
          const by = KIND_ORDER.map((k) => [k, r.who.filter((w) => w.kind === k).length] as const).filter(([, c]) => c > 0);
          return (
            <li key={r.slug} className="grid grid-cols-[5.5rem_minmax(0,1fr)_2rem] items-center gap-2 font-mono text-[10px]">
              <span className="truncate text-foreground" title={r.round}>
                {shortRound(r)} {r.round.startsWith("Series ") && <span className="text-muted-foreground">{(r.started ?? "").slice(0, 4)}</span>}
              </span>
              <span className="flex h-3 w-full overflow-hidden bg-foreground/10" aria-label={by.map(([k, c]) => `${INVESTOR_KIND[k].label} ${c}`).join(", ")}>
                {by.map(([k, c]) => (
                  <span key={k} title={`${INVESTOR_KIND[k].label}: ${c}`} style={{ width: `${(c / n) * 100}%`, background: INVESTOR_KIND[k].color }} />
                ))}
              </span>
              <span className="text-right tabular-nums text-muted-foreground">{n}</span>
            </li>
          );
        })}
      </ul>
      <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[10px] text-muted-foreground">
        {KIND_ORDER.filter((k) => cols.some((r) => r.who.some((w) => w.kind === k))).map((k) => (
          <span key={k}>
            <span className="mr-1 inline-block h-2 w-2" style={{ background: INVESTOR_KIND[k].color }} aria-hidden="true" />
            {INVESTOR_KIND[k].label}
          </span>
        ))}
      </p>
      <p className="mt-1 font-mono text-[10px] text-muted-foreground">Investor type is our own classification of each named investor.</p>
    </div>
  );
}

export function InvestorsSection({ id, onPick }: { id: string; onPick?: (id: string) => void }) {
  const rounds = AI_360[id]?.rounds ?? [];
  if (!rounds.length) return null;
  const pre = rounds.filter((r) => r.stage === "pre_public");
  const ipo = rounds.filter((r) => r.stage === "ipo");
  const post = rounds.filter((r) => r.stage === "post_public");
  const raised = AI_INTEL[id]?.series.find((s) => s.metric === "capital_raised_total_usd")?.points.slice(-1)[0];
  const lastPriced = [...pre].reverse().find((r) => r.postMoney);
  const priced = pre.filter((r) => r.kind === "priced_round" && r.voting && r.pricePerShare);
  const named = new Set(pre.flatMap((r) => r.who.map((w) => canon(w.name))));
  return (
    <div className="space-y-5" data-testid="ai-investors">
      <Kpis
        items={[
          ["Capital raised", raised ? money(raised.value) : "see rounds", raised ? `to ${monthYear(raised.asOf ?? raised.period)}, per the S-1` : undefined],
          ["Latest valuation", lastPriced ? money(lastPriced.postMoney) : "not stated", lastPriced ? `${lastPriced.round}, post-money` : undefined],
          ["Price per share", priced.length > 1 ? `${Math.round(priced[priced.length - 1].pricePerShare! / priced[0].pricePerShare!)}x` : "", priced.length > 1 ? `${price(priced[0].pricePerShare)} to ${price(priced[priced.length - 1].pricePerShare)}` : undefined],
          ["Named investors", fmt(named.size), `${fmt(Math.max(...pre.map((r) => r.investors ?? 0)))} in the largest round`],
        ]}
      />
      <PriceLadder rounds={pre} />
      <div>
        <H aside={`${pre.length} financings, oldest first`}>Before going public</H>
        <ol className="space-y-2">
          {pre.map((r) => (
            <RoundRow key={r.slug} r={r} onPick={onPick} />
          ))}
        </ol>
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <InvestorMatrix rounds={pre} />
        <InvestorMix rounds={pre} />
      </div>
      {ipo.length > 0 && (
        <div>
          <H>Going public</H>
          <ol className="space-y-2">
            {ipo.map((r) => (
              <RoundRow key={r.slug} r={r} onPick={onPick} />
            ))}
          </ol>
        </div>
      )}
      <div className="border border-dashed border-border p-3 font-mono text-[11px] leading-relaxed text-muted-foreground">
        <p className="font-bold uppercase tracking-[0.18em] text-foreground text-[10px]">After listing</p>
        {post.length ? (
          <p>{post.length} filings since the listing.</p>
        ) : (
          <p>Once the shares trade, holders come from SEC filings: institutions&apos; quarterly 13F holdings, insiders&apos; Form 4 trades and the proxy&apos;s ownership table.</p>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Legal
// ---------------------------------------------------------------------------

const LEGAL_KIND: Record<string, string> = { government: "Government actions", copyright: "Copyright", contract: "Contract and data", consumer: "Consumer", regulatory: "Regulatory inquiries" };
const LEGAL_ROLE: Record<string, string> = { plaintiff: "Brought by the company", petitioner: "Brought by the company", defendant: "Against the company", respondent: "Against the company", subject: "Inquiry" };

export function LegalSection({ ids, onPick }: { ids: string[]; onPick?: (id: string) => void }) {
  const cases = ids.flatMap((id) => (AI_360[id]?.legal ?? []).map((c) => ({ ...c, at: id })));
  if (!cases.length) return null;
  const settled = cases.filter((c) => /settled/i.test(c.status));
  const brought = cases.filter((c) => c.role === "plaintiff" || c.role === "petitioner");
  const largest = Math.max(0, ...cases.map((c) => c.amount ?? 0));
  const kinds = Object.keys(LEGAL_KIND).filter((k) => cases.some((c) => c.kind === k));
  return (
    <div className="space-y-5" data-testid="ai-legal">
      <Kpis
        items={[
          ["Matters disclosed", fmt(cases.length), ids.length === 1 ? "as the company lists them" : `across ${new Set(cases.map((c) => c.at)).size} companies`],
          ["Brought by the company", fmt(brought.length), "as plaintiff or petitioner"],
          ["Settled", fmt(settled.length), settled.length ? settled.map((c) => c.name.split(",")[0]).join(", ") : undefined],
          ["Largest settlement", largest ? money(largest) : "none", largest ? "approved by the court" : undefined],
        ]}
      />
      {kinds.map((k) => (
        <div key={k}>
          <H aside={`${cases.filter((c) => c.kind === k).length}`}>{LEGAL_KIND[k]}</H>
          <ul className="grid gap-2 lg:grid-cols-2">
            {cases
              .filter((c) => c.kind === k)
              .map((c: LegalCase & { at: string }) => (
                <li key={c.slug} className="border border-border p-3 font-mono text-[11px]" data-testid="ai-legal-case">
                  <p className="font-display text-sm font-bold leading-snug text-foreground">{c.name}</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">
                    {LEGAL_ROLE[c.role] ?? c.role}
                    {c.court ? ` · ${c.court}` : ""}
                    {c.filed ? ` · filed ${ym(c.filed)}` : ""}
                    {ids.length > 1 && (
                      <>
                        {" · "}
                        <button type="button" onClick={() => onPick?.(c.at)} className="underline decoration-dotted hover:text-foreground">
                          {getNode(c.at)?.name}
                        </button>
                      </>
                    )}
                  </p>
                  <p className="mt-1.5 text-foreground">
                    <span className="mr-1 text-[9px] uppercase tracking-[0.15em] text-muted-foreground">Status</span>
                    {c.status}
                  </p>
                  <p className="mt-1 leading-snug text-foreground/80">{c.summary}</p>
                  {c.counterparties.length > 0 && <p className="mt-1 text-[10px] text-muted-foreground">Other side: {c.counterparties.join(" · ")}</p>}
                  <Quotes evidence={c.evidence} />
                </li>
              ))}
          </ul>
        </div>
      ))}
      <p className="font-mono text-[10px] leading-relaxed text-muted-foreground">
        As the company describes each matter in its own filing. Claims are allegations, and the company disputes wrongdoing where it says so. Court dockets, with every filing
        and ruling, come next from public court records.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Advisors and identity facts
// ---------------------------------------------------------------------------

export function AdvisorsSection({ id }: { id: string }) {
  const adv = AI_360[id]?.advisors ?? [];
  if (!adv.length) return null;
  const banks = adv.filter((a) => a.role === "Underwriter");
  const named = adv.filter((a) => a.role !== "Underwriter");
  return (
    <div data-testid="ai-advisors">
      <H aside={`${adv.length} named in the S-1`}>Auditors, counsel and underwriters</H>
      <ul className="divide-y divide-border border border-border">
        {named.map((a) => (
          <li key={a.org + a.role} className="grid grid-cols-[minmax(0,1fr)] gap-1 px-3 py-2 font-mono text-[11px] sm:grid-cols-[minmax(0,16rem)_minmax(0,1fr)] sm:gap-3">
            <span className={`font-bold ${a.current ? "text-foreground" : "text-muted-foreground line-through decoration-foreground/30"}`}>{a.org}</span>
            <span className="text-foreground/85">
              {a.role}
              {a.since ? ` · since ${a.since}` : ""}
              {a.until ? ` · until ${a.until}` : ""}
              <Quotes evidence={a.evidence} />
            </span>
          </li>
        ))}
        {banks.length > 0 && (
          <li className="px-3 py-2 font-mono text-[11px]">
            <span className="font-bold text-foreground">{banks.length} more underwriters: </span>
            <span className="text-foreground/85">{banks.map((b) => b.org).join(" · ")}</span>
            <Quotes evidence={banks[0].evidence} />
          </li>
        )}
      </ul>
    </div>
  );
}

export function FactsSection({ id }: { id: string }) {
  const facts = AI_360[id]?.facts ?? [];
  if (!facts.length) return null;
  return (
    <dl className="grid gap-px border border-border bg-border sm:grid-cols-2 xl:grid-cols-4" data-testid="ai-facts">
      {facts.map((f) => (
        <div key={f.key} className="bg-background p-3">
          <dt className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">{f.label}</dt>
          <dd className="mt-1 font-mono text-[11px] leading-snug text-foreground">{f.value}</dd>
          <dd>
            <Quotes evidence={f.evidence} label="Source" />
          </dd>
        </div>
      ))}
    </dl>
  );
}

// ---------------------------------------------------------------------------
// Inside and outside: how the company connects, through its people and its deals
// ---------------------------------------------------------------------------

type OutGroup = { key: string; label: string; items: { name: string; entity: string | null; people: string[]; note?: string }[] };

function outsideOf(id: string): OutGroup[] {
  const f = AI_360[id];
  const intel = AI_INTEL[id];
  const groups: OutGroup[] = [];
  // Where its people work or worked: one row per organization, with the people who link to it.
  const byOrg = new Map<string, { name: string; entity: string | null; people: Set<string> }>();
  for (const p of f?.people ?? [])
    for (const a of p.affiliations) {
      const k = a.org;
      if (!byOrg.has(k)) byOrg.set(k, { name: a.org, entity: a.entity, people: new Set() });
      byOrg.get(k)!.people.add(p.slug);
    }
  const orgs = [...byOrg.values()].sort((a, b) => b.people.size - a.people.size || a.name.localeCompare(b.name));
  if (orgs.length) groups.push({ key: "people", label: "Where its people work or worked", items: orgs.map((o) => ({ name: o.name, entity: o.entity, people: [...o.people] })) });
  // Money in: leads of each round, plus strategic investors.
  const inv = new Map<string, { name: string; entity: string | null }>();
  for (const r of f?.rounds ?? []) for (const w of r.who) if (w.role !== "participant" || w.entity) inv.set(canon(w.name), { name: canon(w.name), entity: w.entity });
  if (inv.size) groups.push({ key: "investors", label: "Investors that led or are strategic", items: [...inv.values()].map((x) => ({ ...x, people: [] })) });
  // Deals: who it buys compute from and who it sells to, from the graph's deals.
  const buys = (intel?.deals ?? []).filter((d) => d.side === "buys").map((d) => ({ name: d.counterpartyName, entity: d.counterparty, people: [] as string[] }));
  const uniq = <T extends { name: string }>(xs: T[]) => xs.filter((x, i) => xs.findIndex((y) => y.name === x.name) === i);
  if (buys.length) groups.push({ key: "suppliers", label: "Compute and suppliers", items: uniq(buys) });
  const adv = (f?.advisors ?? []).filter((a) => a.role !== "Underwriter" && a.current);
  if (adv.length) groups.push({ key: "advisors", label: "Auditor and counsel", items: adv.map((a) => ({ name: a.org, entity: a.entity, people: [], note: a.role })) });
  const opp = uniq((f?.legal ?? []).flatMap((c) => c.counterparties.slice(0, 2).map((n) => ({ name: n, entity: null, people: [] as string[], note: c.name }))));
  if (opp.length) groups.push({ key: "legal", label: "On the other side in court", items: opp.slice(0, 10) });
  return groups;
}

const GROUP_COLOR: Record<string, string> = { people: "#10b981", investors: "#ec4899", suppliers: "#06b6d4", advisors: "#94a3b8", legal: "#f59e0b" };

export function InsideOutMap({ id, onPick }: { id: string; onPick?: (id: string) => void }) {
  const f = AI_360[id];
  const box = React.useRef<HTMLDivElement>(null);
  const [lines, setLines] = React.useState<{ d: string; color: string; from: string; to: string }[]>([]);
  const [hot, setHot] = React.useState<string | null>(null);
  const people = f?.people ?? [];
  const groups = React.useMemo(() => outsideOf(id), [id]);
  const node = getNode(id);
  const measure = React.useCallback(() => {
    const el = box.current;
    if (!el || el.offsetWidth < 640) return setLines([]);
    const b = el.getBoundingClientRect();
    const pos = (key: string, side: "l" | "r") => {
      const n = el.querySelector<HTMLElement>(`[data-k="${CSS.escape(key)}"]`);
      if (!n) return null;
      const r = n.getBoundingClientRect();
      return { x: (side === "r" ? r.right : r.left) - b.left, y: r.top + r.height / 2 - b.top };
    };
    const curve = (a: { x: number; y: number }, c: { x: number; y: number }) => {
      const mx = (a.x + c.x) / 2;
      return `M${a.x},${a.y} C${mx},${a.y} ${mx},${c.y} ${c.x},${c.y}`;
    };
    const out: { d: string; color: string; from: string; to: string }[] = [];
    const center = pos("center", "l"), centerR = pos("center", "r");
    for (const g of groups)
      for (const it of g.items) {
        const to = pos(`o:${g.key}:${it.name}`, "l");
        if (!to) continue;
        if (g.key === "people")
          for (const s of it.people) {
            const from = pos(`p:${s}`, "r");
            if (from) out.push({ d: curve(from, to), color: GROUP_COLOR.people, from: `p:${s}`, to: `o:${g.key}:${it.name}` });
          }
        else if (centerR) out.push({ d: curve(centerR, to), color: GROUP_COLOR[g.key], from: "center", to: `o:${g.key}:${it.name}` });
      }
    if (center) for (const p of people) {
      const from = pos(`p:${p.slug}`, "r");
      if (from) out.push({ d: curve(from, center), color: "currentColor", from: `p:${p.slug}`, to: "center" });
    }
    setLines(out);
  }, [groups, people]);
  React.useLayoutEffect(() => {
    measure();
    const ro = new ResizeObserver(measure);
    if (box.current) ro.observe(box.current);
    return () => ro.disconnect();
  }, [measure]);
  if (!f || (!people.length && !groups.length)) return null;
  const lit = (k: string) => !hot || lines.some((l) => (l.from === hot && l.to === k) || (l.to === hot && l.from === k)) || k === hot;
  const total = groups.reduce((n, g) => n + g.items.length, 0);
  const headcount = f.facts.find((x) => x.key === "employees")?.value.match(/^about [\d,.]+/i)?.[0];
  return (
    <div data-testid="ai-inside-out">
      <H aside={`${people.length} people inside · ${total} organizations outside`}>Inside and outside</H>
      <div ref={box} className="relative grid gap-4 border border-border p-3 md:grid-cols-[minmax(0,15rem)_minmax(0,11rem)_minmax(0,1fr)] md:gap-10" onMouseLeave={() => setHot(null)}>
        <svg className="pointer-events-none absolute inset-0 hidden h-full w-full md:block" aria-hidden="true">
          {lines.map((l, i) => (
            <path
              key={i}
              d={l.d}
              fill="none"
              stroke={l.color}
              strokeOpacity={hot ? (l.from === hot || l.to === hot ? 0.9 : 0.04) : l.color === "currentColor" ? 0.12 : 0.35}
              strokeWidth={hot && (l.from === hot || l.to === hot) ? 1.6 : 1}
              className="text-foreground"
            />
          ))}
        </svg>
        <div className="relative space-y-3">
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">Inside</p>
          {GROUPS.map((g) => {
            const ps = people.filter((p) => p.group === g.id);
            if (!ps.length) return null;
            return (
              <div key={g.id}>
                <p className="mb-1 inline-block bg-background pr-1 font-mono text-[9px] uppercase tracking-[0.15em] text-muted-foreground">{g.label}</p>
                <ul className="space-y-1">
                  {ps.map((p) => (
                    <li
                      key={p.slug}
                      data-k={`p:${p.slug}`}
                      onMouseEnter={() => setHot(`p:${p.slug}`)}
                      className={`flex items-center gap-2 bg-background pr-1 font-mono text-[10px] transition-opacity ${lit(`p:${p.slug}`) ? "opacity-100" : "opacity-30"}`}
                    >
                      <Avatar p={p} size={22} />
                      <span className="min-w-0 truncate text-foreground" title={p.role}>
                        {p.name}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
        <div className="relative flex items-center md:justify-center">
          <div data-k="center" onMouseEnter={() => setHot("center")} className="w-full border border-foreground/40 bg-background p-3 text-center">
            <p className="font-display text-base font-bold text-foreground">{node?.name}</p>
            {headcount && <p className="mt-1 font-mono text-[9px] text-muted-foreground">{headcount} employees</p>}
            {f.hiring && <p className="font-mono text-[9px] text-muted-foreground">{fmt(f.hiring.open)} open roles</p>}
          </div>
        </div>
        <div className="relative space-y-3">
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">Outside</p>
          {groups.map((g) => (
            <div key={g.key}>
              <p className="mb-1 inline-block bg-background pr-1 font-mono text-[9px] uppercase tracking-[0.15em]" style={{ color: GROUP_COLOR[g.key] }}>
                {g.label} <span className="text-muted-foreground">{g.items.length}</span>
              </p>
              <ul className="flex flex-wrap gap-1">
                {g.items.map((it) => (
                  <li key={it.name} data-k={`o:${g.key}:${it.name}`} onMouseEnter={() => setHot(`o:${g.key}:${it.name}`)} className={`transition-opacity ${lit(`o:${g.key}:${it.name}`) ? "opacity-100" : "opacity-30"}`}>
                    {it.entity && getNode(it.entity) ? (
                      <EntityLink id={it.entity} onPick={onPick} title={it.note} className="block border border-border bg-background px-1.5 py-0.5 font-mono text-[10px] leading-snug text-foreground underline decoration-dotted underline-offset-2 hover:border-foreground/50">
                        {it.name}
                      </EntityLink>
                    ) : (
                      <span title={it.note ?? (it.people.length ? `${it.people.length} of its people` : undefined)} className="block border border-border bg-background px-1.5 py-0.5 font-mono text-[10px] leading-snug text-foreground/85">
                        {it.name}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <p className="mt-1.5 font-mono text-[10px] text-muted-foreground">Hover a person to see where else they work or worked; hover an organization to see who links to it. Every line has a sentence behind it.</p>
    </div>
  );
}


// ---------------------------------------------------------------------------
// Birth to now: its own pages, public attention and its milestones on one time axis
// ---------------------------------------------------------------------------

const monthKey = (d: string) => d.slice(0, 7);
function monthsBetween(a: string, b: string): string[] {
  const out: string[] = [];
  let [y, m] = a.split("-").map(Number);
  const [y2, m2] = b.split("-").map(Number);
  while (y < y2 || (y === y2 && m <= m2)) {
    out.push(`${y}-${String(m).padStart(2, "0")}`);
    m === 12 ? ((y += 1), (m = 1)) : (m += 1);
  }
  return out;
}

export function TimelineSection({ id }: { id: string }) {
  const f = AI_360[id];
  const ref = React.useRef<HTMLDivElement>(null);
  const [W, setW] = React.useState(900);
  const [year, setYear] = React.useState<string | null>(null);
  const [section, setSection] = React.useState<string | null>(null);
  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setW(Math.max(300, Math.round(el.clientWidth))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  if (!f || (!f.site && !f.attention)) return null;
  const inc = f.facts.find((x) => x.key === "incorporated");
  const start =
    (inc && /(\w+) (\d{4})/.test(inc.value) ? `${inc.value.match(/(\d{4})/)![1]}-${String(["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"].indexOf(inc.value.split(" ")[0].toLowerCase()) + 1).padStart(2, "0")}` : null) ??
    [f.site?.first, f.attention?.months[0]?.[0], f.rounds[0]?.started].filter(Boolean).map((x) => monthKey(x!)).sort()[0]!;
  const end = [f.site?.latest, f.attention?.months.at(-1)?.[0], f.attention?.asOf].filter(Boolean).map((x) => monthKey(x!)).sort().at(-1)!;
  const months = monthsBetween(start, end);
  const att = new Map((f.attention?.months ?? []).map(([m, n]) => [m, n]));
  const own = new Map<string, number>();
  for (const it of f.site?.items ?? []) own.set(monthKey(it.date), (own.get(monthKey(it.date)) ?? 0) + 1);
  const maxA = Math.max(1, ...months.map((m) => att.get(m) ?? 0));
  const maxO = Math.max(1, ...months.map((m) => own.get(m) ?? 0));
  const L = 8, R = 8, bw = (W - L - R) / months.length;
  const x = (m: string) => L + months.indexOf(m) * bw + bw / 2;
  const rowA = { top: 22, h: f.attention ? 90 : 0 };
  const rowO = { top: rowA.top + rowA.h + (f.site ? 28 : 0), h: f.site ? 46 : 0 };
  const rowE = { top: rowO.top + rowO.h + 28 };
  const compact = W < 560;
  const CH = rowE.top + 48;
  const marks: { m: string; label: string; kind: "round" | "legal" | "ipo"; title: string }[] = [];
  for (const r of f.rounds)
    if (r.started && months.includes(monthKey(r.started)) && (r.kind === "priced_round" || r.kind === "ipo") && r.voting)
      marks.push({ m: monthKey(r.started), label: r.kind === "ipo" ? "S-1" : shortRound(r), kind: r.kind === "ipo" ? "ipo" : "round", title: `${r.round}${r.amount ? `, ${money(r.amount)}` : ""}` });
  for (const c of f.legal) if (c.filed && /^\d{4}-\d{2}$/.test(c.filed) && months.includes(c.filed)) marks.push({ m: c.filed, label: "", kind: "legal", title: `Filed: ${c.name}` });
  const years = [...new Set(months.map((m) => m.slice(0, 4)))];
  const items = (f.site?.items ?? []).filter((it) => (!year || it.date.startsWith(year)) && (!section || it.section === section));
  const sections = [...new Set((f.site?.items ?? []).map((i) => i.section))];
  const top = f.attention?.top.slice(0, 8) ?? [];
  return (
    <div className="space-y-4" data-testid="ai-timeline">
      <H aside={`${ym(start)} to ${ym(end)}`}>Birth to now</H>
      <figure className="border border-border p-3">
        <div ref={ref} className="w-full">
          <svg width={W} height={CH} viewBox={`0 0 ${W} ${CH}`} className="block" role="img" aria-label={`Month by month from ${ym(start)} to ${ym(end)}: Hacker News stories naming the company, the company's own dated pages, funding rounds and lawsuits.`}>
            <text x={L} y={12} className="fill-muted-foreground font-mono" fontSize={9} letterSpacing="0.12em">
              {f.attention ? (compact ? `HACKER NEWS STORIES A MONTH, PEAK ${fmt(maxA)}` : `PUBLIC ATTENTION: HACKER NEWS STORIES NAMING IT, A MONTH (PEAK ${fmt(maxA)})`) : ""}
            </text>
            {f.attention &&
              months.map((m) => {
                const n = att.get(m) ?? 0;
                const h = (n / maxA) * rowA.h;
                return n ? <rect key={`a${m}`} x={x(m) - bw * 0.4} y={rowA.top + rowA.h - h} width={Math.max(1, bw * 0.8)} height={h} fill="currentColor" className="text-foreground/40"><title>{`${ym(m)}: ${n} stories`}</title></rect> : null;
              })}
            <text x={L} y={rowO.top - 8} className="fill-muted-foreground font-mono" fontSize={9} letterSpacing="0.12em">
              {f.site ? (compact ? `ITS OWN PAGES A MONTH, PEAK ${fmt(maxO)}` : `ITS OWN PAGES: ${f.site.sections.join(" AND ").toUpperCase()}, A MONTH (PEAK ${fmt(maxO)})`) : ""}
            </text>
            {f.site &&
              months.map((m) => {
                const n = own.get(m) ?? 0;
                const h = (n / maxO) * rowO.h;
                return n ? <rect key={`o${m}`} x={x(m) - bw * 0.4} y={rowO.top + rowO.h - h} width={Math.max(1, bw * 0.8)} height={h} fill="#10b981"><title>{`${ym(m)}: ${n} pages`}</title></rect> : null;
              })}
            {marks.length > 0 && <line x1={L} x2={W - R} y1={rowE.top} y2={rowE.top} stroke="currentColor" strokeOpacity={0.2} />}
            {marks.map((k, i) => (
              <g key={i}>
                {k.kind === "legal" ? (
                  <path d={`M${x(k.m)},${rowE.top - 5} l5,9 h-10 z`} fill="#f59e0b"><title>{k.title}</title></path>
                ) : (
                  <path d={`M${x(k.m)},${rowE.top - 7} l7,7 l-7,7 l-7,-7 z`} fill={k.kind === "ipo" ? "#ef4444" : "#ec4899"}><title>{k.title}</title></path>
                )}
                {k.label && (
                  <text x={x(k.m)} y={rowE.top + 22} textAnchor="middle" className="fill-foreground font-mono" fontSize={9} fontWeight={700}>
                    {k.label}
                  </text>
                )}
              </g>
            ))}
            {years.map((yr) => {
              // A partial first year gets a label only when it has room before the next January.
              const m = months.find((mm) => mm.startsWith(yr) && mm.endsWith("-01")) ?? (yr === years[0] && months.filter((mm) => mm.startsWith(yr)).length >= 4 ? months[0] : null);
              return m ? (
                <g key={yr}>
                  <line x1={x(m) - bw / 2} x2={x(m) - bw / 2} y1={rowA.top} y2={rowE.top + 8} stroke="currentColor" strokeOpacity={0.08} />
                  <text x={x(m) - bw / 2 + 2} y={CH - 6} className="fill-muted-foreground font-mono" fontSize={9}>
                    {yr}
                  </text>
                </g>
              ) : null;
            })}
          </svg>
        </div>
        <figcaption className="mt-1 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[10px] text-muted-foreground">
          {marks.some((k) => k.kind === "round") && <span><span className="mr-1 inline-block h-2 w-2" style={{ background: "#ec4899" }} aria-hidden="true" />Funding round</span>}
          {marks.some((k) => k.kind === "ipo") && <span><span className="mr-1 inline-block h-2 w-2" style={{ background: "#ef4444" }} aria-hidden="true" />IPO filing</span>}
          {marks.some((k) => k.kind === "legal") && <span><span className="mr-1 inline-block h-2 w-2" style={{ background: "#f59e0b" }} aria-hidden="true" />Lawsuit filed</span>}
          {f.attention && <span>Attention counts stories whose title names it on Hacker News (query: {f.attention.query}); a few early ones may use the word another way.</span>}
        </figcaption>
      </figure>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        {f.site && (
          <div>
            <H aside={`${fmt(f.site.dated)} dated pages · ${ym(f.site.first)} to ${ym(f.site.latest)}`}>Its own record</H>
            <div className="mb-2 flex flex-wrap gap-1 font-mono text-[10px]">
              {[null, ...years].map((yr) => (
                <button key={yr ?? "all"} type="button" onClick={() => setYear(yr)} className={`border px-1.5 py-0.5 ${year === yr ? "border-foreground/60 text-foreground" : "border-border text-muted-foreground hover:text-foreground"}`}>
                  {yr ?? "All years"}
                </button>
              ))}
              <span className="mx-1 text-muted-foreground">·</span>
              {[null, ...sections].map((sec) => (
                <button key={sec ?? "all"} type="button" onClick={() => setSection(sec)} className={`border px-1.5 py-0.5 capitalize ${section === sec ? "border-foreground/60 text-foreground" : "border-border text-muted-foreground hover:text-foreground"}`}>
                  {sec ?? "everything"}
                </button>
              ))}
            </div>
            <ol className="max-h-[26rem] divide-y divide-border overflow-y-auto border border-border">
              {items.map((it) => (
                <li key={it.url} className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-3 px-3 py-1.5 font-mono text-[11px]">
                  <span className="tabular-nums text-muted-foreground">{dayMonthYear(it.date)}</span>
                  <a href={it.url} target="_blank" rel="noopener noreferrer" className="min-w-0 text-foreground hover:underline">
                    {it.title} ↗<span className="ml-2 text-[9px] uppercase tracking-[0.12em] text-muted-foreground">{it.section}</span>
                  </a>
                </li>
              ))}
            </ol>
            <p className="mt-1 font-mono text-[10px] text-muted-foreground">
              {items.length} shown. Every dated page in these sections of its sitemap, with the publish date the page states.
            </p>
          </div>
        )}
        {top.length > 0 && (
          <div>
            <H aside="most discussed">On Hacker News</H>
            <ol className="divide-y divide-border border border-border">
              {top.map((t) => (
                <li key={t.url} className="px-3 py-1.5 font-mono text-[11px]">
                  <a href={t.url} target="_blank" rel="noopener noreferrer" className="text-foreground hover:underline">
                    {t.title} ↗
                  </a>
                  <span className="block text-[10px] text-muted-foreground">
                    {t.date ? `${dayMonthYear(t.date)} · ` : ""}
                    {t.summary}
                  </span>
                </li>
              ))}
            </ol>
            <p className="mt-1 font-mono text-[10px] text-muted-foreground">Public discussion, not the company&apos;s words; threads with the most points that name it in the title.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// The 360 summary: every angle, what is collected, where it comes from
// ---------------------------------------------------------------------------

export type Angle = { key: string; label: string; count: number | null; note: string; tab?: string };

export function anglesOf(id: string): Angle[] {
  const f = AI_360[id];
  const intel = AI_INTEL[id];
  const node = getNode(id);
  const listed = !!node?.ticker && node.ticker !== "private" && !/proposed/i.test(node.ticker);
  return [
    { key: "people", label: "People", count: f?.people.length ?? 0, note: f?.people.length ? "officers, board, founders, with their other roles" : "not collected yet", tab: "people" },
    { key: "hiring", label: "Hiring", count: f?.hiring?.open ?? 0, note: f?.hiring ? "open roles on its public job board" : "no public job board found yet", tab: "people" },
    { key: "investors", label: "Investors", count: f?.rounds.length ?? 0, note: f?.rounds.length ? "financings from the first round to the IPO" : "not collected yet", tab: "investors" },
    { key: "money", label: "Deals", count: intel?.deals.length ?? 0, note: "compute, supply and investment deals with their terms", tab: "money" },
    { key: "legal", label: "Legal", count: f?.legal.length ?? 0, note: f?.legal.length ? "lawsuits and government actions it discloses" : "not collected yet", tab: "legal" },
    { key: "advisors", label: "Advisors", count: f?.advisors.length ?? 0, note: f?.advisors.length ? "auditor, counsel, underwriters" : "not collected yet", tab: "investors" },
    { key: "news", label: "News and events", count: (intel?.events.length ?? 0), note: "dated events from filings and this site's news", tab: "news" },
    { key: "posts", label: "Posts", count: intel?.posts.length ?? 0, note: "release notes and posts from official channels", tab: "people" },
    { key: "website", label: "Its website", count: f?.site?.dated ?? 0, note: f?.site ? `dated pages, ${ym(f.site.first)} to now` : "not read yet", tab: "f360" },
    { key: "attention", label: "Public attention", count: f?.attention?.total ?? 0, note: f?.attention ? "Hacker News stories naming it, by month" : "no clear query yet", tab: "f360" },
    { key: "tone", label: "News tone", count: f?.tone?.days.length ?? null, note: f?.tone ? "days of GDELT news tone" : "GDELT news tone: next refresh", tab: "f360" },
    { key: "reddit", label: "Reddit", count: null, note: "pending a licensed source", tab: "f360" },
    { key: "earnings", label: "Earnings calls", count: null, note: listed ? "next, from SEC filings and investor pages" : "none until it is listed", tab: "earnings" },
  ];
}

export function Company360({ id, onPick, onTab }: { id: string; onPick?: (id: string) => void; onTab?: (tab: string) => void }) {
  const angles = anglesOf(id);
  return (
    <div className="space-y-6" data-testid="ai-360">
      <FactsSection id={id} />
      <div>
        <H aside="what this file covers, and what is next">Every angle</H>
        <ul className="grid grid-cols-2 border-l border-t border-border sm:grid-cols-3 lg:grid-cols-6">
          {angles.map((a) => (
            <li key={a.key} className="border-b border-r border-border bg-background">
              <button type="button" onClick={() => a.tab && onTab?.(a.tab)} className="block h-full w-full p-3 text-left hover:bg-foreground/[0.04]" disabled={!onTab}>
                <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">{a.label}</span>
                <span className={`mt-1 block font-display text-xl font-bold tabular-nums ${a.count ? "text-foreground" : "text-muted-foreground"}`}>{a.count == null ? "next" : fmt(a.count)}</span>
                <span className="block font-mono text-[10px] leading-snug text-muted-foreground">{a.note}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
      <TimelineSection id={id} />
      <InsideOutMap id={id} onPick={onPick} />
    </div>
  );
}
