/**
 * Serialise JSON-LD safely into a <script> tag.
 *
 * JSON.stringify does not escape "</script>", so any string containing it
 * closes the tag early and everything after is parsed as HTML. Nothing in the
 * corpus contains one today, but the corpus ingests external content: USAFacts
 * answer prose, claims lifted from competitor pages. "Not exploitable today"
 * is a property of the data, not of the code, and the data changes on every
 * crawl.
 *
 * Escaping < and the line separators U+2028 and U+2029 (legal in JSON, illegal
 * inside a JavaScript string literal) makes it a property of the code instead.
 */
export function jsonLdScript(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}
