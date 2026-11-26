import type { FrameState } from "./protocol";

/** The speed label for a `play` frame's `ratio`, such as `0.07x`, only while the run falls
 * behind real time. Returns `null` when not playing, when `ratio` is absent, or when it is
 * at real time (1 or rounding to `1.00x`). */
export function speedText(state: FrameState, ratio: number | undefined): string | null {
  if (state !== "playing" || ratio === undefined || !Number.isFinite(ratio) || ratio < 0 || ratio >= 1) {
    return null;
  }
  if (Math.round(ratio * 100) >= 100) return null;
  if (ratio < 0.01) return "<0.01x";
  return `${ratio.toFixed(2)}x`;
}
