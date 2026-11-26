// Adapted from maker-sandbox (MIT, Copyright 2026 Alwurts).
import { Color } from "three";

/** The brightness reading's `full` current is intensity 1. */
export function glowIntensity(amps: number, full: number): number {
  if (!(amps > 0 && Number.isFinite(amps))) {
    return 0;
  }
  return amps / full;
}

/** An addressable LED's glow from the red, green and blue it latched, each 0 to 255: its
 * brightest channel at 255 is intensity 1. `into` becomes that colour at luminance 1. */
export function pixelGlow(rgb: readonly number[], into: Color): number {
  const [r = 0, g = 0, b = 0] = rgb;
  const peak = Math.max(r, g, b);
  if (!(peak > 0)) {
    return 0;
  }
  into.setRGB(r / 255, g / 255, b / 255);
  into.multiplyScalar(1 / luminance(into));
  return peak / 255;
}

function luminance(colour: Color): number {
  return 0.2126 * colour.r + 0.7152 * colour.g + 0.0722 * colour.b;
}

/** `base` scaled to luminance 1, the bloom threshold. */
export function glowColour(base: Color): Color {
  const of = luminance(base);
  return of > 0 ? base.clone().multiplyScalar(1 / of) : new Color(1, 1, 1);
}

/** The surface colour under a glow at `intensity`: `base` at 0, fading to black at 1. The
 * light on the surface then adds nothing at intensity 1, so every colour starts to bloom
 * there. */
export function litColour(base: Color, intensity: number, into: Color): Color {
  return into.copy(base).multiplyScalar(Math.max(0, 1 - intensity));
}

/** The current to draw. `peak` is the brightest current since the previous drawn frame.
 * A pulse that has already fallen still shows once, so a short press cannot land between
 * frames and disappear. A current that is still near that peak draws as it is. */
export function shownCurrent(live: number, peak: number): number {
  return live < peak * 0.5 ? peak : live;
}
