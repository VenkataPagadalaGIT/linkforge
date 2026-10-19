#!/usr/bin/env node
/**
 * Deploy and commit guard for the /linkedin archive.
 *
 * Fails when the generated data still holds items flagged for the owner's
 * review or unpublished article drafts (a local preview build), anything that
 * is not a public context, or an article body with markup outside the
 * allowlist. Run before committing the generated src/data/linkedin*Data.ts
 * modules and in preflight.
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
const ids = new Set(items.map((i) => i.idx));
const problems = [];
for (const it of items) {
  if (it.review) problems.push(`${it.idx}: flagged for review (preview build)`);
  if (!["post", "article", "comment", "profile"].includes(it.context)) problems.push(`${it.idx}: context "${it.context}" is not public`);
  if (/—/.test(it.description)) problems.push(`${it.idx}: em dash in description`);
  if (/\bowner\b/i.test(it.description)) problems.push(`${it.idx}: classifier wording ("owner") in description`);
}
// Articles: published only, media public, bodies inside the allowlist the extractor writes.
const read = (f, re) => {
  const m2 = fs.readFileSync(path.join(ROOT, f), "utf8").match(re);
  if (!m2) {
    console.error(`check-linkedin-data: could not read ${f}`);
    process.exit(1);
  }
  return JSON.parse(m2[1]);
};
const posts = read("src/data/linkedinPostsData.ts", /export const LINKEDIN_POSTS: LiPost\[\] = (\[.*?\]);\n/s);
const bodies = read("src/data/linkedinPostBodiesData.ts", /export const LINKEDIN_POST_BODIES: Record<string, string> = (\{.*?\});\n/s);
const postIds = new Set(posts.map((p) => p.id));
const TAGS = new Set(["p", "h2", "h3", "h4", "ul", "ol", "li", "strong", "em", "a", "blockquote", "pre", "code", "hr", "br", "figure", "figcaption", "img", "sup", "sub"]);
const VOID = new Set(["img", "br", "hr"]);
const ATTRS = { a: new Set(["href", "target", "rel"]), img: new Set(["src", "alt", "width", "height", "loading", "decoding", "data-li-idx"]) };
// A tag is its name and then only name="value" pairs (no quotes or angle brackets inside a value).
const ATTR_STRING = /^(?:\s[a-z-]+="[^"<>]*")*$/;
const HREF = /^(https?:\/\/[^\s"\\]+|\/(?![/\\])[^\s"\\]*)$/;
const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const PHONE = /(?<![\d/.-])(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}(?![\d/])/;
for (const p of posts) {
  if (p.review) problems.push(`article ${p.id}: unpublished draft (preview build)`);
  if (p.type !== "article" && p.type !== "post") problems.push(`${p.id}: type "${p.type}" has no route`);
  if (p.type === "post" && !/^https:\/\/www\.linkedin\.com\/feed\/update\/urn:li:activity:\d+\/$/.test(p.url)) problems.push(`post ${p.id}: LinkedIn URL missing`);
  const e = p.engagement;
  if (e) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(e.asOf) || !e.source) problems.push(`${p.id}: engagement without a date or source`);
    for (const k of ["reactions", "comments", "reposts", "impressions", "engagements"]) if (e[k] != null && !(Number.isInteger(e[k]) && e[k] >= 0)) problems.push(`${p.id}: engagement ${k} is not a count`);
  }
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(p.id)) problems.push(`article ${p.id}: id is not a clean slug`);
  if (p.type === "article" && !/^https:\/\/www\.linkedin\.com\/pulse\//.test(p.url)) problems.push(`article ${p.id}: LinkedIn URL missing`);
  for (const m3 of [...p.media, ...(p.commentMedia ?? [])]) if (!ids.has(m3)) problems.push(`article ${p.id}: media ${m3} is not a public item`);
  if (p.cover && !ids.has(p.cover)) problems.push(`article ${p.id}: cover ${p.cover} is not a public item`);
  for (const f of [p.title, p.excerpt, ...p.people.map((x) => x.name)]) if (/—/.test(f)) problems.push(`article ${p.id}: em dash in "${f.slice(0, 40)}"`);
  for (const x of p.people) if (!/^https:\/\/www\.linkedin\.com\/in\/[^/]+\/$/.test(x.url)) problems.push(`article ${p.id}: person link ${x.url} is not a LinkedIn profile`);
  const html = bodies[p.id];
  if (html == null) { problems.push(`article ${p.id}: no body`); continue; }
  if (/—/.test(html)) problems.push(`article ${p.id}: em dash in body`);
  if (/alt="no alt text provided/i.test(html)) problems.push(`article ${p.id}: LinkedIn's "No alt text provided" placeholder as alt text`);
  // Image captions only (alt text); a post may say "owner" in its own words.
  if (/\bowner\b/i.test([...html.matchAll(/alt="([^"]*)"/g)].map((x) => x[1]).join(" "))) problems.push(`article ${p.id}: classifier wording ("owner") in an image caption`);
  const bodyText = html.replace(/<[^>]*>/g, " ");
  if (EMAIL.test(bodyText)) problems.push(`article ${p.id}: an email address in the body`);
  if (PHONE.test(bodyText)) problems.push(`article ${p.id}: something like a phone number in the body`);
  if (/<(?![a-zA-Z/])/.test(html)) problems.push(`article ${p.id}: a stray "<" in the body`);
  const open = [];
  for (const t of html.matchAll(/<(\/?)([a-zA-Z0-9]+)([^>]*)>/g)) {
    const [whole, close, name, rest] = t;
    const tag = name.toLowerCase();
    if (!TAGS.has(tag)) { problems.push(`article ${p.id}: tag <${tag}> outside the allowlist`); continue; }
    if (close) {
      if (rest) problems.push(`article ${p.id}: attributes on a closing tag ${whole.slice(0, 40)}`);
      if (open.pop() !== tag) { problems.push(`article ${p.id}: </${tag}> does not close the open tag`); break; }
      continue;
    }
    if (!VOID.has(tag)) open.push(tag);
    if (!ATTR_STRING.test(rest)) { problems.push(`article ${p.id}: malformed attributes ${whole.slice(0, 60)}`); continue; }
    const names = [...rest.matchAll(/\s([a-z-]+)=/g)].map((a) => a[1]);
    if (new Set(names).size !== names.length) problems.push(`article ${p.id}: repeated attribute in ${whole.slice(0, 60)}`);
    for (const a of names) if (!ATTRS[tag]?.has(a)) problems.push(`article ${p.id}: attribute ${a} on <${tag}>`);
    if (tag === "a") {
      const href = rest.match(/href="([^"]*)"/)?.[1] ?? "";
      if (!HREF.test(href) || /^javascript:/i.test(href)) problems.push(`article ${p.id}: link "${href.slice(0, 40)}" is not http(s) or site-relative`);
    }
    if (tag === "img") {
      const idx = rest.match(/data-li-idx="(\d{4})"/)?.[1];
      if (!idx || !ids.has(idx)) problems.push(`article ${p.id}: image ${idx ?? "?"} is not a public item`);
      if (!/src="\{\{media\}\}\/f\/\d{4}\.webp"/.test(rest)) problems.push(`article ${p.id}: image source is not this site's media`);
    }
  }
  if (open.length) problems.push(`article ${p.id}: unclosed <${open.join(">, <")}>`);
}
// Article URLs are frozen: an article live at HEAD may not vanish unless it is retired with a redirect
// (scripts/linkedin/retired-article-slugs.json: ["slug", ...], each with a redirect in next.config.mjs).
try {
  const prev = execFileSync("git", ["show", "HEAD:src/data/linkedinPostsData.ts"], { cwd: ROOT, stdio: ["ignore", "pipe", "ignore"] }).toString();
  const was = JSON.parse(prev.match(/= (\[.*?\]);\n/s)[1]).map((p) => p.id);
  const retiredFile = path.join(ROOT, "scripts/linkedin/retired-article-slugs.json");
  const retired = new Set(fs.existsSync(retiredFile) ? JSON.parse(fs.readFileSync(retiredFile, "utf8")) : []);
  for (const id of was) if (!postIds.has(id) && !retired.has(id)) problems.push(`URL for "${id}" was live and is gone (frozen URL; retire it with a redirect)`);
} catch {
  // No committed articles yet: nothing to compare.
}
for (const k of Object.keys(bodies)) if (!postIds.has(k)) problems.push(`body ${k} has no article`);
// The browser's post index: only public posts, each a real one.
{
  const rs = fs.readFileSync(path.join(ROOT, "src/data/linkedinPostRefsData.ts"), "utf8").match(/LINKEDIN_POST_REFS_RAW: LiPostRef\[\] = JSON\.parse\(("(?:[^"\\]|\\.)*")\)/s);
  if (!rs) problems.push("could not read the browser post index");
  else for (const r of JSON.parse(JSON.parse(rs[1]))) {
    if (!postIds.has(r.id)) problems.push(`browser index: ${r.id} is not a public post`);
    if (r.review) problems.push(`browser index: ${r.id} is a draft`);
  }
}
// Post URLs are frozen against LinkedIn's activity id (scripts/linkedin/post-slugs.json).
{
  const slugFile = path.join(ROOT, "scripts/linkedin/post-slugs.json");
  const slugs = fs.existsSync(slugFile) ? JSON.parse(fs.readFileSync(slugFile, "utf8")) : {};
  for (const p of posts) if (p.type === "post" && slugs[p.activityId] !== p.id) problems.push(`post ${p.id}: not the frozen slug for activity ${p.activityId}`);
  try {
    const prevSlugs = JSON.parse(execFileSync("git", ["show", "HEAD:scripts/linkedin/post-slugs.json"], { cwd: ROOT, stdio: ["ignore", "pipe", "ignore"] }).toString());
    for (const [a, sl] of Object.entries(prevSlugs)) if (slugs[a] !== sl) problems.push(`post-slugs.json: activity ${a} was ${sl}, now ${slugs[a] ?? "gone"} (frozen)`);
  } catch {
    // Not committed yet.
  }
}
for (const it of items) if (it.post && !postIds.has(it.post)) problems.push(`${it.idx}: points to article ${it.post}, which is not public`);

// The preview twins must never be tracked or staged.
for (const f of ["src/data/linkedinArchiveData.preview.ts", "src/data/linkedinGraphData.preview.ts", "src/data/linkedinPostsData.preview.ts", "src/data/linkedinPostBodiesData.preview.ts", "src/data/linkedinPostRefsData.preview.ts"]) {
  try {
    execFileSync("git", ["check-ignore", "-q", f], { cwd: ROOT });
  } catch {
    problems.push(`${f} is not git-ignored`);
  }
  const tracked = execFileSync("git", ["ls-files", "--", f], { cwd: ROOT }).toString().trim();
  if (tracked) problems.push(`${f} is tracked by git`);
}
const graphSrc = fs.readFileSync(path.join(ROOT, "src/data/linkedinGraphData.ts"), "utf8");
const gm = graphSrc.match(/JSON\.parse\(("(?:[^"\\]|\\.)*")\)/s);
if (!gm) {
  console.error("check-linkedin-data: could not read LINKEDIN_GRAPH");
  process.exit(1);
}
const graphData = JSON.parse(JSON.parse(gm[1]));
for (const n of graphData.nodes) if (n.type === "item" && !ids.has(n.idx)) problems.push(`graph node ${n.idx} is not a public item`);
// Every topic an item carries must have a node in the graph (its link in the no-JS view).
const topicNodes = new Set(graphData.nodes.filter((n) => n.type === "topic").map((n) => n.label));
for (const t of new Set(items.flatMap((i) => i.topics))) if (!topicNodes.has(t)) problems.push(`topic "${t}" has items but no graph node`);
for (const n of graphData.nodes) if (n.type === "post" && !postIds.has(n.id.slice(2))) problems.push(`graph post ${n.id} is not a public post`);
if (graphData.nodes.filter((n) => n.type === "item").length !== items.length) problems.push("graph and item list disagree on the number of items");
if (problems.length) {
  console.error(`check-linkedin-data: FAIL (${problems.length})\n  ` + problems.slice(0, 20).join("\n  "));
  console.error("Rebuild without --include-review before committing or deploying.");
  process.exit(1);
}
console.log(`check-linkedin-data: OK (${items.length} public items, ${posts.filter((p) => p.type === "article").length} published articles, ${posts.filter((p) => p.type === "post").length} posts, none pending review)`);
