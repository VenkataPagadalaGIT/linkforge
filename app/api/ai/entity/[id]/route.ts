import { NextResponse } from "next/server";
import { allEntityIds, entityPayload } from "@/lib/ai-graph-api";

/**
 * GET /api/ai/entity/<id>: one entity's record, links, group and company file
 * (deals with the filing's wording and quotes, series, people, events, and the
 * approved forecasts and implications), as the entity page shows it.
 */
export const dynamic = "force-static";
export const revalidate = 3600;
export const dynamicParams = true;

export function generateStaticParams() {
  return allEntityIds().map((id) => ({ id }));
}

export function GET(_req: Request, { params }: { params: { id: string } }) {
  const body = entityPayload(params.id);
  if (!body) return NextResponse.json({ error: "No such entity", hint: "GET /api/ai/graph lists every id" }, { status: 404 });
  return NextResponse.json(body, {
    headers: { "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400", "Access-Control-Allow-Origin": "*" },
  });
}
