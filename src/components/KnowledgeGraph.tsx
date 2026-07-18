"use client";
import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { motion } from "framer-motion";

interface GraphNode {
  id: string;
  label: string;
  category: string;
  keywords: string;
  volume: string;
  topics: number;
  x: number;
  y: number;
  r: number;
  color: string;
  children?: { label: string; x: number; y: number; r: number }[];
}

const categories = [
  {
    name: "AI Agents",
    color: "#3B82F6",
    keywords: "412.5K",
    volume: "89.2M",
    topics: 14,
    children: ["Workflow Automation", "Multi-Agent Systems", "A2A Pipelines", "Tool Use", "Orchestration"],
  },
  {
    name: "Knowledge Graphs",
    color: "#10B981",
    keywords: "287.3K",
    volume: "64.1M",
    topics: 9,
    children: ["Entity Resolution", "Context Graphs", "Ontology Design", "Graph Embeddings"],
  },
  {
    name: "RAG Engines",
    color: "#F59E0B",
    keywords: "198.7K",
    volume: "45.8M",
    topics: 11,
    children: ["Vector Search", "Hybrid Retrieval", "Chunking Strategy", "Re-ranking"],
  },
  {
    name: "Technical SEO",
    color: "#EF4444",
    keywords: "523.1K",
    volume: "112.4M",
    topics: 18,
    children: ["Crawlability", "Core Web Vitals", "Schema Markup", "Internal Linking", "Site Architecture"],
  },
  {
    name: "AEO",
    color: "#8B5CF6",
    keywords: "156.2K",
    volume: "38.9M",
    topics: 7,
    children: ["AI Citations", "LLM Visibility", "Answer Targeting", "Featured Snippets"],
  },
  {
    name: "ML Systems",
    color: "#EC4899",
    keywords: "341.8K",
    volume: "78.3M",
    topics: 12,
    children: ["Custom Pipelines", "Model Serving", "Feature Engineering", "MLOps"],
  },
  {
    name: "Content Strategy",
    color: "#14B8A6",
    keywords: "267.4K",
    volume: "56.7M",
    topics: 10,
    children: ["Topical Authority", "User Intent", "Content Briefs", "Gap Analysis"],
  },
  {
    name: "Analytics",
    color: "#F97316",
    keywords: "189.6K",
    volume: "42.1M",
    topics: 8,
    children: ["Growth Forecasting", "KPI Tracking", "Cohort Analysis", "CRO"],
  },
  {
    name: "Programmatic",
    color: "#06B6D4",
    keywords: "145.9K",
    volume: "31.5M",
    topics: 6,
    children: ["Template Systems", "Page Generation", "Indexation Logic"],
  },
  {
    name: "MCP Servers",
    color: "#A855F7",
    keywords: "98.4K",
    volume: "22.7M",
    topics: 5,
    children: ["Server Integrations", "Protocol Design", "Context Windows"],
  },
];

const totalKeywords = "2.6M";
const totalVolume = "561.7M";
const totalTopics = categories.reduce((s, c) => s + c.topics, 0).toLocaleString();
const totalCategories = categories.length;

function buildNodes(): GraphNode[] {
  const cx = 400;
  const cy = 350;
  const orbitR = 220;

  return categories.map((cat, i) => {
    const angle = (i / categories.length) * Math.PI * 2 - Math.PI / 2;
    const jitter = (i % 2 === 0 ? 1 : -1) * 15;
    const x = cx + Math.cos(angle) * (orbitR + jitter);
    const y = cy + Math.sin(angle) * (orbitR + jitter);
    const r = 18 + cat.topics * 2;

    const children = cat.children.map((ch, ci) => {
      const cAngle = angle + ((ci - (cat.children.length - 1) / 2) * 0.35);
      const cDist = r + 30 + ci * 8;
      return {
        label: ch,
        x: x + Math.cos(cAngle) * cDist,
        y: y + Math.sin(cAngle) * cDist,
        r: 6 + Math.random() * 6,
      };
    });

    return {
      id: cat.name,
      label: cat.name,
      category: cat.name,
      keywords: cat.keywords,
      volume: cat.volume,
      topics: cat.topics,
      color: cat.color,
      x,
      y,
      r,
      children,
    };
  });
}

