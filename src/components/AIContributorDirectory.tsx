"use client";
import { useState, useMemo } from "react";
import { aiContributors, AI_SEGMENTS, EXPERT_TYPES, SEGMENT_COLORS, type AIContributor } from "@/data/aiContributors";
import { ExternalLink, Search } from "lucide-react";

interface Props {
  onSelect: (contributor: AIContributor) => void;
  selectedId?: string;
  filterSegment?: string;
}

const AIContributorDirectory = ({ onSelect, selectedId, filterSegment }: Props) => {
  const [search, setSearch] = useState("");
  const [expertFilter, setExpertFilter] = useState<string>("");

  const filtered = useMemo(() => {
    let list = [...aiContributors].sort((a, b) => a.rank - b.rank);
    if (filterSegment) list = list.filter((c) => c.segment === filterSegment);
    if (expertFilter) list = list.filter((c) => c.expertType === expertFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.affiliation.toLowerCase().includes(q) ||
          c.specialty.some((s) => s.toLowerCase().includes(q)) ||
          c.segment.toLowerCase().includes(q)
      );
    }
    return list;
  }, [search, expertFilter, filterSegment]);

  return (
    <div>
      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/40" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, affiliation, specialty..."
            className="w-full bg-background border border-border pl-9 pr-4 py-2 font-mono text-xs text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-foreground/30 transition-colors"
          />
        </div>
        <select
          value={expertFilter}
          onChange={(e) => setExpertFilter(e.target.value)}
          className="bg-background border border-border px-3 py-2 font-mono text-xs text-foreground focus:outline-none focus:border-foreground/30 transition-colors"
        >
          <option value="">All Types</option>
          {EXPERT_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      {/* Count */}
      <p className="font-mono text-[10px] text-muted-foreground/40 mb-4 tracking-wider">
        {filtered.length} CONTRIBUTOR{filtered.length !== 1 ? "S" : ""}
      </p>

      {/* Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((contributor) => {
          const color = SEGMENT_COLORS[contributor.segment] || "#888";
          const isSelected = selectedId === contributor.id;
          return (
            <button
              key={contributor.id}
              onClick={() => onSelect(contributor)}
              className={`text-left border p-4 transition-all hover:border-foreground/30 group ${
                isSelected ? "border-foreground/40 bg-foreground/5" : "border-border"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-9 h-9 flex items-center justify-center font-mono text-[10px] font-bold text-background shrink-0 mt-0.5"
                  style={{ backgroundColor: color }}
                >
                  {contributor.name.split(" ").map((w) => w[0]).join("")}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-mono text-[10px] text-muted-foreground/30">#{contributor.rank}</span>
                    <h4 className="font-display text-sm font-bold text-foreground truncate">{contributor.name}</h4>
                  </div>
                  <p className="font-mono text-[10px] text-muted-foreground truncate">{contributor.affiliation}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    <span
                      className="font-mono text-[9px] px-1.5 py-0.5 border"
                      style={{ borderColor: `${color}40`, color: `${color}` }}
                    >
                      {contributor.segment.split(" ")[0]}
                    </span>
                    <span className="font-mono text-[9px] px-1.5 py-0.5 border border-border text-muted-foreground/50">
                      {contributor.expertType}
                    </span>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <p className="font-mono text-xs text-muted-foreground/40">No contributors match your filters</p>
        </div>
      )}
    </div>
  );
};

export default AIContributorDirectory;
