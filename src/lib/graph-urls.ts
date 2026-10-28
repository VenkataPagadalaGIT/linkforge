// One registry for every graph's URLs. The AI graph is the first; finance, e-commerce and the rest get a row each,
// and the universal graph later links to an entity's one canonical page in its home industry. Every link to a hub,
// an entity or a section goes through these helpers, so adding an industry never means touching call sites.
//
//   /notebook/<industry>/graph                        the hub: map, 2D, 3D and list views of one industry
//   /notebook/<industry>/graph/<entity>               the one page per entity: the graph focused on it, then its file
//   /notebook/<industry>/graph/<entity>/<section>     one deep section of that file on its own page
//   /notebook/<industry>/graph/layers/<layer>         (reserved) one layer of the stack
//   /notebook/<industry>/graph/types/<type>           (reserved) one type of entity
//
// Entity slugs are one global set (an entity in two industries has one slug and one page), lower-case words joined
// by hyphens, never a bare number and never a reserved segment, so the universal graph can address every entity the
// same way its home industry does.

export const GRAPHS = {
  ai: { base: "/notebook/ai/graph", name: "The AI Intelligence Graph", map: "/notebook/ai/map", notebook: "/notebook/ai", notebookName: "AI Notebook" },
} as const;
export type GraphId = keyof typeof GRAPHS;

/** First segments under a graph's base that are not entities. An entity slug must never be one of these. */
export const RESERVED_SEGMENTS = ["layers", "types", "sections", "api", "feed", "search"] as const;
export const isReservedSegment = (s: string) => (RESERVED_SEGMENTS as readonly string[]).includes(s);
export const isEntitySlug = (s: string) => /^[a-z0-9][a-z0-9-]*$/.test(s) && !/^\d+$/.test(s) && !isReservedSegment(s);

export const hubPath = (graph: GraphId = "ai") => GRAPHS[graph].base;
export const entityPath = (id: string, graph: GraphId = "ai") => `${GRAPHS[graph].base}/${id}`;
export const sectionPath = (id: string, section: string, graph: GraphId = "ai") => `${GRAPHS[graph].base}/${id}/${section}`;

/** The entity id in a graph path, when the path is an entity page (hub/<id> or hub/<id>/<section>). */
export function entityFromPath(pathname: string, graph: GraphId = "ai"): string | null {
  const base = GRAPHS[graph].base;
  if (!pathname.startsWith(`${base}/`)) return null;
  const id = pathname.slice(base.length + 1).split("/")[0];
  return id && isEntitySlug(id) ? id : null;
}
