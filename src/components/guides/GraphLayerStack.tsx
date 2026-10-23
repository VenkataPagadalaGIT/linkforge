/**
 * GraphLayerStack — the master diagram. Shows how the structures stack:
 * each layer is enabled by the one beneath it, with a vector index alongside
 * as a parallel retrieval substrate. Static SVG, crawlable, theme-aware.
 */

// Theme-reactive structural tokens.
const FG = "hsl(var(--foreground))";
const MUTED = "hsl(var(--muted-foreground))";
const BORDER = "hsl(var(--border))";
const CARD = "hsl(var(--card))";

interface Layer {
  id: string;
  title: string;
  role: string;
  connector: string;
  accent: string;
}

const LAYERS: Layer[] = [
  { id: "context", title: "Context Graph", role: "decides what's relevant now", connector: "activated for a user by", accent: "#7b84d6" },
  { id: "information", title: "Information Graph", role: "maps your content to entities & demand", connector: "content mapped by", accent: "#34a8a8" },
  { id: "knowledge", title: "Knowledge Graph", role: "records what's true", connector: "populated by", accent: FG },
  { id: "ontology", title: "Ontology", role: "defines what can exist", connector: "given grammar by", accent: "#c08a3a" },
  { id: "taxonomy", title: "Taxonomy", role: "files things into categories", connector: "", accent: MUTED },
];

const W = 760;
const ROW_H = 74;
const GAP = 26;
const TOP = 34;
const BAND_W = 480;
const BAND_X = 40;
const H = TOP + LAYERS.length * (ROW_H + GAP) - GAP + 24;

const GraphLayerStack = () => {
  return (
    <figure className="my-2">
      <div className="border border-border bg-card/40">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="How graph layers stack: a taxonomy is given grammar by an ontology, populated by a knowledge graph, mapped by an information graph, and activated for a user by a context graph, with a vector index alongside for retrieval.">
          <defs>
            <marker id="up" viewBox="0 0 10 10" refX="5" refY="9" markerWidth="7" markerHeight="7" orient="auto">
              <path d="M0,10 L5,0 L10,10 z" style={{ fill: MUTED }} />
            </marker>
          </defs>

          {LAYERS.map((l, i) => {
            const y = TOP + i * (ROW_H + GAP);
            const below = LAYERS[i + 1];
            return (
              <g key={l.id}>
                {below && (
                  <>
                    <line x1={BAND_X + BAND_W / 2} y1={y + ROW_H + GAP} x2={BAND_X + BAND_W / 2} y2={y + ROW_H + 4} style={{ stroke: BORDER }} strokeWidth="1.4" markerEnd="url(#up)" />
                    <text x={BAND_X + BAND_W / 2 + 10} y={y + ROW_H + GAP / 2 + 4} className="font-mono" fontSize="10" style={{ fill: MUTED }} textAnchor="start">
                      {l.connector}
                    </text>
                  </>
                )}
                <rect x={BAND_X} y={y} width={BAND_W} height={ROW_H} rx={3} style={{ fill: CARD, stroke: l.accent }} strokeWidth="1.6" />
                <rect x={BAND_X} y={y} width={5} height={ROW_H} style={{ fill: l.accent, opacity: 0.9 }} />
                <text x={BAND_X + 22} y={y + 30} className="font-mono" fontSize="15" style={{ fill: FG }} fontWeight="600">
                  {l.title}
                </text>
                <text x={BAND_X + 22} y={y + 52} className="font-mono" fontSize="11" style={{ fill: MUTED }}>
                  {l.role}
                </text>
                <text x={BAND_X + BAND_W - 16} y={y + 30} className="font-mono" fontSize="11" style={{ fill: l.accent }} textAnchor="end">
                  {String(LAYERS.length - i).padStart(2, "0")}
                </text>
              </g>
            );
          })}

          {/* Parallel vector index rail */}
          <g>
            <rect x={BAND_X + BAND_W + 70} y={TOP} width={120} height={H - TOP - 24} rx={3} style={{ fill: CARD, stroke: MUTED }} strokeWidth="1.4" strokeDasharray="5 4" />
            <text x={BAND_X + BAND_W + 130 - 50} y={TOP + 18} className="font-mono" fontSize="11" style={{ fill: MUTED }} textAnchor="start">06</text>
            <text x={BAND_X + BAND_W + 130} y={TOP + 38} className="font-mono" fontSize="12" style={{ fill: FG }} textAnchor="middle">Vector</text>
            <text x={BAND_X + BAND_W + 130} y={TOP + 54} className="font-mono" fontSize="12" style={{ fill: FG }} textAnchor="middle">Index</text>
            <text x={BAND_X + BAND_W + 130} y={TOP + 82} className="font-mono" fontSize="9.5" style={{ fill: MUTED }} textAnchor="middle">parallel,</text>
            <text x={BAND_X + BAND_W + 130} y={TOP + 96} className="font-mono" fontSize="9.5" style={{ fill: MUTED }} textAnchor="middle">fuzzy</text>
            <text x={BAND_X + BAND_W + 130} y={TOP + 110} className="font-mono" fontSize="9.5" style={{ fill: MUTED }} textAnchor="middle">retrieval</text>
            <line x1={BAND_X + BAND_W + 4} y1={H / 2} x2={BAND_X + BAND_W + 70} y2={H / 2} style={{ stroke: BORDER }} strokeWidth="1.2" strokeDasharray="3 3" />
            <text x={BAND_X + BAND_W + 37} y={H / 2 - 6} className="font-mono" fontSize="9" style={{ fill: MUTED }} textAnchor="middle">recall</text>
          </g>
        </svg>
      </div>
      <figcaption className="mt-3 font-mono text-[11px] text-muted-foreground/80 leading-relaxed">
        <span className="text-foreground">The stack.</span> Each layer is enabled by the one beneath it. A vector index runs alongside as a complementary, schema-free retrieval substrate. Strong agentic systems use the whole stack, not one layer.
      </figcaption>
    </figure>
  );
};

export default GraphLayerStack;
