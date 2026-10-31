import type { EventFile } from "@/data/events";

/**
 * The picture that stands for a story on its own surfaces (the feed's first post, the hub, Topics): an image from an
 * official post, never a creator's thumbnail. The Binance file's top video thumbnail reads "$5.8 BILLION" against a
 * verified $6.3B to $6.43B, so a featured source's frame can carry a claim the story itself does not make.
 */
export function coverOf(e: EventFile): string | null {
  return e.sources.find((s) => s.voice === "official" && s.thumb)?.thumb ?? null;
}
