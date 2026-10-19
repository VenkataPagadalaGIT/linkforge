#!/usr/bin/env node
/**
 * Deploy and commit guard for the /linkedin archive.
 *
 * Fails when the generated data still holds items flagged for the owner's
 * review (a local preview build), or anything that is not a public context.
 * Run before committing src/data/linkedinArchiveData.ts and in preflight.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const file = path.join(ROOT, "src/data/linkedinArchiveData.ts");
const src = fs.readFileSync(file, "utf8");
const m = src.match(/export const LINKEDIN_ITEMS: LiItem\[\] = (\[.*?\]);\n/s);
if (!m) {
  console.error("check-linkedin-data: could not read LINKEDIN_ITEMS");
  process.exit(1);
}
const items = JSON.parse(m[1]);
const problems = [];
for (const it of items) {
  if (it.review) problems.push(`${it.idx}: flagged for review (preview build)`);
  if (!["post", "article", "comment", "profile"].includes(it.context)) problems.push(`${it.idx}: context "${it.context}" is not public`);
  if (/—/.test(it.description)) problems.push(`${it.idx}: em dash in description`);
  if (/\bowner\b/i.test(it.description)) problems.push(`${it.idx}: classifier wording ("owner") in description`);
}
// The preview twins must never be tracked or staged.
for (const f of ["src/data/linkedinArchiveData.preview.ts", "src/data/linkedinGraphData.preview.ts"]) {
  try {
    execFileSync("git", ["check-ignore", "-q", f], { cwd: ROOT });
  } catch {
    problems.push(`${f} is not git-ignored`);
  }
  const tracked = execFileSync("git", ["ls-files", "--", f], { cwd: ROOT }).toString().trim();
  if (tracked) problems.push(`${f} is tracked by git`);
}
const graph = fs.readFileSync(path.join(ROOT, "src/data/linkedinGraphData.ts"), "utf8");
const ids = new Set(items.map((i) => i.idx));
for (const m2 of graph.matchAll(/"idx":"(\d{4})"/g)) if (!ids.has(m2[1])) problems.push(`graph node ${m2[1]} is not a public item`);
if (problems.length) {
  console.error(`check-linkedin-data: FAIL (${problems.length})\n  ` + problems.slice(0, 20).join("\n  "));
  console.error("Rebuild without --include-review before committing or deploying.");
  process.exit(1);
}
console.log(`check-linkedin-data: OK (${items.length} public items, none pending review)`);
