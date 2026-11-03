import { NextResponse } from "next/server";
import { getStoryCards } from "@/lib/story-index";

// The ranked story list the News feed reads. Built on each request from cached data, so a story published without a
// deploy appears at once. Light cards only: a story's own posts load when someone opens it.
export const dynamic = "force-dynamic";

export async function GET() {
  const stories = await getStoryCards();
  return NextResponse.json({ stories }, { headers: { "Cache-Control": "public, max-age=120, must-revalidate" } });
}
