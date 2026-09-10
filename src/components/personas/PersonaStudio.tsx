"use client";

/**
 * PersonaStudio: build any audience, get an answer with its provenance.
 *
 * The whole point is that a question like "Asian, 33, immigrant" or
 * "woman, 33, lost a pet" has no published cell anywhere. Refusing to
 * answer is safe and useless. So the studio answers, and shows exactly
 * how it got there, one of three ways:
 *
 *   measured   a published figure exists for this trait. Cited.
 *   estimated  combined from published marginals in odds space, so the
 *              result cannot exceed 100. The arithmetic is printed.
 *              Independence is assumed and said out loud.
 *   no data    nothing measures this. It says so, and offers a proxy
 *              where an honest one exists.
 *
 * Confidence falls as traits accumulate, per Chapman et al. (2008), and
 * the interface says so instead of sounding more certain.
 */

import { useMemo, useState } from "react";
import PlatformMark from "./PlatformMark";
import { NEWS_CHANNELS } from "@/data/newsChannels";
import AudienceCanvas from "./AudienceCanvas";
import PersonaAvatar, { type AvatarAge, type AvatarGender } from "./PersonaAvatar";
import {
  ALL_SEGMENTS,
  BUYER_PERSONAS,
  TECH_ACCESS,
  TEEN_REACH,
  TEEN_STUDY,
  DEMAND_SOURCES,
  PLATFORMS,
  SOURCE_CATEGORY,
  US_CONTEXT,
  allSegmentById,
  estimateReach,
  type SourceCategory,
} from "@/data/personas";
import { CORPUS_SEGMENTS } from "@/data/corpus";

const DIMS = [
  { key: "gender", label: "Gender", ids: ["men", "women"] },
  { key: "age", label: "Age", ids: ["teen", "18-29", "30-49", "50-64", "65+"] },
  { key: "race", label: "Race", ids: ["race-white", "race-black", "race-hispanic", "race-asian"] },
  { key: "income", label: "Salary", ids: ["inc-lt30", "inc-30-70", "inc-70-100", "inc-100"] },
  { key: "education", label: "Education", ids: ["edu-hs", "edu-some", "edu-grad"] },
  { key: "community", label: "Lives in", ids: ["urban", "suburban", "rural"] },
  { key: "party", label: "Leans", ids: ["party-rep", "party-dem"] },
];

/** Traits people ask for that nothing publishes, with an honest proxy where one exists. */
const LANG = US_CONTEXT.find((f) => f.id === "language");

const NO_DATA: {
  id: string;
  label: string;
  why: string;
  proxy?: string;
  proxyUrl?: string;
}[] = [
  {
    id: "immigrant",
    label: "Immigrant",
    why: "No published source cuts platform use by immigration status.",
    proxy: LANG
      ? `Closest honest proxy: ${LANG.value.toLowerCase()} of people aged 5+ speak a language other than English at home (${LANG.agency}, ${LANG.asOf}). That is a different question, and it is not a substitute.`
      : undefined,
    proxyUrl: LANG?.url,
  },
  {
    id: "kids",
    label: "Has children",
    why: "Pew publishes age, gender, race, income, education, community and party. Parental status is not among them.",
  },
  {
    id: "life-event",
    label: "Recent life event",
    why: "Bereavement, a new pet, a move, a diagnosis. No public dataset cuts media behaviour by life event, and any tool showing you one inferred it.",
  },
  {
    id: "city",
    label: "Specific city",
    why: "Pew publishes urban, suburban and rural, not metro-level geography.",
    proxy:
      "Closest honest proxy: the urban, suburban and rural daily-use figures, which are published and on the data page.",
  },
];

const CATS: SourceCategory[] = ["search", "social", "reviews", "market", "expert"];

