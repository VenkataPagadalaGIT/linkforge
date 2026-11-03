// The full public-footprint roster for one entity, served only where the local data file exists.
// Rows from licensed datasets (LinkedIn) never enter the repo or the site's data files: the generator writes
// them under data/corpus/raw/people/ (ignored by git), so on a deployed build this route answers 404 and the
// page shows public-role people only.
import { promises as fs } from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const id = params.id;
  if (!/^[a-z0-9-]+$/.test(id)) return new Response("Not found", { status: 404 });
  const file = path.join(process.cwd(), "data", "corpus", "raw", "people", `${id}-people.json`);
  try {
    const body = await fs.readFile(file, "utf8");
    return new Response(body, { headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "x-robots-tag": "noindex" } });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
