"use client";
import { Link } from "@/lib/router-shim";
import { Brain, Map, Users } from "lucide-react";
import { aiContributors } from "@/data/aiContributors";
import { encyclopediaConcepts } from "@/data/aiEncyclopedia";
import { roadmapTopics } from "@/data/aiRoadmap";

interface CrossLinksProps {
  relatedConcepts?: string[];
  relatedContributors?: string[];
  relatedTopics?: string[];
}

const CrossLinks = ({ relatedConcepts, relatedContributors, relatedTopics }: CrossLinksProps) => {
  const concepts = (relatedConcepts || [])
    .map((id) => encyclopediaConcepts.find((c) => c.id === id))
    .filter(Boolean)
    .slice(0, 4);

  const contributors = (relatedContributors || [])
    .map((id) => aiContributors.find((c) => c.id === id))
    .filter(Boolean)
    .slice(0, 4);

  const topics = (relatedTopics || [])
    .map((id) => roadmapTopics.find((t) => t.id === id))
    .filter(Boolean)
    .slice(0, 3);

  if (!concepts.length && !contributors.length && !topics.length) return null;

  return (
    <div className="mt-4 space-y-3">
      {concepts.length > 0 && (
        <div>
          <p className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest text-muted-foreground/30 mb-1.5">
            <Brain size={10} /> Related Concepts
          </p>
          <div className="flex flex-wrap gap-1.5">
            {concepts.map((c) => (
              <Link
                key={c!.id}
                to="/notebook/ai/encyclopedia"
                className="font-mono text-[10px] px-2 py-0.5 border border-border text-muted-foreground/50 hover:text-foreground hover:border-foreground/30 transition-all"
              >
                {c!.emoji} {c!.concept}
              </Link>
            ))}
          </div>
        </div>
      )}

      {topics.length > 0 && (
        <div>
          <p className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest text-muted-foreground/30 mb-1.5">
            <Map size={10} /> Related Roadmap Topics
          </p>
          <div className="flex flex-wrap gap-1.5">
            {topics.map((t) => (
              <Link
                key={t!.id}
                to="/notebook/ai/roadmap"
                className="font-mono text-[10px] px-2 py-0.5 border border-border text-muted-foreground/50 hover:text-foreground hover:border-foreground/30 transition-all"
              >
                W{t!.week} {t!.topic}
              </Link>
            ))}
          </div>
        </div>
      )}

      {contributors.length > 0 && (
        <div>
          <p className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest text-muted-foreground/30 mb-1.5">
            <Users size={10} /> Key Contributors
          </p>
          <div className="flex flex-wrap gap-1.5">
            {contributors.map((c) => (
              <Link
                key={c!.id}
                to={`/ai-contributors/${c!.id}`}
                className="font-mono text-[10px] px-2 py-0.5 border border-border text-muted-foreground/50 hover:text-foreground hover:border-foreground/30 transition-all"
              >
                {c!.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CrossLinks;
