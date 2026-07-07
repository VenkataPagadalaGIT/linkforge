"use client";
import { useState } from "react";
import { CURATED_READING_LISTS } from "@/data/aiNotebook";
import { ExternalLink, BookOpen, Headphones, GraduationCap } from "lucide-react";

const levelConfig = {
  essential: { label: "Essential", color: "border-green-400/30 text-green-400/70", icon: "⭐" },
  intermediate: { label: "Intermediate", color: "border-yellow-400/30 text-yellow-400/70", icon: "📖" },
  advanced: { label: "Advanced", color: "border-red-400/30 text-red-400/70", icon: "🔬" },
};

const typeIcons: Record<string, string> = {
  paper: "📄",
  book: "📚",
  talk: "🎤",
  podcast: "🎧",
  course: "🎓",
};

const CuratedReadingLists = () => {
  const [activeList, setActiveList] = useState(CURATED_READING_LISTS[0].id);
  const list = CURATED_READING_LISTS.find((l) => l.id === activeList);

  return (
    <div>
      {/* List selector */}
      <div className="flex flex-wrap gap-2 mb-6">
        {CURATED_READING_LISTS.map((rl) => {
          const config = levelConfig[rl.level];
          return (
            <button
              key={rl.id}
              onClick={() => setActiveList(rl.id)}
              className={`font-mono text-[10px] px-3 py-2 border transition-all ${
                activeList === rl.id
                  ? "bg-foreground text-background border-foreground"
                  : "border-border text-muted-foreground/50 hover:text-foreground hover:border-foreground/20"
              }`}
            >
              {config.icon} {rl.title}
            </button>
          );
        })}
      </div>

      {list && (
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className={`font-mono text-[9px] px-2 py-0.5 border uppercase tracking-widest ${levelConfig[list.level].color}`}>
              {levelConfig[list.level].label}
            </span>
          </div>
          <p className="font-mono text-xs text-muted-foreground leading-relaxed mb-6">
            {list.description}
          </p>

          <div className="space-y-3">
            {list.items.map((item, i) => (
              <a
                key={i}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block border border-border p-4 sm:p-5 hover:border-foreground/20 transition-all group"
              >
                <div className="flex items-start gap-3">
                  <span className="text-sm mt-0.5 shrink-0">{typeIcons[item.type] || "📄"}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div>
                        <span className="font-mono text-[10px] text-muted-foreground/20 mr-2">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className="font-display text-sm font-bold text-foreground group-hover:text-glow transition-all">
                          {item.title}
                        </span>
                      </div>
                      <ExternalLink size={10} className="text-muted-foreground/20 group-hover:text-foreground/40 shrink-0 mt-1" />
                    </div>
                    <p className="font-mono text-[10px] text-muted-foreground/40 mb-2">{item.author}</p>
                    <p className="font-mono text-[11px] text-muted-foreground/60 leading-relaxed group-hover:text-muted-foreground transition-colors">
                      {item.why}
                    </p>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CuratedReadingLists;
