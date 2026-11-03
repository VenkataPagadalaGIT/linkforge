import { NextResponse } from "next/server";
import { LEARN_CHECKED_AT, LEARN_PHASES, LEARN_RESOURCES, LEARN_TOPICS } from "@/data/learnCatalog";

// The whole Learn catalog, read by the browser when someone opens Learn, so the page itself stays light.
export const dynamic = "force-static";

export function GET() {
  return NextResponse.json(
    { checkedAt: LEARN_CHECKED_AT, phases: LEARN_PHASES, topics: LEARN_TOPICS, resources: LEARN_RESOURCES.filter((r) => r.status !== "dead") },
    { headers: { "Cache-Control": "public, max-age=300, must-revalidate" } },
  );
}
