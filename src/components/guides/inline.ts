/**
 * inline.ts: the guide renderer's tiny inline markdown, shared by every block
 * component so a link or a bold run looks the same in a paragraph, a card or
 * a chart label.
 */

// Tiny inline markdown: [label](url), **bold**, *italic*, and `code`. Order
// matters: links run first so a URL containing ** or _ never gets caught by a
// later pass. Site links ([label](/path) or [label](#id)) stay in the same tab.
// External http(s) URLs open in a new tab and carry a noopener rel for safety
// and SEO (so we don't pass equity to every cited paper).
export const inline = (s: string): string =>
  s
    // Reading highlights: [[y:key idea]], [[g:what to do]], [[b:evidence]].
    .replace(/\[\[([ygb]):([^\]]+)\]\]/g, (_m, c, text) => `<mark class="hl hl-${c}">${text}</mark>`)
    .replace(/\[([^\]]+)\]\(((?:\/|#)[^\s)]*)\)/g, (_m, label, url) =>
      `<a href="${url}" class="text-foreground underline underline-offset-4 decoration-foreground/30 hover:decoration-foreground transition-colors">${label}</a>`
    )
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (_m, label, url) =>
      `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-foreground underline underline-offset-4 decoration-foreground/30 hover:decoration-foreground transition-colors">${label}</a>`
    )
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-foreground font-semibold">$1</strong>')
    .replace(/(^|[^*])\*([^*\n]+?)\*(?!\*)/g, '$1<em class="italic text-foreground/90">$2</em>')
    .replace(/`([^`]+?)`/g, '<code class="font-mono text-[0.92em] text-foreground bg-foreground/5 border border-border/60 px-1 py-px rounded-sm">$1</code>');
