/**
 * How the news feed is ordered, in one small function anyone can read and audit. It is built for 10,000 stories and more:
 * a story's place comes from how new it is and how well it is evidenced, never from what keeps people scrolling.
 *
 *  - Freshness halves every 14 days, so yesterday beats last month, but a deeply sourced story holds up for a while.
 *  - Evidence: how many sources were read and primary documents kept, on a log scale (300 sources is the top).
 *  - Checked: claims given a verdict against their sources.
 *  - Live: a story still inside its event window sits above the rest.
 *
 * No personal signal and no engagement signal go in: the reader's own filters decide what they see, and the order is the
 * same for everyone, so it can be explained on the card ("why it is here").
 */
export interface RankSignals {
  /** yyyy-mm-dd */
  date: string;
  sources: number;
  documents: number;
  claims: number;
  live: boolean;
}

const HALF_LIFE_DAYS = 14;
const DAY = 86_400_000;

export const ageDays = (date: string, today: string) => Math.max(0, (Date.parse(today) - Date.parse(date)) / DAY);

export function rankScore(s: RankSignals, today: string): number {
  const fresh = 0.5 ** (ageDays(s.date, today) / HALF_LIFE_DAYS);
  const evidence = Math.min(1, Math.log10(1 + s.sources + s.documents * 3) / Math.log10(301));
  const checked = Math.min(1, s.claims / 10);
  return 0.6 * fresh + 0.25 * evidence + 0.15 * checked + (s.live ? 0.25 : 0);
}

/** The reasons a reader sees, in words. */
export function rankReasons(s: RankSignals, today: string): string[] {
  const days = Math.round(ageDays(s.date, today));
  const when = days === 0 ? "today" : days === 1 ? "yesterday" : days < 60 ? `${days} days ago` : `${Math.round(days / 30)} months ago`;
  return [
    s.live ? "Live" : null,
    when,
    s.sources ? `${s.sources} sources` : null,
    s.documents ? `${s.documents} primary documents` : null,
    s.claims ? `${s.claims} claims checked` : null,
  ].filter((x): x is string => Boolean(x));
}

/** Highest score first; the same inputs always give the same order. */
export function rankStories<T extends RankSignals & { title: string }>(stories: T[], today: string): T[] {
  return [...stories].sort((a, b) => rankScore(b, today) - rankScore(a, today) || b.date.localeCompare(a.date) || a.title.localeCompare(b.title));
}
