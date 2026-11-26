// Adapted from maker-sandbox (MIT, Copyright 2026 Alwurts).
// A wire's path, worked out from its two ends and the part boxes and never stored. In the
// viewer's world: mm, +Y up.

import type { Vec3 } from "./protocol";

export const WIRE_RADIUS_MM = 0.5;
export const HOUSING_MM = 14;
/** How far a female housing slides over the lead's tip. */
export const INSERT_MM = 2.5;
const STUB_MM = 3;
const CLEARANCE_MM = 1.5;
// The tube tucks this far into the housing so no seam shows at its end.
const TUCK_MM = 0.5;
const LEAD_CLEAR_MM = 2.54;
const SPAN_SAMPLES = 17;
const ARCH_STEP_MM = 1;

/** A lead's tip and the unit direction the lead points, out of its part. */
export interface WireEnd {
  readonly at: Vec3;
  readonly axis: Vec3;
}

export interface Box {
  readonly min: Vec3;
  readonly max: Vec3;
}

export interface WirePath {
  readonly points: readonly Vec3[];
  readonly ends: readonly [WireEnd, WireEnd];
}

export function along(point: Vec3, axis: Vec3, distance: number): Vec3 {
  return [point[0] + axis[0] * distance, point[1] + axis[1] * distance, point[2] + axis[2] * distance];
}

function distance(a: Vec3, b: Vec3): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

function archLift(length: number): number {
  return Math.min(12, Math.max(2, length * 0.15));
}

function controls(from: Vec3, to: Vec3, height: number): readonly Vec3[] {
  const at = (t: number): Vec3 => [from[0] + (to[0] - from[0]) * t, height, from[2] + (to[2] - from[2]) * t];
  return [from, at(0.25), at(0.75), to];
}

function onPolyline(points: readonly Vec3[], t: number): Vec3 {
  const scaled = t * (points.length - 1);
  const index = Math.min(Math.floor(scaled), points.length - 2);
  const local = scaled - index;
  const from = points[index] ?? points[0] ?? [0, 0, 0];
  const to = points[index + 1] ?? from;
  return [
    from[0] + (to[0] - from[0]) * local,
    from[1] + (to[1] - from[1]) * local,
    from[2] + (to[2] - from[2]) * local,
  ];
}

function sample(points: readonly Vec3[]): Vec3[] {
  const sampled: Vec3[] = [];
  for (let index = 0; index < SPAN_SAMPLES; index++) {
    sampled.push(onPolyline(points, index / (SPAN_SAMPLES - 1)));
  }
  return sampled;
}

function nearLead(point: Vec3, end: Vec3): boolean {
  return Math.hypot(point[0] - end[0], point[2] - end[2]) <= LEAD_CLEAR_MM;
}

function over(box: Box, point: Vec3): boolean {
  return point[0] >= box.min[0] && point[0] <= box.max[0] && point[2] >= box.min[2] && point[2] <= box.max[2];
}

// `side` is 1 for a span that arches over the boxes and -1 for one that hangs under them.
function clears(points: readonly Vec3[], boxes: readonly Box[], ends: readonly [Vec3, Vec3], side: 1 | -1): boolean {
  for (const point of points) {
    if (nearLead(point, ends[0]) || nearLead(point, ends[1])) {
      continue;
    }
    for (const box of boxes) {
      if (!over(box, point)) continue;
      const blocked = side === 1 ? point[1] < box.max[1] + CLEARANCE_MM : point[1] > box.min[1] - CLEARANCE_MM;
      if (blocked) return false;
    }
  }
  return true;
}

function span(from: Vec3, to: Vec3, boxes: readonly Box[], ends: readonly [Vec3, Vec3], side: 1 | -1): readonly Vec3[] {
  const extreme = side === 1 ? Math.max(0, ...boxes.map((box) => box.max[1])) : Math.min(0, ...boxes.map((box) => box.min[1]));
  const cap = extreme + side * 30;
  const start = side === 1 ? Math.max(from[1], to[1]) : Math.min(from[1], to[1]);
  let height = start + side * archLift(distance(from, to));
  let points = sample(controls(from, to, height));
  while (!clears(points, boxes, ends, side) && side * (cap - height) > 0) {
    height += side * ARCH_STEP_MM;
    points = sample(controls(from, to, height));
  }
  return points;
}

/** The wire leaves each end's housing along the lead, then arches over the part boxes, or
 * hangs under them when the leads point down. */
export function routeWire(ends: readonly [WireEnd, WireEnd], boxes: readonly Box[]): WirePath {
  const [start, finish] = ends;
  const out = HOUSING_MM - INSERT_MM - TUCK_MM;
  const startOut = along(start.at, start.axis, out);
  const finishOut = along(finish.at, finish.axis, out);
  const side = start.axis[1] + finish.axis[1] >= 0 ? 1 : -1;
  const points = span(
    along(startOut, start.axis, STUB_MM),
    along(finishOut, finish.axis, STUB_MM),
    boxes,
    [start.at, finish.at],
    side
  );
  return { points: [startOut, ...points, finishOut], ends };
}
