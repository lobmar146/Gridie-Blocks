import type { Command, LiveParam, WorldQuantity } from "./protocol";

/** Drops the binary noise of a sum such as `-40 + 3 * 0.5`. */
const clean = (value: number) => Number(value.toPrecision(12));

/** The values a quantity's thumb steps through, ascending: its scale's values inside its range,
 * both ends of the range, and the value the scene starts it at. */
export function stops(quantity: WorldQuantity): number[] {
  const { min, max, scale, start } = quantity;
  const values = [min, max, start];
  if (scale.kind === "linear") {
    const count = Math.round((max - min) / scale.step);
    for (let k = 0; k <= count; k += 1) values.push(clean(min + k * scale.step));
  } else {
    values.push(0);
    for (let decade = 1; decade <= max; decade *= 10) {
      for (const digit of [1, 2, 3, 5]) values.push(digit * decade);
    }
  }
  return [...new Set(values.filter((value) => value >= min && value <= max))].sort((a, b) => a - b);
}

/** The index of the stop nearest `value`. */
export function nearest(stops: readonly number[], value: number): number {
  let best = 0;
  let gap = Number.POSITIVE_INFINITY;
  stops.forEach((stop, index) => {
    if (Math.abs(stop - value) < gap) {
      best = index;
      gap = Math.abs(stop - value);
    }
  });
  return best;
}

/** `value` as the page prints it, to six significant digits. */
export const formatValue = (value: number) => String(Number(value.toPrecision(6)));

export type Parsed = { readonly ok: true; readonly value: number } | { readonly ok: false; readonly why: string };

/** A typed value, checked as `orbe set` checks it. */
export function parseValue(quantity: WorldQuantity, text: string): Parsed {
  const typed = text.trim();
  const value = typed === "" ? Number.NaN : Number(typed);
  if (!Number.isFinite(value)) {
    return { ok: false, why: `\`${typed}\` is not a number; write ${quantity.name} in ${quantity.unit}, such as ${formatValue(quantity.start)}` };
  }
  if (value < quantity.min || value > quantity.max) {
    return { ok: false, why: `${quantity.name} is from ${quantity.min} to ${quantity.max} ${quantity.unit}, not ${typed}` };
  }
  return { ok: true, value };
}

/** What one slider sets, a world quantity or a part's live param, as the page shows it. */
export interface Control {
  /** The slider's id and test id, such as `world-light` or `param-pot1-position`. */
  readonly id: string;
  /** What the label says, such as `light` or `pot1.position`. */
  readonly label: string;
  /** The unit beside the number, empty for a fraction. */
  readonly unit: string;
  /** The value the scene gives it at t = 0. */
  readonly start: number;
  /** The values the thumb steps through, ascending. */
  readonly stops: readonly number[];
  /** A typed value, checked as `orbe set` checks it. */
  readonly parse: (text: string) => Parsed;
  /** The command that sets `value`. */
  readonly command: (value: number) => Command;
}

export function worldControl(quantity: WorldQuantity): Control {
  return {
    id: `world-${quantity.name}`,
    label: quantity.name,
    unit: quantity.unit,
    start: quantity.start,
    stops: stops(quantity),
    parse: (text) => parseValue(quantity, text),
    command: (value) => ({ cmd: "set", quantity: quantity.name, value }),
  };
}

/** The values a live param's thumb steps through: a hundredth of its range, rounded down to a
 * power of ten, from one step inside each bound, and the value the scene starts it at. */
export function paramStops(param: LiveParam): number[] {
  const { above, below, start } = param;
  const step = 10 ** Math.floor(Math.log10((below - above) / 100));
  const values = [start];
  for (let value = clean(above + step); value < below; value = clean(value + step)) values.push(value);
  return [...new Set(values.filter((value) => value > above && value < below))].sort((a, b) => a - b);
}

/** A typed value for a live param, checked as `orbe set @part.param` checks it. */
export function parseParam(param: LiveParam, text: string): Parsed {
  const typed = text.trim();
  const value = typed === "" ? Number.NaN : Number(typed);
  if (!Number.isFinite(value)) {
    return { ok: false, why: `\`${typed}\` is not a number; write the param's value, such as ${formatValue(param.start)}` };
  }
  if (!(value > param.above && value < param.below)) {
    return { ok: false, why: `${param.ref.slice(1)} is above ${param.above} and below ${param.below}, not ${typed}` };
  }
  return { ok: true, value };
}

export function paramControl(param: LiveParam): Control {
  const label = param.ref.slice(1);
  return {
    id: `param-${label.replaceAll(".", "-")}`,
    label,
    unit: param.unit === "1" ? "" : param.unit,
    start: param.start,
    stops: paramStops(param),
    parse: (text) => parseParam(param, text),
    command: (value) => ({ cmd: "set", ref: param.ref, value }),
  };
}

/** One slider's state. `idle` shows the frame's value. The others show `value`: `moving` while
 * the person moves the thumb and nothing is sent, `sending` while its `set` has no reply, and
 * `landing` once the session accepted it, until the next frame. */
export type Thumb =
  | { readonly kind: "idle" }
  | { readonly kind: "moving"; readonly value: number }
  | { readonly kind: "sending"; readonly value: number }
  | { readonly kind: "landing"; readonly value: number };

/** What happens to a slider. `frame` is the value the latest frame shows. `settle` is the
 * person letting go of the thumb, and `send` a typed value. */
export type ThumbEvent =
  | { readonly type: "move"; readonly value: number }
  | { readonly type: "settle"; readonly frame: number }
  | { readonly type: "send"; readonly value: number; readonly frame: number }
  | { readonly type: "replied"; readonly value: number; readonly ok: boolean; readonly frame: number }
  | { readonly type: "frame" };

export const IDLE: Thumb = { kind: "idle" };

/** The slider after `event`. A value the frame already shows sends nothing, since the session
 * refuses a `set` that changes nothing. */
export function nextThumb(thumb: Thumb, event: ThumbEvent): Thumb {
  switch (event.type) {
    case "move":
      return { kind: "moving", value: event.value };
    case "settle":
      if (thumb.kind !== "moving") return thumb;
      return thumb.value === event.frame ? IDLE : { kind: "sending", value: thumb.value };
    case "send":
      return event.value === event.frame ? IDLE : { kind: "sending", value: event.value };
    case "replied":
      if (thumb.kind !== "sending" || thumb.value !== event.value) return thumb;
      return !event.ok || event.frame === event.value ? IDLE : { kind: "landing", value: event.value };
    case "frame":
      return thumb.kind === "landing" ? IDLE : thumb;
  }
}

/** The value a slider shows. */
export const shownValue = (thumb: Thumb, frame: number) => (thumb.kind === "idle" ? frame : thumb.value);
