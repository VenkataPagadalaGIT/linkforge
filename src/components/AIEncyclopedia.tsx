"use client";
import { useState, useMemo } from "react";
import { encyclopediaConcepts, ENCYCLOPEDIA_CATEGORIES, type EncyclopediaConcept } from "@/data/aiEncyclopedia";
import { encyclopediaToContributors, encyclopediaToRoadmap } from "@/data/crossLinks";
import { Search, ChevronDown, ChevronUp, ExternalLink, Tag, BookOpen } from "lucide-react";
import CrossLinks from "@/components/CrossLinks";

const diffBadge: Record<string, string> = {
  beginner: "border-green-500/30 text-green-400",
  intermediate: "border-yellow-500/30 text-yellow-400",
  advanced: "border-red-500/30 text-red-400",
};

const ConceptCard = ({ concept, isOpen, onToggle }: { concept: EncyclopediaConcept; isOpen: boolean; onToggle: () => void }) => {
  const cat = ENCYCLOPEDIA_CATEGORIES.find((c) => c.label === concept.category);

  return (
    <div className="border border-border hover:border-foreground/20 transition-all">
      <button
        onClick={onToggle}
        className="w-full text-left px-5 py-4 flex items-start gap-3"
      >
        <span className="text-lg shrink-0 mt-0.5">{concept.emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="font-display text-sm font-bold text-foreground">{concept.concept}</h3>
            <span className={`font-mono text-[9px] uppercase tracking-wider border px-1.5 py-0.5 ${diffBadge[concept.difficulty]}`}>
              {concept.difficulty}
            </span>
          </div>
          <p className="font-mono text-[11px] text-muted-foreground/50 leading-relaxed line-clamp-2">
            {concept.description}
          </p>
        </div>
        <div className="shrink-0 mt-1">
          {isOpen ? (
            <ChevronUp size={14} className="text-muted-foreground/30" />
          ) : (
            <ChevronDown size={14} className="text-muted-foreground/30" />
          )}
        </div>
      </button>

      {isOpen && (
        <div className="px-5 pb-5 border-t border-border pt-4 space-y-4">
          <p className="font-mono text-xs text-muted-foreground/60 leading-relaxed">
            {concept.description}
          </p>

          {cat && (
            <div className="flex items-center gap-2">
              <Tag size={10} className="text-muted-foreground/30" />
              <span className="font-mono text-[10px]" style={{ color: cat.color }}>
                {cat.emoji} {cat.label}
              </span>
            </div>
          )}

          {concept.keyTerms.length > 0 && (
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/30 mb-2">Key Terms</p>
              <div className="flex flex-wrap gap-1.5">
                {concept.keyTerms.map((term) => (
                  <span key={term} className="font-mono text-[10px] px-2 py-0.5 border border-border text-muted-foreground/50">
                    {term}
                  </span>
                ))}
              </div>
            </div>
          )}

          {concept.prerequisites.length > 0 && (
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/30 mb-2">Prerequisites</p>
              <div className="flex flex-wrap gap-1.5">
                {concept.prerequisites.map((p) => (
                  <span key={p} className="font-mono text-[10px] px-2 py-0.5 border border-border text-muted-foreground/40 italic">
                    {p}
                  </span>
                ))}
              </div>
            </div>
          )}

          {concept.realWorldApps && (
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/30 mb-1">Real-World Applications</p>
              <p className="font-mono text-[11px] text-muted-foreground/50">{concept.realWorldApps}</p>
            </div>
          )}

          {concept.learnMore.length > 0 && (
            <div>
              <p className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground/30 mb-2">
                <BookOpen size={10} /> Learn More
              </p>
              <div className="space-y-1">
                {concept.learnMore.map((link, i) => (
                  <a
                    key={i}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ExternalLink size={10} className="shrink-0" />
                    {link.title}
                  </a>
                ))}
              </div>
            </div>
          )}

          <CrossLinks
            relatedTopics={encyclopediaToRoadmap[concept.id]}
            relatedContributors={encyclopediaToContributors[concept.id]}
          />
        </div>
      )}
    </div>
  );
};

const AIEncyclopedia = () => {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [activeDifficulty, setActiveDifficulty] = useState<string>("");
  const [openId, setOpenId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let items = [...encyclopediaConcepts];
    if (activeCategory) items = items.filter((c) => c.category === activeCategory);
    if (activeDifficulty) items = items.filter((c) => c.difficulty === activeDifficulty);
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(
        (c) =>
          c.concept.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.keyTerms.some((t) => t.toLowerCase().includes(q)) ||
          c.category.toLowerCase().includes(q)
      );
    }
    return items;
  }, [search, activeCategory, activeDifficulty]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    encyclopediaConcepts.forEach((c) => {
      counts[c.category] = (counts[c.category] || 0) + 1;
    });
    return counts;
  }, []);

  return (
    <div>
      {/* Stats */}
      <div className="flex flex-wrap gap-4 mb-6">
        {[
          { label: "Concepts", value: encyclopediaConcepts.length },
          { label: "Categories", value: ENCYCLOPEDIA_CATEGORIES.length },
          { label: "Beginner", value: encyclopediaConcepts.filter(c => c.difficulty === "beginner").length },
          { label: "Intermediate", value: encyclopediaConcepts.filter(c => c.difficulty === "intermediate").length },
          { label: "Advanced", value: encyclopediaConcepts.filter(c => c.difficulty === "advanced").length },
        ].map((s) => (
          <div key={s.label}>
            <p className="font-mono text-lg font-bold text-foreground">{s.value}</p>
            <p className="font-mono text-[9px] text-muted-foreground/25 uppercase tracking-widest">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/30" />
        <input
          type="text"
          placeholder="Search concepts, terms, categories..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-transparent border border-border pl-9 pr-4 py-2.5 font-mono text-xs text-foreground placeholder:text-muted-foreground/20 focus:outline-none focus:border-foreground/30"
        />
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        <button
          onClick={() => setActiveCategory("")}
          className={`font-mono text-[10px] uppercase tracking-wider px-3 py-1.5 border transition-all ${
            !activeCategory ? "border-foreground text-foreground" : "border-border text-muted-foreground/30 hover:text-muted-foreground"
          }`}
        >
          All ({encyclopediaConcepts.length})
        </button>
        {ENCYCLOPEDIA_CATEGORIES.map((cat) => (
          <button
            key={cat.label}
            onClick={() => setActiveCategory(activeCategory === cat.label ? "" : cat.label)}
            className={`font-mono text-[10px] uppercase tracking-wider px-3 py-1.5 border transition-all ${
              activeCategory === cat.label
                ? "text-foreground"
                : "border-border text-muted-foreground/30 hover:text-muted-foreground"
            }`}
            style={
              activeCategory === cat.label
                ? { borderColor: cat.color + "60", color: cat.color }
                : {}
            }
          >
            {cat.emoji} {cat.label.split(" ").slice(-1)[0]} ({categoryCounts[cat.label] || 0})
          </button>
        ))}
      </div>

      {/* Difficulty filters */}
      <div className="flex gap-1.5 mb-6">
        {(["beginner", "intermediate", "advanced"] as const).map((d) => (
          <button
            key={d}
            onClick={() => setActiveDifficulty(activeDifficulty === d ? "" : d)}
            className={`font-mono text-[10px] uppercase tracking-wider px-3 py-1.5 border transition-all ${
              activeDifficulty === d
                ? diffBadge[d]
                : "border-border text-muted-foreground/30 hover:text-muted-foreground"
            }`}
          >
            {d}
          </button>
        ))}
      </div>

      {/* Concepts list */}
      <div className="space-y-2">
        {filtered.map((concept) => (
          <ConceptCard
            key={concept.id}
            concept={concept}
            isOpen={openId === concept.id}
            onToggle={() => setOpenId(openId === concept.id ? null : concept.id)}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="font-mono text-xs text-muted-foreground/30 text-center py-10">
          No concepts found matching your search.
        </p>
      )}
    </div>
  );
};

export default AIEncyclopedia;
