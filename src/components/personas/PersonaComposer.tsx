"use client";

/**
 * PersonaComposer: drag demand sources into a profile and watch the
 * persona identify itself.
 *
 * This is the owner's brightonSEO method made operable. Twenty sources,
 * five categories, five buyer personas. Drop a mix of sources into the
 * profile and the composer scores it against what each persona actually
 * trusts, names the closest match, and fills in the six classification
 * dimensions.
 *
 * Why it is not a persona generator: it never invents a person. It reads
 * the sources you selected and tells you which known buyer pattern they
 * correspond to, or says the mix is too thin to call. Drag Facebook
 * Groups, Reddit and GBP Reviews and it will identify the Community
 * Buyer, because those are the three that persona trusts.
 *
 * Drag and drop is the primary interaction; every chip is also a button,
 * so the whole thing works by click, by keyboard and on touch.
 */

import { useMemo, useState } from "react";
import PlatformMark from "./PlatformMark";
import {
  BUYER_PERSONAS,
  CLASSIFICATION_DIMENSIONS,
  DEMAND_SOURCES,
  PLATFORMS,
  SOURCE_CATEGORY,
  WORKED_EXAMPLE,
  type SourceCategory,
} from "@/data/personas";

const CATS: SourceCategory[] = ["search", "social", "reviews", "market", "expert"];

