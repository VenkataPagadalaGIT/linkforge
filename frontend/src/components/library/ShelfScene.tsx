"use client";
/**
 * The Complete Shelf: nineteen free books on the generic BookShelf.
 *
 * All the 3D lives in BookShelf; this file only maps the curated book data
 * onto shelf volumes. The roadmap and contributors shelves are the same
 * component with different mappings, so a rendering fix lands on all three.
 */
import BookShelf, { type ShelfVolume } from "./BookShelf";
import { shelfBooks } from "@/data/libraryShelf";

const volumes: ShelfVolume[] = shelfBooks.map((b) => ({
  id: b.id,
  spineTitle: b.spineTitle,
  title: b.title,
  byline: b.author,
  eyebrow: b.topic,
  note: b.note,
  cloth: b.cloth,
  foil: b.foil,
  dims: b.dims,
  motif: b.motif,
  primary: { label: "Read it free →", href: b.url, external: true },
  bylineLink: b.contributorId
    ? { label: "profile", href: `/ai-contributors/${b.contributorId}` }
    : undefined,
  coverFoot: "Free to read online",
}));

const ShelfScene = ({ glPower = "high-performance" }: { glPower?: "high-performance" | "default" }) => (
  <BookShelf
    volumes={volumes}
    coverBrand="The Complete Shelf"
    captions={["19 volumes · all free", "01 continuous shelf"]}
    glPower={glPower}
  />
);

export default ShelfScene;
