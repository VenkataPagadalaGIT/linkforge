/**
 * The Top 100 AI Contributors as a shelf of volumes.
 *
 * One clothbound volume per person, ordered by rank: the name on the spine,
 * the affiliation as the byline, the bio in the panel, and the whole volume
 * linking to the full profile. The point is attention: a wall of names in a
 * directory is skimmed, a shelf of a hundred books is browsed.
 *
 * Cloth colour cycles a fixed editorial palette keyed by segment so people
 * from the same corner of the field sit in the same colour family, which
 * makes the shelf legible at a glance the way phase colours do for the
 * roadmap shelf.
 */
import { aiContributors } from "@/data/aiContributors";
import type { ShelfVolume } from "@/components/library/BookShelf";

/** Editorial cloth palette, one family per segment (fallback cycles). */
const SEGMENT_CLOTH: Record<string, string[]> = {
  default: ["#4a5c6a", "#7d8471", "#8b6f5c", "#46414d", "#5f7470", "#7a4f4a", "#6a5a7a", "#3f5245", "#8e5a44", "#35424a"],
};

const FOILS = ["#c9a227", "#d4c5a0"];
const MOTIFS: ShelfVolume["motif"][] = ["rule", "circle", "grid", "arc", "chevron", "dots", "band"];

function clothFor(segment: string, i: number): string {
  const palette = SEGMENT_CLOTH.default;
  // Same segment lands in the same slice of the palette: stable and legible.
  let h = 0;
  for (const c of segment) h = (h * 31 + c.charCodeAt(0)) | 0;
  return palette[(Math.abs(h) + i) % palette.length];
}

const sorted = [...aiContributors].sort((a, b) => a.rank - b.rank);

export const contributorShelfVolumes: ShelfVolume[] = sorted.map((c, i) => ({
  id: c.id,
  spineTitle: c.name.toUpperCase(),
  title: c.name,
  byline: c.affiliation,
  eyebrow: c.segment,
  note: c.bio,
  cloth: clothFor(c.segment, i % 3),
  foil: FOILS[i % 2],
  dims: [
    0.205 + (i % 6) * 0.009,
    Math.min(0.05, 0.024 + (c.resources?.length ?? 0) * 0.002 + (i % 3) * 0.003),
    0.145 + (i % 3) * 0.011,
  ],
  motif: MOTIFS[i % MOTIFS.length],
  primary: { label: "Open full profile →", href: `/ai-contributors/${c.id}` },
  coverFoot: `Nº ${String(c.rank).padStart(2, "0")} of ${aiContributors.length}`,
}));

export const contributorShelfStats = {
  volumes: contributorShelfVolumes.length,
};