export default function PersonaComposer() {
  const [dropped, setDropped] = useState<string[]>([]);
  const [dragOver, setDragOver] = useState(false);

  const add = (id: string) => setDropped((p) => (p.includes(id) ? p : [...p, id]));
  const remove = (id: string) => setDropped((p) => p.filter((x) => x !== id));

  /** Score each persona by how much of its trusted set is present. */
  const scored = useMemo(() => {
    if (!dropped.length) return [];
    return BUYER_PERSONAS.map((bp) => {
      const hits = bp.trusts.filter((t) => dropped.includes(t));
      return { bp, hits, score: hits.length / bp.trusts.length };
    }).sort((a, b) => b.score - a.score);
  }, [dropped]);

  const top = scored[0];
  const confident = top && top.score >= 0.5;
  const tied = scored.filter((s) => top && s.score === top.score).length > 1;

  const colorOf = (id: string) => PLATFORMS.find((p) => p.id === id)?.color;

  return (
    <div className="border border-border bg-card/20">
      <div className="grid lg:grid-cols-[1fr_320px]">
        {/* Palette */}
        <div className="p-5 border-b lg:border-b-0 lg:border-r border-border">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-1">
            Twenty demand sources
          </p>
          <p className="font-mono text-[11px] text-muted-foreground/90 mb-4">
            One box is search demand. The other nineteen are where buyers talk. Drag them into the
            profile, or click to add.
          </p>

          <div className="space-y-4">
            {CATS.map((cat) => {
              const meta = SOURCE_CATEGORY[cat];
              return (
                <div key={cat}>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span
                      className="inline-block w-2 h-2 shrink-0"
                      style={{ background: meta.color }}
                      aria-hidden="true"
                    />
                    <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-foreground">
                      {meta.label}
                    </span>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {meta.tells}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {DEMAND_SOURCES.filter((s) => s.category === cat).map((s) => {
                      const used = dropped.includes(s.id);
                      return (
                        <button
                          key={s.id}
                          draggable={!used}
                          onDragStart={(e) => e.dataTransfer.setData("text/plain", s.id)}
                          onClick={() => (used ? remove(s.id) : add(s.id))}
                          aria-pressed={used}
                          title={s.yields}
                          className={`inline-flex items-center gap-1.5 border px-2 py-1 transition-all cursor-grab active:cursor-grabbing ${
                            used
                              ? "border-foreground/50 bg-foreground/10 text-foreground"
                              : "border-border/60 text-muted-foreground hover:text-foreground hover:border-foreground/40"
                          }`}
                          style={used ? { borderLeftColor: meta.color, borderLeftWidth: 3 } : undefined}
                        >
                          {s.platformId && (
                            <PlatformMark id={s.platformId} color={colorOf(s.platformId) ?? meta.color} size={13} />
                          )}
                          <span className="font-mono text-[11px]">{s.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* The profile */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const id = e.dataTransfer.getData("text/plain");
            if (id) add(id);
          }}
          className={`p-5 transition-colors ${dragOver ? "bg-foreground/5" : ""}`}
        >
          <div className="flex items-center justify-between gap-2 mb-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
              The profile
            </p>
            {dropped.length > 0 && (
              <button
                onClick={() => setDropped([])}
                className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground border border-border px-2 py-0.5 transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          {/* Avatar + identity */}
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-14 h-14 rounded-full border flex items-center justify-center shrink-0 transition-colors"
              style={{
                borderColor: confident ? "var(--foreground)" : undefined,
              }}
            >
              <span className="font-display text-lg font-bold text-foreground">
                {confident && !tied ? top.bp.initials : "?"}
              </span>
            </div>
            <div className="min-w-0">
              <p className="font-display text-base font-bold text-foreground leading-tight">
                {!dropped.length
                  ? "Empty profile"
                  : confident && !tied
                    ? top.bp.name
                    : "Not enough to call it"}
              </p>
              <p className="font-mono text-[10px] text-muted-foreground mt-0.5">
                {!dropped.length
                  ? "Drop a source to begin"
                  : confident && !tied
                    ? `${top.bp.mode} · matched ${top.hits.length} of ${top.bp.trusts.length} trusted sources`
                    : "Add the sources this buyer would actually trust"}
              </p>
            </div>
          </div>

          {/* Dropped chips */}
          <div className="min-h-[64px] border border-dashed border-border/70 p-2.5 mb-4">
            {dropped.length === 0 ? (
              <p className="font-mono text-[10px] text-muted-foreground/80 leading-relaxed">
                Drag sources here. The profile identifies itself from what you drop, and stays
                unnamed until the mix is strong enough to justify a name.
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {dropped.map((id) => {
                  const s = DEMAND_SOURCES.find((x) => x.id === id);
                  if (!s) return null;
                  const meta = SOURCE_CATEGORY[s.category];
                  return (
                    <button
                      key={id}
                      onClick={() => remove(id)}
                      title="Remove"
                      className="inline-flex items-center gap-1.5 border border-border px-2 py-1 hover:border-foreground/50 transition-colors"
                      style={{ borderLeftColor: meta.color, borderLeftWidth: 3 }}
                    >
                      {s.platformId && (
                        <PlatformMark id={s.platformId} color={colorOf(s.platformId) ?? meta.color} size={12} />
                      )}
                      <span className="font-mono text-[10px] text-foreground">{s.name}</span>
                      <span className="font-mono text-[10px] text-muted-foreground">×</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Classification */}
          {confident && !tied && (
            <div className="border border-border p-3 mb-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-2">
                Classification
              </p>
              <dl className="space-y-1.5">
                {[
                  ["Persona", top.bp.name],
                  ["Intent", top.bp.mode],
                  ["Asks", top.bp.asks],
                  ["Won by", top.bp.wonBy],
                ].map(([k, v]) => (
                  <div key={k} className="grid grid-cols-[62px_1fr] gap-2">
                    <dt className="font-mono text-[10px] text-muted-foreground">{k}</dt>
                    <dd className="font-mono text-[10px] text-foreground leading-relaxed">{v}</dd>
                  </div>
                ))}
              </dl>
              {top.bp.note && (
                <p className="font-mono text-[10px] text-muted-foreground mt-2 pt-2 border-t border-border/50">
                  {top.bp.note}
                </p>
              )}
            </div>
          )}

          {/* Ranked alternatives, so the match is never a black box */}
          {dropped.length > 0 && (
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-2">
                Match against all five
              </p>
              <div className="space-y-1.5">
                {scored.map(({ bp, hits, score }) => (
                  <div key={bp.id} className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-muted-foreground w-7 shrink-0">
                      {bp.initials}
                    </span>
                    <span className="font-mono text-[10px] text-muted-foreground w-28 shrink-0 truncate">
                      {bp.name}
                    </span>
                    <span className="flex-1 h-1.5 bg-secondary/50">
                      <span
                        className="block h-full bg-foreground/70 transition-all duration-400"
                        style={{ width: `${score * 100}%` }}
                      />
                    </span>
                    <span className="font-mono text-[10px] text-muted-foreground w-8 text-right tabular-nums shrink-0">
                      {hits.length}/{bp.trusts.length}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Worked example */}
      <div className="border-t border-border p-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-2">
          Worked example · six dimensions, one signal
        </p>
        <p className="font-mono text-xs text-foreground mb-3">
          &ldquo;{WORKED_EXAMPLE.query}&rdquo;
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-1.5 mb-3">
          {WORKED_EXAMPLE.rows.map((r) => (
            <div key={r.k} className="grid grid-cols-[80px_1fr] gap-2">
              <span className="font-mono text-[10px] text-muted-foreground">{r.k}</span>
              <span className="font-mono text-[10px] text-foreground">{r.v}</span>
            </div>
          ))}
        </div>
        <p className="font-mono text-[11px] text-foreground">
          <span className="text-muted-foreground">Output: </span>
          {WORKED_EXAMPLE.output}
        </p>
        <p className="font-mono text-[10px] text-muted-foreground/80 leading-relaxed mt-3 pt-3 border-t border-border/50">
          Framework: the author&apos;s own method, presented at brightonSEO San Diego 2026. The five
          personas and twenty sources are an analytical model, not survey findings, and are labelled
          as such. Personal perspective. The demographic data elsewhere on this page is separately
          sourced and cited. Classified across {CLASSIFICATION_DIMENSIONS.length} dimensions:{" "}
          {CLASSIFICATION_DIMENSIONS.join(", ")}.
        </p>
      </div>
    </div>
  );
}
