/**
 * The AI Roadmap as a shelf of books.
 *
 * Every roadmap topic becomes one clothbound volume: cloth colour derives
 * from its phase colour (muted toward the shelf's warm palette so six bright
 * UI hexes become a believable row of cloth), thickness derives from how many
 * resources the topic carries, and the inspect panel lists a sample of those
 * resources with type and access badges. Every volume anchors back into the
 * full roadmap list on the same page, so the shelf is a way IN to the
 * roadmap, never a second copy of it.
 */
import { roadmapTopics, type RoadmapResource, type RoadmapTopic } from "@/data/aiRoadmap";
import type { ShelfVolume, ShelfDetail } from "@/components/library/BookShelf";

/** Mix a bright phase colour toward warm gray so it reads as cloth. */
function toCloth(hex: string, amount = 0.52): string {
  const base = parseInt(hex.slice(1), 16);
  const gray = { r: 0x6d, g: 0x64, b: 0x58 }; // warm neutral
  const r = Math.round(((base >> 16) & 255) * (1 - amount) + gray.r * amount);
  const g = Math.round(((base >> 8) & 255) * (1 - amount) + gray.g * amount);
  const b = Math.round((base & 255) * (1 - amount) + gray.b * amount);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

const MOTIFS: ShelfVolume["motif"][] = ["rule", "circle", "grid", "arc", "chevron", "dots", "band"];
const FOILS = ["#c9a227", "#d4c5a0"];

function accessBadge(r: RoadmapResource): string | undefined {
  if (r.access === "paid") return "paid";
  if (r.access === "freemium") return "freemium";
  return undefined;
}

function sampleDetails(t: RoadmapTopic): ShelfDetail[] {
  const pick = (list: RoadmapResource[], badge: string, n: number): ShelfDetail[] =>
    list.slice(0, n).map((r) => ({ label: r.title, href: r.url, badge, badge2: accessBadge(r) }));
  return [
    ...pick(t.bestVideos, "video", 2),
    ...pick(t.bestCourses, "course", 2),
    ...pick(t.books, "book", 1),
    ...pick(t.githubRepos, "repo", 1),
  ];
}

export const roadmapShelfVolumes: ShelfVolume[] = roadmapTopics.map((t, i) => {
  const total = t.bestVideos.length + t.bestCourses.length + t.books.length + t.githubRepos.length;
  const shortTitle = t.topic.split("·")[0].trim();
  const phase = t.phase.replace(/^[^A-Za-z]+/, "");
  return {
    id: t.id,
    spineTitle: shortTitle.toUpperCase(),
    title: shortTitle,
    byline: `Week ${t.week} · ${t.difficulty}`,
    eyebrow: phase,
    note: t.description,
    cloth: toCloth(t.phaseColor),
    foil: FOILS[i % 2],
    dims: [
      0.21 + (i % 5) * 0.011,
      Math.min(0.058, Math.max(0.024, 0.02 + total * 0.0011)),
      0.15 + (i % 3) * 0.012,
    ],
    motif: MOTIFS[i % MOTIFS.length],
    primary: { label: "Open in the roadmap ↓", href: `#topic-${t.id}` },
    details: sampleDetails(t),
    detailsMore: { label: `All ${total} resources ↓`, href: `#topic-${t.id}` },
    coverFoot: "Part of the free AI roadmap",
  };
});

export const roadmapShelfStats = {
  volumes: roadmapShelfVolumes.length,
  /** The taught core only. Weeks past this are elective depth tracks, so the
   *  old max-week reading advertised a 25-week march nobody is asked to do. */
  coreWeeks: Math.max(...roadmapTopics.filter((t) => t.week <= 18).map((t) => t.week)),
  electives: roadmapTopics.filter((t) => t.week > 18).length,
};
