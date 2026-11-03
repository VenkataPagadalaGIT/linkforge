/**
 * The state the home banner's seam shares with the WebGL portrait.
 *
 * TwinSeam owns it and writes the seam every frame; PortraitAssembly reads
 * it every frame, so the line on the page and the split in the face can
 * never disagree. Plain mutable fields, no React state: it changes 60 times
 * a second and nothing should re-render for it.
 */
export interface Twin {
  /** The seam's x in the portrait canvas's clip space: -1 is its left edge,
   *  1 its right edge. Right of it the face is the AI twin. Starts past the
   *  right edge: all human until the controller takes over. */
  seamNdc: number;
  /** The portrait's assembly clock (0 to 1.3), reported by the portrait, so
   *  the opening sweep waits until there is a face to sweep across. */
  assembly: number;
  /** A click or Enter on the face: the whole banner becomes the twin, or
   *  comes back. Replaced by the controller once it mounts. */
  toggle: () => void;
}

export const createTwin = (): Twin => ({ seamNdc: 2, assembly: -1, toggle: () => {} });
