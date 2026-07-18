"use client";
import dynamic from "next/dynamic";
import type { GraphView } from "@/lib/graphModels";

// Client-only: WebGL never runs during SSG. Loads on demand when a figure's
// "Explore in 3D" toggle is switched on. The static SVG stays visible
// underneath while this imports, so there's no blank/loading gap.
const Graph3D = dynamic(() => import("./Graph3D"), { ssr: false, loading: () => null });

const Graph3DLazy = ({ view }: { view: GraphView }) => <Graph3D view={view} />;

export default Graph3DLazy;
