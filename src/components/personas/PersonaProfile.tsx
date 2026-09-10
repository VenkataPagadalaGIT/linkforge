import Link from "next/link";
import PlatformMark from "./PlatformMark";
import { PLATFORMS, TECH_ACCESS, reachAny, allSegmentById } from "@/data/personas";
import { NEWS_CHANNELS } from "@/data/newsChannels";

/**
 * The measured picture behind a written persona.
 *
 * A persona page is prose, and prose is where a plausible-sounding claim hides
 * easiest. This puts the published cells for the same segments beside it: what
 * this group actually uses, how they get online, where they get news. Every
 * bar is a cell somebody published for these exact segments, so the narrative
 * above can be checked against it rather than taken on trust.
 *
 * Nothing here is combined. Where two segments both have a published figure,
 * both are shown; the studio is where combining happens and shows its working.
 */

export default function PersonaProfile({
  segmentIds,
  studioNote,
}: {
  segmentIds: string[];
  studioNote?: string;
}) {
  const segs = segmentIds.map(allSegmentById).filter(Boolean) as NonNullable<
    ReturnType<typeof allSegmentById>
  >[];
  if (!segs.length) return null;

  const rows = PLATFORMS.map((p) => ({
    p,
    cells: segs.map((s) => ({ seg: s, v: reachAny(p.id, s.id) })),
  }))
    .filter((r) => r.cells.some((c) => c.v !== undefined))
    .sort((a, b) => (b.cells[0].v ?? 0) - (a.cells[0].v ?? 0));

  return (
    <div className="space-y-8">
      <div>
        <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1">
          What this group actually uses
        </h3>
        <p className="font-mono text-[10px] text-muted-foreground/90 leading-relaxed mb-3">
          One bar per segment, each a published cell. Not combined: no study measures the overlap,
          and the studio is where an estimate would be made and shown.
        </p>
        <div className="space-y-1.5">
          {rows.map(({ p, cells }) => (
            <div key={p.id} className="flex items-center gap-2">
              <PlatformMark id={p.id} color={p.color} size={14} />
              <span className="font-mono text-[11px] text-muted-foreground w-20 shrink-0 truncate">
                {p.name}
              </span>
              <span className="flex-1 space-y-0.5">
                {cells.map(({ seg, v }) =>
                  v === undefined ? null : (
                    <span key={seg.id} className="flex items-center gap-2">
                      <span className="flex-1 h-1.5 bg-secondary/50">
                        <span className="block h-full" style={{ width: `${v}%`, background: p.color, opacity: 0.8 }} />
                      </span>
                      <span className="font-mono text-[10px] text-foreground w-8 text-right tabular-nums shrink-0">
                        {v}%
                      </span>
                      <span className="font-mono text-[9px] text-muted-foreground w-24 shrink-0 truncate">
                        {seg.label} ±{seg.moe}
                      </span>
                    </span>
                  ),
                )}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-8">
        <div>
          <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-3">
            How they get online
          </h3>
          <table className="w-full">
            <thead>
              <tr className="text-left">
                <th className="pb-1 pr-2 font-mono text-[9px] uppercase tracking-wider text-muted-foreground/80">&nbsp;</th>
                {segs.map((s) => (
                  <th key={s.id} className="pb-1 font-mono text-[9px] uppercase tracking-wider text-muted-foreground/80 text-right whitespace-nowrap">
                    {s.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TECH_ACCESS.map((m) => (
                <tr key={m.id} className="border-t border-border/30">
                  <td className="py-1 pr-2 font-mono text-[10px] text-muted-foreground leading-tight">
                    {m.label}
                  </td>
                  {segs.map((s) => (
                    <td key={s.id} className="py-1 font-mono text-[10px] text-foreground text-right tabular-nums">
                      {m.by[s.id] === undefined ? (
                        <span className="text-muted-foreground/70">n/p</span>
                      ) : (
                        `${m.by[s.id]}%`
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div>
          <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-3">
            Where they get news
          </h3>
          <div className="space-y-1">
            {NEWS_CHANNELS.map((c) => {
              const hit = segs.find((s) => c.by[s.id] !== undefined);
              const v = hit ? c.by[hit.id] : c.overall;
              const delta = hit ? v - c.overall : 0;
              return (
                <div key={c.id} className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-muted-foreground w-24 shrink-0 truncate">
                    {c.label}
                  </span>
                  <span className="flex-1 h-1.5 bg-secondary/50">
                    <span className="block h-full" style={{ width: `${v}%`, background: "var(--foreground)", opacity: 0.6 }} />
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
        </div>
      </div>

      <div className="border border-border p-4">
        <p className="font-mono text-[11px] text-muted-foreground leading-relaxed mb-3">
          {studioNote ??
            "This persona is one written example. The studio takes any combination of traits, estimates what nobody published, and prints the arithmetic."}
        </p>
        <Link
          href="/personas"
          className="inline-block border border-border px-4 py-2 font-mono text-xs text-foreground hover:border-foreground/50 hover:bg-foreground/5 transition-all"
        >
          Build this audience in the studio
        </Link>
      </div>
    </div>
  );
}
