// Positions for the parts a scene leaves unplaced. They are for drawing only and are never
// written back.

import type { Placement } from "./protocol";

/** A footprint on the seating plane, in the part frame's mm. */
export interface Footprint {
  readonly minX: number;
  readonly minY: number;
  readonly maxX: number;
  readonly maxY: number;
}

export const LAYOUT_GAP_MM = 8;

/** Places each unplaced footprint, given in its own frame, in a row along +X to the right of
 * everything placed, centred on y = 0. */
export function layOut(placed: readonly Footprint[], unplaced: readonly Footprint[]): Placement[] {
  let cursor = placed.length === 0 ? 0 : Math.max(...placed.map((box) => box.maxX)) + LAYOUT_GAP_MM;
  return unplaced.map((box) => {
    const x = cursor - box.minX;
    cursor += box.maxX - box.minX + LAYOUT_GAP_MM;
    return { at: [x, 0 - (box.minY + box.maxY) / 2, 0], rotate: [0, 0, 0] };
  });
}
