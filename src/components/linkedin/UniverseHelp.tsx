/**
 * The Universe's one-line flying guide. Its own module, so the archive hub renders it in the server HTML under the
 * Universe's slot (the line is there before the 3D view loads, so nothing below it shifts) without pulling three.js in.
 */
export default function UniverseHelp({ full = false, standalone = false }: { full?: boolean; standalone?: boolean }) {
  return (
    <p className={`li-js mt-1.5 font-mono text-[10px] uppercase tracking-[0.2em] ${full ? "text-muted-foreground" : "text-muted-foreground/70"}`}>
      <span className="text-foreground">How to fly</span>{" "}
      <span className="normal-case tracking-normal">
        · every post a star around one core; the nearest posts pop up as images. Pick a level (L1 area, L2 topic, L3 subtopic, L4 post), or hover a star to
        lock on and click a sector or a topic to fly in; click a card, a star or the locked target to open it. Esc goes back.
        {standalone ? "" : " The cards below list everything."}
      </span>
    </p>
  );
}