const KnowledgeGraph = () => {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const nodes = useMemo(() => buildNodes(), []);
  const svgRef = useRef<SVGSVGElement>(null);
  const cx = 400;
  const cy = 350;

  const isActive = useCallback(
    (id: string) => hoveredNode === id || selectedNode?.id === id,
    [hoveredNode, selectedNode]
  );

  return (
    <div className="w-full">
      {/* Stats bar */}
      <div className="flex items-center justify-between mb-8 border border-border p-4">
        <h2 className="font-display text-xl font-bold text-foreground">
          <span className="text-muted-foreground">Topic</span> Explorer
        </h2>
        <div className="flex gap-8">
          {[
            { value: totalTopics, label: "TOPICS" },
            { value: totalKeywords, label: "KEYWORDS" },
            { value: totalVolume, label: "VOLUME" },
            { value: totalCategories.toString(), label: "CATEGORIES" },
          ].map((stat) => (
            <div key={stat.label} className="text-right">
              <p className="font-mono text-sm font-bold text-foreground">{stat.value}</p>
              <p className="font-mono text-[9px] tracking-widest text-muted-foreground/50">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-6">
        {/* Categories panel */}
        <div className="hidden lg:block w-64 flex-shrink-0 border border-border p-4">
          <p className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground/50 uppercase mb-4">
            Categories ▾
          </p>
          <div className="space-y-1">
            {categories.map((cat) => {
              const active = isActive(cat.name);
              return (
                <button
                  key={cat.name}
                  className="w-full flex items-center gap-3 py-2 px-2 hover:bg-secondary/20 transition-all text-left group/cat"
                  onMouseEnter={() => setHoveredNode(cat.name)}
                  onMouseLeave={() => setHoveredNode(null)}
                  onClick={() => setSelectedNode(nodes.find((n) => n.id === cat.name) || null)}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-sm flex-shrink-0 transition-all duration-300"
                    style={{
                      backgroundColor: active ? cat.color : "hsl(var(--muted-foreground) / 0.2)",
                    }}
                  />
                  <span
                    className="font-mono text-[11px] flex-1 transition-all duration-300"
                    style={{ color: active ? cat.color : "hsl(var(--muted-foreground) / 0.5)" }}
                  >
                    {cat.name}
                  </span>
                  <span className="font-mono text-[9px] text-muted-foreground/30">{cat.keywords}</span>
                  <span className="font-mono text-[9px] text-muted-foreground/20">{cat.topics}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Graph */}
        <div className="flex-1 border border-border relative overflow-hidden" style={{ minHeight: 700 }}>
          <svg
            ref={svgRef}
            viewBox="0 0 800 700"
            className="w-full h-full"
            onMouseLeave={() => setHoveredNode(null)}
          >
            {/* Connection lines to center */}
            {nodes.map((node) => (
              <line
                key={`line-${node.id}`}
                x1={cx}
                y1={cy}
                x2={node.x}
                y2={node.y}
                stroke={isActive(node.id) ? node.color : "hsl(var(--muted-foreground) / 0.15)"}
                strokeWidth={isActive(node.id) ? 1.5 : 0.5}
                strokeOpacity={isActive(node.id) ? 0.6 : 0.15}
                className="transition-all duration-500"
              />
            ))}

            {/* Child connection lines */}
            {nodes.map((node) =>
              node.children?.map((child, ci) => (
                <line
                  key={`child-line-${node.id}-${ci}`}
                  x1={node.x}
                  y1={node.y}
                  x2={child.x}
                  y2={child.y}
                  stroke={isActive(node.id) ? node.color : "hsl(var(--muted-foreground) / 0.1)"}
                  strokeWidth={isActive(node.id) ? 1 : 0.3}
                  strokeOpacity={isActive(node.id) ? 0.4 : 0.1}
                  className="transition-all duration-500"
                />
              ))
            )}

            {/* Center node */}
            <circle
              cx={cx}
              cy={cy}
              r={28}
              fill="none"
              stroke={hoveredNode ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground) / 0.2)"}
              strokeWidth={1.5}
              className="transition-all duration-500"
            />
            <circle
              cx={cx}
              cy={cy}
              r={4}
              fill={hoveredNode ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground) / 0.3)"}
              className="transition-all duration-500"
            />
            <text
              x={cx}
              y={cy + 44}
              textAnchor="middle"
              className="font-mono text-[8px] fill-muted-foreground/40 uppercase tracking-widest"
            >
              All Topics
            </text>

            {/* Child nodes */}
            {nodes.map((node) =>
              node.children?.map((child, ci) => (
                <g key={`child-${node.id}-${ci}`}>
                  <circle
                    cx={child.x}
                    cy={child.y}
                    r={child.r}
                    fill={isActive(node.id) ? node.color : "hsl(var(--muted-foreground) / 0.08)"}
                    fillOpacity={isActive(node.id) ? 0.5 : 0.3}
                    stroke={isActive(node.id) ? node.color : "hsl(var(--muted-foreground) / 0.1)"}
                    strokeWidth={0.5}
                    className="transition-all duration-500"
                  />
                  {isActive(node.id) && child.r > 7 && (
                    <text
                      x={child.x}
                      y={child.y + child.r + 10}
                      textAnchor="middle"
                      className="font-mono text-[6px] transition-all duration-300"
                      fill={node.color}
                      fillOpacity={0.7}
                    >
                      {child.label}
                    </text>
                  )}
                </g>
              ))
            )}

            {/* Main nodes */}
            {nodes.map((node) => {
              const active = isActive(node.id);
              return (
                <g
                  key={node.id}
                  onMouseEnter={() => setHoveredNode(node.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                  onClick={() => setSelectedNode(active && selectedNode?.id === node.id ? null : node)}
                  className="cursor-pointer"
                >
                  {/* Glow */}
                  {active && (
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={node.r + 8}
                      fill={node.color}
                      fillOpacity={0.08}
                      className="transition-all duration-500"
                    />
                  )}
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={node.r}
                    fill={active ? node.color : "hsl(var(--muted-foreground) / 0.05)"}
                    fillOpacity={active ? 0.25 : 1}
                    stroke={active ? node.color : "hsl(var(--muted-foreground) / 0.15)"}
                    strokeWidth={active ? 2 : 0.8}
                    className="transition-all duration-500"
                  />
                  <text
                    x={node.x}
                    y={node.y + 1}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="font-mono text-[7px] pointer-events-none transition-all duration-300 uppercase tracking-wider"
                    fill={active ? node.color : "hsl(var(--muted-foreground) / 0.4)"}
                  >
                    {node.label.length > 10 ? node.label.slice(0, 10) + "…" : node.label}
                  </text>
                  <text
                    x={node.x}
                    y={node.y + node.r + 14}
                    textAnchor="middle"
                    className="font-mono text-[6px] pointer-events-none transition-all duration-300"
                    fill={active ? node.color : "hsl(var(--muted-foreground) / 0.2)"}
                    fillOpacity={0.7}
                  >
                    {node.topics} topics
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Details panel */}
        <div className="hidden xl:block w-72 flex-shrink-0 border border-border p-4">
          {selectedNode ? (
            <motion.div
              key={selectedNode.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-lg font-bold text-foreground">{selectedNode.label}</h3>
                <span
                  className="font-mono text-[9px] px-2 py-0.5 rounded-sm"
                  style={{ backgroundColor: selectedNode.color + "20", color: selectedNode.color }}
                >
                  TOPIC
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3 border-b border-border pb-4 mb-4">
                <div>
                  <p className="font-mono text-sm font-bold text-foreground">{selectedNode.keywords}</p>
                  <p className="font-mono text-[8px] text-muted-foreground/40 tracking-widest">KEYWORDS</p>
                </div>
                <div>
                  <p className="font-mono text-sm font-bold text-foreground">{selectedNode.volume}</p>
                  <p className="font-mono text-[8px] text-muted-foreground/40 tracking-widest">VOLUME</p>
                </div>
                <div>
                  <p className="font-mono text-sm font-bold text-foreground">{selectedNode.topics}</p>
                  <p className="font-mono text-[8px] text-muted-foreground/40 tracking-widest">TOPICS</p>
                </div>
              </div>
              <p className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground/40 uppercase mb-3">
                Subtopics ({selectedNode.children?.length})
              </p>
              <div className="space-y-2">
                {selectedNode.children?.map((child) => (
                  <div
                    key={child.label}
                    className="flex items-center gap-2 py-1.5 px-2 -mx-2 border border-transparent hover:border-border/50 transition-all"
                  >
                    <span
                      className="w-2 h-2 rounded-sm flex-shrink-0"
                      style={{ backgroundColor: selectedNode.color }}
                    />
                    <span className="font-mono text-[11px] text-muted-foreground">{child.label}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center py-20">
              <p className="font-mono text-[10px] text-muted-foreground/30 tracking-widest uppercase mb-2">
                Select a node
              </p>
              <p className="font-mono text-[10px] text-muted-foreground/20 leading-relaxed">
                Click on any topic to explore its subtopics and metrics
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default KnowledgeGraph;
