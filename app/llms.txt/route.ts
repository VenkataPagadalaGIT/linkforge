import { renderLlms } from "@/lib/discovery";

// Rendered from src/content/llms.md plus live sections from the site registry,
// on the same hourly cadence as sitemap.xml, so a new page lands here with no
// manual edit. See docs/SITE_DISCOVERY.md.
export const revalidate = 3600;

export async function GET() {
  const body = await renderLlms("llms.md");
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
