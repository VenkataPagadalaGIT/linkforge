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
import PersonaAvatar, { type AvatarAge, type AvatarGender } from "./PersonaAvatar";
import {
  ALL_SEGMENTS,
  BUYER_PERSONAS,
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

const DIMS = [
  { key: "gender", label: "Gender", ids: ["men", "women"] },
  { key: "age", label: "Age", ids: ["teen", "18-29", "30-49", "50-64", "65+"] },
  { key: "race", label: "Race", ids: ["race-white", "race-black", "race-hispanic", "race-asian"] },
  { key: "income", label: "Salary", ids: ["inc-lt30", "inc-30-70", "inc-70-100", "inc-100"] },
  { key: "education", label: "Education", ids: ["edu-hs", "edu-some", "edu-grad"] },
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

  const traitList = Object.values(traits).filter(Boolean) as string[];
  const dimOf = (id: string) => DIMS.find((d) => d.ids.includes(id))?.key ?? "";
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

  return (
    <div className="border border-border bg-card/20">
      <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)]">
        {/* BUILD */}
        <div className="p-5 border-b lg:border-b-0 lg:border-r border-border">
          <div className="flex items-baseline justify-between gap-2 mb-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
              Build anyone
            </p>
            {(traitList.length > 0 || gaps.length > 0 || sources.length > 0) && (
              <button onClick={reset} className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground border border-border px-2 py-0.5 transition-colors">
                Reset
              </button>
            )}
          </div>

          {DIMS.map((d) => (
            <div key={d.key} className="flex flex-wrap items-center gap-1.5 mb-2.5">
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/80 w-20 shrink-0">
                {d.label}
              </span>
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
                    title={seg ? `n=${seg.n.toLocaleString()}, margin of error ±${seg.moe}pp` : undefined}
                    className={`font-mono text-[11px] px-2 py-1 border transition-all cursor-grab active:cursor-grabbing ${
                      on ? "border-foreground text-foreground bg-foreground/10" : "border-border/60 text-muted-foreground hover:text-foreground hover:border-foreground/40"
                    }`}
                  >
                    {labelOf(id)}
                  </button>
                );
              })}
            </div>
          ))}

          {/* Traits nothing measures */}
          <div className="flex flex-wrap items-center gap-1.5 mt-4 pt-4 border-t border-border/50">
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/80 w-20 shrink-0">
              Also ask
            </span>
            {NO_DATA.map((n) => {
              const on = gaps.includes(n.id);
              return (
                <button
                  key={n.id}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData("text/plain", n.id)}
                  onClick={() => setGaps((p) => (on ? p.filter((x) => x !== n.id) : [...p, n.id]))}
                  aria-pressed={on}
                  className={`font-mono text-[11px] px-2 py-1 border border-dashed transition-all cursor-grab ${
                    on ? "border-foreground/70 text-foreground bg-foreground/5" : "border-border/60 text-muted-foreground/90 hover:text-foreground"
                  }`}
                >
                  {n.label}
                </button>
              );
            })}
          </div>

          {/* Where they look */}
          <button
            onClick={() => setShowSources((v) => !v)}
            className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground hover:text-foreground mt-6 pt-4 border-t border-border/50 w-full text-left transition-colors"
          >
            Where they look {showSources ? "−" : "+"}
            <span className="normal-case tracking-normal text-muted-foreground/80">
              {" "}
              · {sources.length ? `${sources.length} selected` : "20 demand sources"}
            </span>
          </button>
          {showSources && (
            <div className="space-y-3 mt-3">
              {CATS.map((cat) => (
                <div key={cat}>
                  <div className="flex items-baseline gap-2 mb-1.5">
                    <span className="inline-block w-2 h-2 shrink-0" style={{ background: SOURCE_CATEGORY[cat].color }} aria-hidden="true" />
                    <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-foreground">{SOURCE_CATEGORY[cat].label}</span>
                    <span className="font-mono text-[10px] text-muted-foreground">{SOURCE_CATEGORY[cat].tells}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {DEMAND_SOURCES.filter((s) => s.category === cat).map((s) => {
                      const on = sources.includes(s.id);
                      return (
                        <button
                          key={s.id}
                          draggable
                          onDragStart={(e) => e.dataTransfer.setData("text/plain", s.id)}
                          onClick={() => setSources((p) => (on ? p.filter((x) => x !== s.id) : [...p, s.id]))}
                          aria-pressed={on}
                          className={`inline-flex items-center gap-1.5 border px-2 py-1 transition-all cursor-grab ${
                            on ? "border-foreground/50 bg-foreground/10 text-foreground" : "border-border/60 text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {s.platformId && <PlatformMark id={s.platformId} color={colorOf(s.platformId)} size={12} />}
                          <span className="font-mono text-[11px]">{s.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* PROFILE */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); const id = e.dataTransfer.getData("text/plain"); if (id) drop(id); }}
          className={`p-5 transition-colors ${dragOver ? "bg-foreground/5" : ""}`}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="shrink-0" style={{ lineHeight: 0 }}>
              <PersonaAvatar gender={traits.gender as AvatarGender} age={traits.age as AvatarAge} size={68} accent="var(--foreground)" />
            </div>
            <div className="min-w-0">
              <p className="font-display text-base font-bold text-foreground leading-tight">
                {traitList.length ? traitList.map(labelOf).join(", ") : "All US adults"}
              </p>
              <p className="font-mono text-[10px] text-muted-foreground mt-0.5">
                {confidence.label}
                {topPattern ? ` · ${topPattern.bp.name}` : ""}
              </p>
            </div>
          </div>

          <p className="font-mono text-[10px] text-muted-foreground/90 leading-relaxed mb-4 pb-4 border-b border-border/50">
            {confidence.note}
          </p>

          {/* Teens are a different survey. The adult estimator cannot answer for
              them, so it does not pretend to: its panel is replaced, not adjusted. */}
          {isTeen ? (
            <div className="mb-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-2">
                Where they are · a different study
              </p>
              <p className="font-mono text-[10px] text-muted-foreground leading-relaxed mb-3">
                The adult survey does not sample under-18s, so nothing above can answer this and it
                does not try. These are {TEEN_STUDY.publisher}&apos;s own published figures for{" "}
                {TEEN_STUDY.population} (n={TEEN_STUDY.sampleSize.toLocaleString()}, fielded{" "}
                {TEEN_STUDY.fielded}). Only the platforms that study reports are listed, and any
                other trait you selected has no published teen cell.
              </p>
              <div className="space-y-1">
                {TEEN_REACH.map((t) => (
                  <div key={t.label} className="py-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] text-muted-foreground w-40 shrink-0 truncate">
                        {t.label}
                      </span>
                      <span className="flex-1 h-1.5 bg-secondary/50">
                        <span className="block h-full bg-foreground/70" style={{ width: `${t.pct}%` }} />
                      </span>
                      <span className="font-mono text-xs text-foreground w-9 text-right tabular-nums shrink-0">
                        {t.pct}%
                      </span>
                    </div>
                    <p className="font-mono text-[10px] text-muted-foreground/90 leading-relaxed pl-[10.5rem]">
                      {t.note}
                    </p>
                  </div>
                ))}
              </div>
              <p className="font-mono text-[10px] text-muted-foreground/90 leading-relaxed mt-2">
                <a
                  href={TEEN_STUDY.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline decoration-border hover:text-foreground transition-colors"
                >
                  {TEEN_STUDY.name}
                </a>
              </p>
            </div>
          ) : (
          <>
          {/* Platform estimates */}
          <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-2">
            Where they are · tap a row for the working
          </p>
          <div className="space-y-1 mb-4">
            {ranked.map(({ p, est }) => (
              <div key={p.id}>
                <button
                  onClick={() => setOpenRow(openRow === p.id ? null : p.id)}
                  className="w-full flex items-center gap-2 py-1 hover:bg-foreground/5 transition-colors text-left"
                >
                  <PlatformMark id={p.id} color={p.color} size={16} />
                  <span className="font-mono text-[11px] text-muted-foreground w-16 shrink-0">{p.name}</span>
                  <span className="flex-1 h-1.5 bg-secondary/50">
                    <span className="block h-full transition-all duration-500" style={{ width: `${est.value}%`, background: p.color, opacity: est.basis === "estimated" ? 0.55 : 0.9 }} />
                  </span>
                  <span className="font-mono text-xs text-foreground w-9 text-right tabular-nums shrink-0">{est.value}%</span>
                  <span
                    className="font-mono text-[8px] uppercase tracking-wider w-14 text-right shrink-0"
                    style={{ color: est.basis === "measured" ? "#10b981" : "#f59e0b" }}
                  >
                    {est.basis === "measured" ? "measured" : "est."}
                  </span>
                </button>
                {openRow === p.id && (
                  <div className="border-l-2 border-border ml-5 pl-3 py-2 mb-1">
                    <p className="font-mono text-[10px] text-foreground leading-relaxed">{est.derivation}</p>
                    <p className="font-mono text-[10px] text-muted-foreground leading-relaxed mt-1">
                      Sampling error ±{est.samplingMoe}pp.{est.caution ? ` ${est.caution}` : ""}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
          </>
          )}

          {/* Gaps */}
          {gaps.length > 0 && (
            <div className="border border-border p-3 mb-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-2">
                No data for these
              </p>
              {NO_DATA.filter((n) => gaps.includes(n.id)).map((n) => (
                <div key={n.id} className="mb-2 last:mb-0">
                  <p className="font-mono text-[10px] text-foreground">{n.label}</p>
                  <p className="font-mono text-[10px] text-muted-foreground leading-relaxed">{n.why}</p>
                  {n.proxy && (
                    <p className="font-mono text-[10px] text-muted-foreground/90 leading-relaxed mt-1">
                      {n.proxyUrl ? (
                        <a
                          href={n.proxyUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline decoration-border hover:text-foreground transition-colors"
                        >
                          {n.proxy}
                        </a>
                      ) : (
                        n.proxy
                      )}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Pattern */}
          {topPattern && (
            <div className="border border-border p-3 mb-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-1.5">
                Buying pattern · {topPattern.hits.length} of {topPattern.bp.trusts.length} sources matched
              </p>
              <p className="font-mono text-[11px] text-foreground leading-relaxed mb-1">{topPattern.bp.asks}</p>
              <p className="font-mono text-[10px] text-muted-foreground leading-relaxed">
                Won by: {topPattern.bp.wonBy}
              </p>
            </div>
          )}

          {/* Baseline */}
          <div className="border-t border-border/50 pt-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-1.5">
              The country they live in
            </p>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1">
              {US_CONTEXT.filter((f) => ["median-hh-income", "homeownership", "median-rent", "avg-debt"].includes(f.id)).map((f) => (
                <p key={f.id} className="font-mono text-[10px] text-muted-foreground leading-relaxed">
                  <span className="text-foreground">{f.value.split(",")[0]}</span> {f.metric.toLowerCase()}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
