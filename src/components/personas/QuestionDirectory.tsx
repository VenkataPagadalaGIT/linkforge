import Link from "next/link";
import PlatformMark from "./PlatformMark";
import { QUESTIONS } from "@/data/corpusQuestions";
import { PLATFORMS } from "@/data/personas";
import { corpusMetric } from "@/data/corpus";
import { QUESTIONS as ALL } from "@/data/corpusQuestions";

/**
 * Every question this corpus answers, linked.
 *
 * The pages existed and nothing linked to them, so they were reachable only
 * from the sitemap: fine for a crawler that is already interested, useless for
 * a reader and weak as a ranking signal. Grouped by the question being asked
 * rather than alphabetically, with the answer shown on the link, so the list
 * is worth reading even if nobody clicks.
 */

const GROUPS = [
  { id: "platform", label: "Which platforms they use", match: (s: string) => s.startsWith("who-uses-") && !s.includes("internet") && !s.includes("smartphone") },
  { id: "count", label: "How many people use them", match: (s: string) => s.startsWith("how-many-") },
  { id: "news", label: "Where they get news", match: (s: string) => s.startsWith("who-gets-news") },
  { id: "access", label: "How they get online", match: (s: string) => s.includes("broadband") || s.includes("internet") || s.includes("smartphone") },
];

export default function QuestionDirectory({ exclude }: { exclude?: string }) {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-6">
      {GROUPS.map((g) => {
        const items = QUESTIONS.filter((q) => g.match(q.slug) && q.slug !== exclude);
        if (!items.length) return null;
        return (
          <div key={g.id}>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">
              {g.label}
              <span className="ml-1.5 tracking-normal text-muted-foreground/80 normal-case">
                {items[0]?.dataYear} data
              </span>
            </p>
            <ul className="space-y-1">
              {items.map((q) => {
                const m = corpusMetric(q.metric);
                const national = m?.values[q.subject]?.[""];
                const plat = PLATFORMS.find((p) => p.id === q.subject);
                return (
                  <li key={q.slug}>
                    <Link
                      href={`/personas/${q.slug}`}
                      className="group flex items-baseline gap-1.5 font-mono text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {plat ? (
                        <span className="translate-y-0.5">
                          <PlatformMark id={plat.id} color={plat.color} size={11} />
                        </span>
                      ) : null}
                      <span className="underline decoration-border group-hover:decoration-foreground/50 truncate">
                        {q.short}
                      </span>
                      {national !== undefined && (
                        <span className="text-foreground tabular-nums shrink-0">{national}%</span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
