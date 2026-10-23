"use client";
import { Link } from "@/lib/router-shim";
import { aiContributors } from "@/data/aiContributors";

/**
 * People named in a story, rendered as face, name, role, and a link.
 *
 * A story about a person should say who that person is and let a reader reach
 * the full profile in one click. It also makes the relationship explicit for
 * crawlers: an internal link from the article to the person, paired with the
 * reverse link the profile already renders, is what lets a search engine or an
 * assistant treat the two pages as being about the same entity rather than two
 * unrelated documents that happen to share a name.
 *
 * Photos are local files in public/photos. Anyone without one falls back to a
 * monogram rather than a broken image.
 */
const ContributorCards = ({ ids }: { ids: string[] }) => {
  const people = ids
    .map((id) => aiContributors.find((c) => c.id === id))
    .filter((c): c is NonNullable<typeof c> => Boolean(c));

  if (!people.length) return null;

  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {people.map((c) => (
        <Link
          key={c.id}
          to={`/ai-contributors/${c.id}`}
          className="group flex items-start gap-4 border border-border p-4 hover:bg-secondary/20 border-glow-hover transition-all"
        >
          {c.photoUrl ? (
            <img
              src={c.photoUrl}
              alt={c.name}
              loading="lazy"
              width={56}
              height={56}
              className="w-14 h-14 object-cover border border-border shrink-0 grayscale group-hover:grayscale-0 transition-all"
            />
          ) : (
            <div className="w-14 h-14 border border-border shrink-0 grid place-items-center font-display text-lg font-bold text-muted-foreground/70">
              {c.name
                .split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("")}
            </div>
          )}
          <div className="min-w-0">
            <p className="font-display text-sm font-bold text-foreground group-hover:text-glow transition-all leading-snug">
              {c.name}
            </p>
            <p className="font-mono text-[10px] text-muted-foreground/70 mb-1">{c.affiliation}</p>
            <p className="font-mono text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
              {c.bio}
            </p>
            <span className="inline-block mt-1.5 font-mono text-[10px] text-muted-foreground/70 group-hover:text-foreground transition-colors">
              Full profile →
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
};

export default ContributorCards;
