"use client";
import { useState, useMemo } from "react";
import { Link } from "@/lib/router-shim";
import { Search, ChevronRight, ArrowUpDown } from "lucide-react";
import { AI_SEGMENTS, EXPERT_TYPES, SEGMENT_COLORS, aiContributors } from "@/data/aiContributors";

interface Props {
  onExplore?: (id: string) => void;
}

type SortKey = "rank" | "name" | "affiliation" | "segment";

const AIContributorsExplorer = ({ onExplore }: Props) => {
  const [search, setSearch] = useState("");
  const [filterSegment, setFilterSegment] = useState<string>("");
  const [expertFilter, setExpertFilter] = useState<string>("");
  const [sortKey, setSortKey] = useState<SortKey>("rank");
  const [sortAsc, setSortAsc] = useState(true);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(true); }
  };

  const filtered = useMemo(() => {
    let list = [...aiContributors];
    if (filterSegment) list = list.filter((c) => c.segment === filterSegment);
    if (expertFilter) list = list.filter((c) => c.expertType === expertFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.affiliation.toLowerCase().includes(q) ||
          c.specialty.some((s) => s.toLowerCase().includes(q)) ||
          c.segment.toLowerCase().includes(q) ||
          c.country.toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "rank") cmp = a.rank - b.rank;
      else if (sortKey === "name") cmp = a.name.localeCompare(b.name);
      else if (sortKey === "affiliation") cmp = a.affiliation.localeCompare(b.affiliation);
      else if (sortKey === "segment") cmp = a.segment.localeCompare(b.segment);
      return sortAsc ? cmp : -cmp;
    });
    return list;
  }, [search, expertFilter, filterSegment, sortKey, sortAsc]);

  const SortHeader = ({ label, sortId, className = "" }: { label: string; sortId: SortKey; className?: string }) => (
    <button
      onClick={() => handleSort(sortId)}
      className={`flex items-center gap-1 font-mono text-[10px] text-muted-foreground/40 uppercase tracking-widest hover:text-muted-foreground transition-colors ${className}`}
    >
      {label}
      <ArrowUpDown size={9} className={sortKey === sortId ? "text-foreground/50" : "text-muted-foreground/20"} />
    </button>
  );

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/30" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search contributors..."
            className="w-full bg-transparent border border-border pl-9 pr-4 py-2.5 font-mono text-xs text-foreground placeholder:text-muted-foreground/25 focus:outline-none focus:border-foreground/20 transition-colors"
          />
        </div>
        <select
          value={filterSegment}
          onChange={(e) => setFilterSegment(e.target.value)}
          className="bg-transparent border border-border px-3 py-2.5 font-mono text-[11px] text-foreground focus:outline-none focus:border-foreground/20 transition-colors"
        >
          <option value="">All Segments</option>
          {AI_SEGMENTS.map((seg) => (
            <option key={seg} value={seg}>{seg}</option>
          ))}
        </select>
        <select
          value={expertFilter}
          onChange={(e) => setExpertFilter(e.target.value)}
          className="bg-transparent border border-border px-3 py-2.5 font-mono text-[11px] text-foreground focus:outline-none focus:border-foreground/20 transition-colors"
        >
          <option value="">All Types</option>
          {EXPERT_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      {/* Count */}
      <p className="font-mono text-[10px] text-muted-foreground/30 mb-4 tracking-wider">
        {filtered.length} contributor{filtered.length !== 1 ? "s" : ""}
      </p>

      {/* Table Header */}
      <div className="hidden sm:grid sm:grid-cols-[40px_1fr_1fr_140px_100px_24px] gap-3 px-4 py-2 border-b border-border mb-1 items-center">
        <SortHeader label="#" sortId="rank" />
        <SortHeader label="Name" sortId="name" />
        <SortHeader label="Affiliation" sortId="affiliation" />
        <SortHeader label="Segment" sortId="segment" />
        <span className="font-mono text-[10px] text-muted-foreground/40 uppercase tracking-widest">Type</span>
        <span />
      </div>

      {/* Rows */}
      <div className="divide-y divide-border/50">
        {filtered.map((contributor) => {
          const color = SEGMENT_COLORS[contributor.segment] || "#888";
          return (
            <Link
              key={contributor.id}
              to={`/ai-contributors/${contributor.id}`}
              onClick={() => onExplore?.(contributor.id)}
              className="group grid grid-cols-[40px_1fr] sm:grid-cols-[40px_1fr_1fr_140px_100px_24px] gap-3 px-4 py-3 hover:bg-foreground/[0.02] transition-colors items-center"
            >
              {/* Avatar */}
              {contributor.photoUrl ? (
                <img
                  src={contributor.photoUrl}
                  alt={contributor.name}
                  className="w-8 h-8 object-cover shrink-0 rounded-sm"
                  loading="lazy"
                />
              ) : (
                <div
                  className="w-8 h-8 flex items-center justify-center font-mono text-[10px] font-bold text-background shrink-0"
                  style={{ backgroundColor: color }}
                >
                  {contributor.name.split(" ").map((w) => w[0]).join("")}
                </div>
              )}

              {/* Name + mobile info */}
              <div className="min-w-0">
                <p className="font-mono text-sm text-foreground group-hover:text-foreground truncate">
                  {contributor.name}
                </p>
                <p className="sm:hidden font-mono text-[10px] text-muted-foreground/40 truncate">
                  {contributor.affiliation}
                </p>
              </div>

              {/* Affiliation */}
              <p className="hidden sm:block font-mono text-[11px] text-muted-foreground/50 truncate">
                {contributor.affiliation}
              </p>

              {/* Segment */}
              <span
                className="hidden sm:inline-block font-mono text-[9px] px-2 py-0.5 border w-fit truncate"
                style={{ borderColor: `${color}30`, color }}
              >
                {contributor.segment.split("&")[0].trim()}
              </span>

              {/* Type */}
              <span className="hidden sm:block font-mono text-[10px] text-muted-foreground/30">
                {contributor.expertType}
              </span>

              {/* Arrow */}
              <ChevronRight size={14} className="hidden sm:block text-muted-foreground/15 group-hover:text-muted-foreground/40 transition-colors" />
            </Link>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <p className="font-mono text-xs text-muted-foreground/30">No contributors match your search</p>
        </div>
      )}
    </div>
  );
};

export default AIContributorsExplorer;