export default function PersonaStudio() {
  const [traits, setTraits] = useState<Record<string, string | undefined>>({});
  const [gaps, setGaps] = useState<string[]>([]);
  const [sources, setSources] = useState<string[]>([]);
  const [openRow, setOpenRow] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [showSources, setShowSources] = useState(false);
  /** Which platform the hundred dots are describing. */
  const [focus, setFocus] = useState("instagram");

  const traitList = Object.values(traits).filter(Boolean) as string[];
  const dimOf = (id: string) => DIMS.find((d) => d.ids.includes(id))?.key ?? "";
  /** The source's own category wording, where a one-word label loses it. */
  const defOf = (id: string) => CORPUS_SEGMENTS.find((s) => s.slug === id)?.definition || "";
  const labelOf = (id: string) =>
    id === "teen" ? "13 to 17" : (allSegmentById(id)?.label ?? id);

  const toggleTrait = (id: string) => {
    const d = dimOf(id);
    setTraits((p) => ({ ...p, [d]: p[d] === id ? undefined : id }));
  };
  const drop = (id: string) => {
    if (DIMS.some((d) => d.ids.includes(id))) return toggleTrait(id);
    if (NO_DATA.some((n) => n.id === id))
      return setGaps((p) => (p.includes(id) ? p : [...p, id]));
    setSources((p) => (p.includes(id) ? p : [...p, id]));
  };

  /** Teen has its own study, so it is excluded from the adult estimator. */
  const isTeen = traits.age === "teen";
  const adultTraits = traitList.filter((t) => t !== "teen");

  const ranked = useMemo(() => {
    return PLATFORMS.map((p) => ({ p, est: estimateReach(p.id, adultTraits) })).sort(
      (a, b) => b.est.value - a.est.value,
    );
  }, [adultTraits]);

  const focused = useMemo(
    () => ranked.find((r) => r.p.id === focus) ?? ranked[0],
    [ranked, focus],
  );

  const scored = useMemo(() => {
    if (!sources.length) return [];
    return BUYER_PERSONAS.map((bp) => {
      const hits = bp.trusts.filter((t) => sources.includes(t));
      return { bp, hits, score: hits.length / bp.trusts.length };
    }).sort((a, b) => b.score - a.score);
  }, [sources]);
  const topPattern = scored[0] && scored[0].score >= 0.5 ? scored[0] : null;

  const confidence = isTeen
    ? {
        label: "Separate study",
        note: `Teens are surveyed on their own. ${TEEN_STUDY.publisher}, n=${TEEN_STUDY.sampleSize.toLocaleString()}.`,
      }
    : adultTraits.length === 0
      ? { label: "National baseline", note: "Published figures for all US adults." }
      : adultTraits.length === 1
        ? { label: "Measured", note: "Every figure below is a published cell." }
        : adultTraits.length <= 3
          ? { label: "Estimated", note: "Combined from published figures in odds space. Tap any row for the arithmetic." }
          : { label: "Estimated, low confidence", note: "Four or more traits. Read as direction only." };

  const colorOf = (id: string) => PLATFORMS.find((p) => p.id === id)?.color ?? "#888";
  const reset = () => { setTraits({}); setGaps([]); setSources([]); setOpenRow(null); };


  const dropZone = {
    onDragOver: (e: React.DragEvent) => { e.preventDefault(); setDragOver(true); },
    onDragLeave: () => setDragOver(false),
    onDrop: (e: React.DragEvent) => {
      e.preventDefault(); setDragOver(false);
      const id = e.dataTransfer.getData("text/plain");
      if (id) drop(id);
    },
  };

  return (
    <div
      {...dropZone}
      className={`border border-border bg-card/20 transition-colors ${dragOver ? "bg-foreground/5" : ""}`}
    >
      {/* HEADER: who you are describing, and how well we know it. */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 border-b border-border">
        <div className="shrink-0" style={{ lineHeight: 0 }}>
          <PersonaAvatar
            gender={traits.gender as AvatarGender}
            age={traits.age as AvatarAge}
            size={44}
            accent="var(--foreground)"
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-display text-base font-bold text-foreground leading-tight truncate">
            {traitList.length ? traitList.map(labelOf).join(", ") : "All US adults"}
          </p>
          <p className="font-mono text-[10px] text-muted-foreground leading-tight mt-0.5">
            {confidence.label} · {confidence.note}
            {topPattern ? ` · reads as ${topPattern.bp.name}` : ""}
          </p>
        </div>
        {(traitList.length > 0 || gaps.length > 0 || sources.length > 0) && (
          <button
            onClick={reset}
            className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground border border-border px-2 py-1 transition-colors shrink-0"
          >
            Reset
          </button>
        )}
      </div>

      {/* ROW 1: build · the hundred people · where they are */}
      <div className="grid lg:grid-cols-[minmax(0,260px)_minmax(0,1fr)_minmax(0,300px)] border-b border-border">
        {/* Build rail */}
        <div className="p-4 border-b lg:border-b-0 lg:border-r border-border">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-3">
            Build anyone
          </p>
          {DIMS.map((d) => (
            <div key={d.key} className="mb-3">
              <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground/80 mb-1">
                {d.label}
              </p>
              <div className="flex flex-wrap gap-1">
                {d.ids.map((id) => {
                  const on = traits[d.key] === id;
                  const seg = allSegmentById(id);
                  return (
                    <button
                      key={id}
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData("text/plain", id)}
                      onClick={() => toggleTrait(id)}
                      aria-pressed={on}
                      title={
                        seg
                          ? `${defOf(id) ? defOf(id) + "\n\n" : ""}n=${seg.n?.toLocaleString()}, margin of error ±${seg.moe}pp`
                          : undefined
                      }
                      className={`font-mono text-[10px] px-1.5 py-0.5 border transition-all cursor-grab active:cursor-grabbing ${
                        on
                          ? "border-foreground text-foreground bg-foreground/10"
                          : "border-border/60 text-muted-foreground hover:text-foreground hover:border-foreground/40"
                      }`}
                    >
                      {labelOf(id)}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="mt-4 pt-3 border-t border-border/50">
            <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground/80 mb-1">
              Also ask
            </p>
            <div className="flex flex-wrap gap-1">
              {NO_DATA.map((n) => {
                const on = gaps.includes(n.id);
                return (
                  <button
                    key={n.id}
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData("text/plain", n.id)}
                    onClick={() => setGaps((p) => (on ? p.filter((x) => x !== n.id) : [...p, n.id]))}
                    aria-pressed={on}
                    className={`font-mono text-[10px] px-1.5 py-0.5 border border-dashed transition-all cursor-grab ${
                      on ? "border-foreground/70 text-foreground bg-foreground/5" : "border-border/60 text-muted-foreground/90 hover:text-foreground"
                    }`}
                  >
                    {n.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* The hundred people */}
        <div className="p-4 border-b lg:border-b-0 lg:border-r border-border">
          {isTeen ? (
            <TeenPanel />
          ) : focused ? (
            <div className="flex flex-wrap gap-5 items-start">
              <AudienceCanvas
                size={216}
                state={{
                  value: focused.est.value,
                  moe: focused.est.samplingMoe,
                  color: focused.p.color,
                  basis: focused.est.basis === "measured" ? "measured" : "estimated",
                }}
                label={`use ${focused.p.name}`}
                sublabel={
                  traitList.length
                    ? `Out of 100 people who are ${traitList.map(labelOf).join(", ")}.`
                    : "Out of 100 US adults."
                }
              />
              <div className="min-w-[130px] flex-1">
                <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground/80 mb-1.5">
                  Show me
                </p>
                <div className="flex flex-wrap gap-1 mb-3">
                  {ranked.map(({ p }) => (
                    <button
                      key={p.id}
                      onClick={() => setFocus(p.id)}
                      aria-pressed={focus === p.id}
                      title={p.name}
                      className={`inline-flex items-center gap-1 border px-1 py-0.5 transition-all ${
                        focus === p.id ? "border-foreground bg-foreground/10" : "border-border/60 hover:border-foreground/40"
                      }`}
                    >
                      <PlatformMark id={p.id} color={p.color} size={12} />
                      <span className="font-mono text-[9px] text-muted-foreground">{p.name}</span>
                    </button>
                  ))}
                </div>
                <p className="font-mono text-[10px] text-muted-foreground/90 leading-relaxed">
                  The dashed ring is the margin of error, drawn to scale. Add traits and watch it
                  widen: that is the cost of being specific, and every other tool hides it.
                </p>
                {focused.est.basis === "estimated" && (
                  <p className="font-mono text-[10px] text-muted-foreground leading-relaxed mt-2">
                    {focused.est.derivation}
                  </p>
                )}
              </div>
            </div>
          ) : null}
        </div>

        {/* Ranked reach */}
        <div className="p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">
            Where they are
          </p>
          {isTeen ? (
            <p className="font-mono text-[10px] text-muted-foreground leading-relaxed">
              Teens are a separate study. See the panel to the left.
            </p>
          ) : (
            <div className="space-y-0.5">
              {ranked.map(({ p, est }) => (
                <button
                  key={p.id}
                  onClick={() => setFocus(p.id)}
                  aria-pressed={focus === p.id}
                  className={`w-full flex items-center gap-1.5 py-0.5 px-1 transition-colors text-left ${
                    focus === p.id ? "bg-foreground/10" : "hover:bg-foreground/5"
                  }`}
                >
                  <PlatformMark id={p.id} color={p.color} size={13} />
                  <span className="font-mono text-[10px] text-muted-foreground w-14 shrink-0 truncate">
                    {p.name}
                  </span>
                  <span className="flex-1 h-1.5 bg-secondary/50">
                    <span
                      className="block h-full transition-all duration-500"
                      style={{ width: `${est.value}%`, background: p.color, opacity: est.basis === "estimated" ? 0.55 : 0.9 }}
                    />
                  </span>
                  <span className="font-mono text-[10px] text-foreground w-7 text-right tabular-nums shrink-0">
                    {est.value}
                  </span>
                  <span
                    className="font-mono text-[8px] w-7 text-right shrink-0"
                    style={{ color: est.basis === "measured" ? "#10b981" : "#f59e0b" }}
                  >
                    {est.basis === "measured" ? "meas" : "est"}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ROW 2: access · news */}
      {!isTeen && (
        <div className="grid lg:grid-cols-2 border-b border-border">
          <div className="p-4 border-b lg:border-b-0 lg:border-r border-border overflow-x-auto">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">
              How they get online · every cell published
            </p>
            <table className="w-full">
              <thead>
                <tr className="text-left">
                  <th className="pb-1 pr-2 font-mono text-[9px] uppercase tracking-wider text-muted-foreground/80">&nbsp;</th>
                  <th className="pb-1 pr-2 font-mono text-[9px] uppercase tracking-wider text-muted-foreground/80 text-right">All</th>
                  {adultTraits.map((t) => (
                    <th key={t} className="pb-1 pr-2 font-mono text-[9px] uppercase tracking-wider text-muted-foreground/80 text-right whitespace-nowrap">
                      {labelOf(t)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TECH_ACCESS.map((m) => (
                  <tr key={m.id} className="border-t border-border/30">
                    <td className="py-1 pr-2 font-mono text-[10px] text-muted-foreground leading-tight">{m.label}</td>
                    <td className="py-1 pr-2 font-mono text-[10px] text-foreground text-right tabular-nums">{m.overall}%</td>
                    {adultTraits.map((t) => (
                      <td key={t} className="py-1 pr-2 font-mono text-[10px] text-right tabular-nums text-foreground">
                        {m.by[t] === undefined ? <span className="text-muted-foreground/70">n/p</span> : `${m.by[t]}%`}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="font-mono text-[10px] text-muted-foreground/90 leading-relaxed mt-2">
              One column per trait, not combined: these sit near the ceiling where multiplying odds
              adds error without adding information. The smartphone-only row is the one that
              changes what you build.
            </p>
          </div>

          <div className="p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">
              Where they get news
            </p>
            <div className="space-y-0.5">
              {NEWS_CHANNELS.map((c) => {
                const hit = adultTraits.find((t) => c.by[t] !== undefined);
                const v = hit ? c.by[hit] : c.overall;
                const delta = hit ? v - c.overall : 0;
                return (
                  <div key={c.id} className="flex items-center gap-2 py-0.5">
                    <span className="font-mono text-[10px] text-muted-foreground w-24 shrink-0 truncate">{c.label}</span>
                    <span className="flex-1 h-1.5 bg-secondary/50">
                      <span className="block h-full transition-all duration-500" style={{ width: `${v}%`, background: "var(--foreground)", opacity: 0.6 }} />
                    </span>
                    <span className="font-mono text-[10px] text-foreground w-7 text-right tabular-nums shrink-0">{v}</span>
                    <span
                      className="font-mono text-[9px] w-8 text-right tabular-nums shrink-0"
                      style={{ color: delta === 0 ? undefined : delta > 0 ? "#10b981" : "#f59e0b" }}
                    >
                      {delta === 0 ? "" : `${delta > 0 ? "+" : ""}${delta}`}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="font-mono text-[10px] text-muted-foreground/90 leading-relaxed mt-2">
              AI chatbots are in this survey for the first time: 9% of US adults, 19% of Asian
              adults, the widest spread of any channel here.
            </p>
          </div>
        </div>
      )}

      {/* ROW 3: gaps · buying pattern · the country */}
      <div className="grid lg:grid-cols-3">
        <div className="p-4 border-b lg:border-b-0 lg:border-r border-border">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">
            {gaps.length ? "No data for these" : "Things nothing measures"}
          </p>
          {gaps.length === 0 ? (
            <p className="font-mono text-[10px] text-muted-foreground leading-relaxed">
              Drag one of the dashed chips in for immigration status, children, a life event or a
              city, and this says what is missing instead of inventing it.
            </p>
          ) : (
            NO_DATA.filter((n) => gaps.includes(n.id)).map((n) => (
              <div key={n.id} className="mb-2 last:mb-0">
                <p className="font-mono text-[10px] text-foreground">{n.label}</p>
                <p className="font-mono text-[10px] text-muted-foreground leading-relaxed">{n.why}</p>
                {n.proxy && (
                  <p className="font-mono text-[10px] text-muted-foreground/90 leading-relaxed mt-1">
                    {n.proxyUrl ? (
                      <a href={n.proxyUrl} target="_blank" rel="noopener noreferrer" className="underline decoration-border hover:text-foreground transition-colors">
                        {n.proxy}
                      </a>
                    ) : n.proxy}
                  </p>
                )}
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-b lg:border-b-0 lg:border-r border-border">
          <button
            onClick={() => setShowSources((v) => !v)}
            className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground w-full text-left transition-colors mb-2"
          >
            Where they look {showSources ? "−" : "+"}
            <span className="normal-case tracking-normal text-muted-foreground/80">
              {" "}· {sources.length ? `${sources.length} selected` : "20 demand sources"}
            </span>
          </button>
          {showSources ? (
            <div className="space-y-2">
              {CATS.map((cat) => (
                <div key={cat}>
                  <div className="flex items-baseline gap-1.5 mb-1">
                    <span className="inline-block w-1.5 h-1.5 shrink-0" style={{ background: SOURCE_CATEGORY[cat].color }} aria-hidden="true" />
                    <span className="font-mono text-[9px] uppercase tracking-wider text-foreground">{SOURCE_CATEGORY[cat].label}</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {DEMAND_SOURCES.filter((s) => s.category === cat).map((s) => {
                      const on = sources.includes(s.id);
                      return (
                        <button
                          key={s.id}
                          draggable
                          onDragStart={(e) => e.dataTransfer.setData("text/plain", s.id)}
                          onClick={() => setSources((p) => (on ? p.filter((x) => x !== s.id) : [...p, s.id]))}
                          aria-pressed={on}
                          className={`inline-flex items-center gap-1 border px-1 py-0.5 transition-all cursor-grab ${
                            on ? "border-foreground/50 bg-foreground/10 text-foreground" : "border-border/60 text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {s.platformId && <PlatformMark id={s.platformId} color={colorOf(s.platformId)} size={10} />}
                          <span className="font-mono text-[9px]">{s.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : topPattern ? (
            <>
              <p className="font-mono text-[10px] text-foreground leading-relaxed mb-1">
                {topPattern.bp.asks}
              </p>
              <p className="font-mono text-[10px] text-muted-foreground leading-relaxed">
                Won by: {topPattern.bp.wonBy}
              </p>
            </>
          ) : (
            <p className="font-mono text-[10px] text-muted-foreground leading-relaxed">
              Open this and drag in the sources a buyer would actually use. It names the buying
              pattern, or refuses to until the mix is strong enough.
            </p>
          )}
        </div>

        <div className="p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">
            The country they live in
          </p>
          <div className="space-y-1">
            {US_CONTEXT.filter((f) =>
              ["median-hh-income", "homeownership", "median-rent", "avg-debt", "poverty", "unemployment"].includes(f.id),
            ).map((f) => (
              <p key={f.id} className="font-mono text-[10px] text-muted-foreground leading-relaxed">
                <span className="text-foreground">{f.value.split(",")[0]}</span> {f.metric.toLowerCase()}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  function TeenPanel() {
    return (
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-2">
          Where they are · a different study
        </p>
        <p className="font-mono text-[10px] text-muted-foreground leading-relaxed mb-3">
          The adult survey does not sample under-18s, so nothing above can answer this and it does
          not try. These are {TEEN_STUDY.publisher}&apos;s published figures for {TEEN_STUDY.population}{" "}
          (n={TEEN_STUDY.sampleSize.toLocaleString()}, fielded {TEEN_STUDY.fielded}).
        </p>
        <div className="space-y-1">
          {TEEN_REACH.map((t) => (
            <div key={t.label}>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-muted-foreground w-36 shrink-0 truncate">{t.label}</span>
                <span className="flex-1 h-1.5 bg-secondary/50">
                  <span className="block h-full bg-foreground/70" style={{ width: `${t.pct}%` }} />
                </span>
                <span className="font-mono text-[10px] text-foreground w-7 text-right tabular-nums shrink-0">{t.pct}</span>
              </div>
              <p className="font-mono text-[9px] text-muted-foreground/90 leading-relaxed pl-[9.5rem]">{t.note}</p>
            </div>
          ))}
        </div>
        <p className="font-mono text-[10px] text-muted-foreground/90 leading-relaxed mt-2">
          <a href={TEEN_STUDY.url} target="_blank" rel="noopener noreferrer" className="underline decoration-border hover:text-foreground transition-colors">
            {TEEN_STUDY.name}
          </a>
        </p>
      </div>
    );
  }
}
