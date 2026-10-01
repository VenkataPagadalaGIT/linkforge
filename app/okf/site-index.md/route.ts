import { renderOkfSiteIndex } from "@/lib/discovery";

// OKF concept listing every page, from the same registry as sitemap.xml.
export const revalidate = 3600;

export async function GET() {
  return new Response(await renderOkfSiteIndex(), { headers: { "Content-Type": "text/markdown; charset=utf-8" } });
}
