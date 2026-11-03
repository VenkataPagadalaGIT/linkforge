import { NextResponse } from "next/server";
import { graphPayload } from "@/lib/ai-graph-api";

/**
 * GET /api/ai/graph: the whole AI Intelligence Graph as JSON (entities, typed
 * links, deals from filings), for analysts' notebooks, agents and the MCP
 * server in tools/ai_graph_mcp.py. Built from the same data modules as the
 * page, so it never says more than the page does.
 */
export const dynamic = "force-static";
export const revalidate = 3600;

export function GET() {
  return NextResponse.json(graphPayload(), {
    headers: { "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400", "Access-Control-Allow-Origin": "*" },
  });
}
