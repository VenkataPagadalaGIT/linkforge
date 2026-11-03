import { renderOkfGuidesIndex } from "@/lib/discovery";

// Every guide, from src/data/guides.ts: a new guide is listed here the moment
// it ships, with or without a hand-written OKF concept file.
export const revalidate = 3600;

export async function GET() {
  return new Response(renderOkfGuidesIndex(), { headers: { "Content-Type": "text/markdown; charset=utf-8" } });
}
