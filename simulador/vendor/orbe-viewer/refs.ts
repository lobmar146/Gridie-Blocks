// Refs as the CLI writes them, worked out from the scene message alone.

import type { InstanceBase, PartData, Ref, SceneMessage, Vec3 } from "./protocol";

/** An instance at every depth, with its path of role names from the scene's top. */
export interface Placed {
  readonly path: readonly string[];
  readonly instance: InstanceBase;
  readonly part: PartData;
}

export function refOf(path: readonly string[]): Ref {
  return `@${path.join(".")}`;
}

export function partOf(scene: SceneMessage, instance: InstanceBase): PartData {
  const part = scene.parts[instance.part];
  if (part === undefined) {
    throw new Error(`scene message: no part data for "${instance.part}"`);
  }
  return part;
}

export function instanceAt(scene: SceneMessage, path: readonly string[]): Placed | undefined {
  let list: readonly InstanceBase[] = scene.instances;
  let found: InstanceBase | undefined;
  for (const name of path) {
    found = list.find((item) => item.name === name);
    if (found === undefined) return undefined;
    list = found.children;
  }
  return found === undefined ? undefined : { path, instance: found, part: partOf(scene, found) };
}

/** A lead of the instance at `path`, which a pin ref reaches. */
export interface LeadAt {
  readonly path: readonly string[];
  readonly lead: number;
}

/** Every lead a pin ref such as `nano.D13` reaches, through labels to any depth. A label on
 * two header pins, or a switch pin on two legs, gives more than one. */
export function leadsOf(scene: SceneMessage, pinRef: string): LeadAt[] {
  const segments = pinRef.replace(/^@/, "").split(".");
  const pin = segments.pop();
  const owner = instanceAt(scene, segments);
  if (pin === undefined || owner === undefined) return [];
  const leads = owner.part.leads[pin];
  if (leads !== undefined) {
    return leads.map((lead) => ({ path: owner.path, lead }));
  }
  return (owner.part.labels[pin] ?? []).flatMap((childPin) =>
    leadsOf(scene, [...owner.path, childPin].join("."))
  );
}

/** The ref a person sees for a lead: the outermost label that reaches it, such as
 * `@nano.D13` for lead 1 of `nano.j2`, else the pin itself, such as `@led1.anode`. */
export function leadRef(scene: SceneMessage, at: LeadAt): Ref | undefined {
  const owner = instanceAt(scene, at.path);
  if (owner === undefined) return undefined;
  const pin = Object.entries(owner.part.leads).find(([, leads]) => leads.includes(at.lead))?.[0];
  if (pin === undefined) return undefined;
  let path = at.path;
  let name = pin;
  for (;;) {
    const role = path[path.length - 1];
    const parent = instanceAt(scene, path.slice(0, -1));
    const inner = `${role}.${name}`;
    const label = parent
      ? Object.entries(parent.part.labels).find(([, pins]) => pins.includes(inner))?.[0]
      : undefined;
    if (parent === undefined || label === undefined) break;
    path = parent.path;
    name = label;
  }
  return refOf([...path, name]);
}

/** Half the 2.54 mm pitch: a point further than this from every hole is over none. */
const HOLE_REACH_MM = 1.27;

/** A board's hole under `at`, a point in the board's part frame, and the holes its strip joins.
 * A point counts from the hole's mouth down into the hole. */
export function holeAt(part: PartData, at: Vec3): { readonly pin: string; readonly strip: readonly string[] } | undefined {
  if (part.strips === undefined) return undefined;
  let best: { lead: number; distance: number } | undefined;
  for (const anchor of part.anchors) {
    if (anchor.kind !== "socket" || at[2] > anchor.at[2] + 0.1) continue;
    const distance = Math.hypot(anchor.at[0] - at[0], anchor.at[1] - at[1]);
    if (distance <= HOLE_REACH_MM && (best === undefined || distance < best.distance)) {
      best = { lead: anchor.lead, distance };
    }
  }
  if (best === undefined) return undefined;
  const lead = best.lead;
  const pin = Object.entries(part.leads).find(([, leads]) => leads.includes(lead))?.[0];
  if (pin === undefined) return undefined;
  return { pin, strip: part.strips.find((strip) => strip.includes(pin)) ?? [pin] };
}

/** A hole's name as its row and column, as `W` and 12 for `W12`. */
function rowColumn(name: string): readonly [string, number] | undefined {
  const match = /^([A-Za-z]+)(\d+)$/.exec(name);
  return match === null ? undefined : [match[1] ?? "", Number(match[2])];
}

/** Whether hole `b` is the hole after `a` along a row or down a column. */
function nextHole(a: string, b: string): boolean {
  const [x, y] = [rowColumn(a), rowColumn(b)];
  if (x === undefined || y === undefined) return false;
  const rowAfter = x[0].length === 1 && y[0].length === 1 && y[0].charCodeAt(0) === x[0].charCodeAt(0) + 1;
  return (x[0] === y[0] && y[1] === x[1] + 1) || (x[1] === y[1] && rowAfter);
}

/** The holes a strip joins, as runs of holes side by side, each name after `prefix`: `a1 to e1`,
 * or a rail with gaps as `W1 to W5, W7 to W11`. The CLI's `orbe part` writes strips the same way. */
export function stripText(strip: readonly string[], prefix = ""): string {
  const runs: [string, string][] = [];
  for (const hole of strip) {
    const last = runs[runs.length - 1];
    if (last !== undefined && nextHole(last[1], hole)) last[1] = hole;
    else runs.push([hole, hole]);
  }
  return runs.map(([a, b]) => (a === b ? `${prefix}${a}` : `${prefix}${a} to ${prefix}${b}`)).join(", ");
}
