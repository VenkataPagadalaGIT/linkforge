"use client";
import { useState } from "react";
import { AI_GLOSSARY } from "@/data/aiNotebook";
import { aiContributors, SEGMENT_COLORS } from "@/data/aiContributors";
import { Search } from "lucide-react";

interface Props {
  onSelectContributor?: (id: string) => void;
}

const categoryColors: Record<string, string> = {
  architecture: "border-red-400/20 text-red-400/70",
  technique: "border-blue-400/20 text-blue-400/70",
  concept: "border-yellow-400/20 text-yellow-400/70",
  application: "border-green-400/20 text-green-400/70",
  infrastructure: "border-purple-400/20 text-purple-400/70",
};

const AIGlossary = ({ onSelectContributor }: Props) => {
  const [search, setSearch] = useState("");
  const [expandedTerm, setExpandedTerm] = useState<string | null>(null);

  const filtered = AI_GLOSSARY.filter(
    (t) =>
      t.term.toLowerCase().includes(search.toLowerCase()) ||
      t.definition.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Search */}
      <div className="relative mb-6">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/30" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search concepts..."
          className="w-full bg-background border border-border pl-9 pr-4 py-2.5 font-mono text-xs text-foreground placeholder:text-muted-foreground/20 focus:outline-none focus:border-foreground/30 transition-colors"
        />
      </div>

      {/* Category legend */}
      <div className="flex flex-wrap gap-2 mb-6">
        {["architecture", "technique", "concept", "application", "infrastructure"].map((cat) => (
          <span
            key={cat}
            className={`font-mono text-[9px] px-2 py-0.5 border uppercase tracking-widest ${categoryColors[cat]}`}
          >
            {cat}
          </span>
        ))}
      </div>

      {/* Terms */}
      <div className="space-y-2">
        {filtered.map((term) => {
          const isExpanded = expandedTerm === term.term;
          const pioneers = (term.pioneeredBy || [])
            .map((id) => aiContributors.find((c) => c.id === id))
            .filter(Boolean);

          return (
            <div key={term.term} className="border border-border overflow-hidden">
              <button
                onClick={() => setExpandedTerm(isExpanded ? null : term.term)}
                className="w-full text-left p-4 flex items-center justify-between gap-3 hover:bg-foreground/[0.02] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`font-mono text-[8px] px-1.5 py-0.5 border uppercase tracking-wider shrink-0 ${categoryColors[term.category]}`}
                  >
                    {term.category.slice(0, 4)}
                  </span>
                  <h4 className="font-display text-sm font-bold text-foreground">{term.term}</h4>
                </div>
                {pioneers.length > 0 && (
                  <div className="flex -space-x-1 shrink-0">
                    {pioneers.slice(0, 3).map((c) => {
                      if (!c) return null;
                      const color = SEGMENT_COLORS[c.segment] || "#888";
                      return (
                        <div
                          key={c.id}
                          className="w-5 h-5 flex items-center justify-center font-mono text-[7px] font-bold text-background border border-background"
                          style={{ backgroundColor: color }}
                          title={c.name}
                        >
                          {c.name.split(" ").map((w) => w[0]).join("")}
                        </div>
                      );
                    })}
                  </div>
                )}
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 animate-in fade-in duration-200">
                  <p className="font-mono text-[11px] text-muted-foreground leading-[1.8] mb-4">
                    {term.definition}
                  </p>

                  {/* Pioneered by */}
                  {pioneers.length > 0 && (
                    <div className="mb-3">
                      <span className="font-mono text-[9px] text-muted-foreground/30 uppercase tracking-widest">
                        Pioneered by:{" "}
                      </span>
                      {pioneers.map((c, i) => {
                        if (!c) return null;
                        return (
                          <span key={c.id}>
                            <button
                              onClick={() => onSelectContributor?.(c.id)}
                              className="font-mono text-[10px] text-foreground/60 hover:text-foreground underline underline-offset-2 transition-colors"
                            >
                              {c.name}
                            </button>
                            {i < pioneers.length - 1 && <span className="text-muted-foreground/20">, </span>}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* Related terms */}
                  {term.relatedTerms && term.relatedTerms.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      <span className="font-mono text-[9px] text-muted-foreground/20 self-center mr-1">Related:</span>
                      {term.relatedTerms.map((rt) => (
                        <button
                          key={rt}
                          onClick={() => {
                            setExpandedTerm(rt);
                            setSearch("");
                          }}
                          className="font-mono text-[9px] px-2 py-0.5 border border-border text-muted-foreground/40 hover:text-foreground hover:border-foreground/20 transition-all"
                        >
                          {rt}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <p className="text-center font-mono text-xs text-muted-foreground/30 py-8">No concepts found</p>
      )}
    </div>
  );
};

export default AIGlossary;
