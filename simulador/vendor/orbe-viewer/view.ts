// What a viewer draws of a scene: the fields of `View` in packages/scene/src/circuit/view.rs, which
// a `SceneMessage` carries beside its session and channels. This file is kept by hand.
//
// Lengths, positions and directions are in the part frame: mm, +Z up, the seating plane at
// z = 0. Other quantities are SI numbers: ohms, amperes, picoseconds.

import type { Ref } from "./protocol";

export type Vec3 = readonly [number, number, number];

/** A rigid transform in the parent's frame. A point p of the child lands at
 * `at + R p`, R = Rz·Ry·Rx, with `rotate` in degrees about the parent's fixed X, Y, Z. */
export interface Placement {
  readonly at: Vec3;
  readonly rotate: Vec3;
}

/** Each param the scene or the parent part sets, after the reader parsed it: a number param
 * as a number in its SI unit (`"10k"` is `10000`), a choice param as its choice's name. File
 * params are left out. */
export type Params = Readonly<Record<string, number | string>>;

export interface InstanceBase {
  /** The role name in the parent, such as `nano` or `r_l`. */
  readonly name: string;
  /** A key of `SceneMessage.parts`. */
  readonly part: string;
  readonly params: Params;
  readonly children: readonly Child[];
  /** Why the part is not simulated: its own `not_simulated` reason in its parent's `parts`,
   * else the nearest marked ancestor's. Absent for a simulated part. */
  readonly not_simulated?: string;
}

/** A part the scene uses. `placement` is null when the scene's `layout` has no entry, and
 * the viewer lays it out for drawing only. */
export interface Instance extends InstanceBase {
  readonly placement: Placement | null;
}

/** A child of a part, placed by its parent's `layout`. A child the layout leaves out sits at
 * the parent's origin, so the reader writes the identity placement for it. */
export interface Child extends InstanceBase {
  readonly placement: Placement;
}

/** One lead of a part's body model, copied from `<id>.anchors.json`. */
export interface Anchor {
  readonly lead: number;
  /** The GLB node of the lead. A pad's node is merged away and no longer in the GLB. A socket
   * cut into the body, such as a breadboard's hole, has none. */
  readonly node: string | null;
  /** Other GLB nodes that belong to the lead, such as a header pin's housing. */
  readonly also: readonly string[];
  /** The lead's tip. */
  readonly at: Vec3;
  /** The unit direction the lead goes in when it is inserted. */
  readonly axis: Vec3;
  readonly kind: "leg" | "socket" | "pad";
}

/** `part.jsonc`'s `view`, unchanged. Every node is a GLB node name of the part's body model. */
export interface PartView {
  /** The node glows by `brightness`, the LED's current, or by the name of the part's reading
   * `"of": "rgb"`, the colour an addressable LED latched. */
  readonly glow?: readonly { readonly node: string; readonly by: string }[];
  /** The node takes the `tint` of the choice the param `by` picks. */
  readonly tint?: readonly { readonly node: string; readonly by: string }[];
  /** The node's top face shows the glass of the part's reading `by`, `"of": "screen"`. */
  readonly screen?: readonly { readonly node: string; readonly by: string }[];
  readonly recolour?: readonly {
    readonly nodes: readonly string[];
    readonly by: string;
    readonly rule: "iec60062-4-band";
  }[];
}

/** A joint of `part.jsonc`. The node slides along `slide`, a unit vector in the part frame, by
 * `range` mm when the joint is fully driven, or turns about `turn`, a unit vector in the part
 * frame through the node's origin, right-handed, by `range` degrees. */
export interface Joint {
  readonly node: string;
  readonly slide?: Vec3;
  readonly turn?: Vec3;
  readonly range: number;
  /** The param that poses the joint. At the middle of `min` to `max` the node sits where the
   * model draws it, and it moves half of `range` toward each end, `+` toward `max`. */
  readonly by?: { readonly param: string; readonly min: number; readonly max: number };
}

/** One entry of `part.jsonc`'s `not_simulated`, unchanged. It names a feature the engine
 * leaves out, such as light or temperature, not a part that is dropped. The viewer does not
 * read it yet. */
export interface NotSimulated {
  readonly what: string;
  readonly why: string;
  /** The part's own pins the entry covers. */
  readonly pins?: readonly string[];
}

/** What the viewer needs of one part, keyed by part id in `SceneMessage.parts`. */
export interface PartData {
  /** The URL of `<id>.glb`, or null for a part with no body model of its own. One URL is
   * loaded once, however many instances use the part. */
  readonly model: string | null;
  readonly anchors: readonly Anchor[];
  /** Pins defined by leads, from `part.jsonc` `pins`: `"a": [1, 2]`. */
  readonly leads: Readonly<Record<string, readonly number[]>>;
  /** Labels, pins defined by child pins, from `part.jsonc` `pins`: `"D13": ["j2.1"]`. */
  readonly labels: Readonly<Record<string, readonly string[]>>;
  readonly view: PartView;
  readonly joints: Readonly<Record<string, Joint>>;
  /** A part with `press` is pressable, and a press drives the joint it names. */
  readonly controls: { readonly press?: { readonly joint: string } };
  /** `readings.brightness.full` in amperes, the current that draws a glow at intensity 1. */
  readonly readings: { readonly brightness?: { readonly full: number } };
  /** For each choice param, the `tint` of each choice that has one. */
  readonly tints: Readonly<Record<string, Readonly<Record<string, string>>>>;
  readonly not_simulated?: readonly NotSimulated[];
  /** A board's strips, each the hole pins one clip joins, such as `["a1", "b1", "c1", "d1",
   * "e1"]`. Absent on a part with no holes. */
  readonly strips?: readonly (readonly string[])[];
}

/** A pin pair. Each end is a pin ref from the scene's top, without the `@`, such as
 * `nano.D2`. A jumper inside a part is listed here too, with its ends prefixed by the path to
 * that part. Only `jumper` is drawn. A part plugged into a breadboard has a `contact` from each
 * leg's pin to its hole, such as `led1.anode` to `bb.f20`. */
export interface Wire {
  readonly ends: readonly [string, string];
  readonly kind: "jumper" | "trace" | "contact";
  readonly color?: string;
}

/** A pin whose net reaches no pin the engine simulates and has a reason, the one `orbe
 * check` gives for a wire to it. Every entry carries its `why`. */
export interface PinNotSimulated {
  /** The ref hover shows for the pin: the outermost label that reaches it, such as
   * `@nano.3V3`, else its own pin. */
  readonly ref: Ref;
  readonly why: string;
}

/** The scene's own fields of a `SceneMessage`. */
export interface View {
  readonly scene_hash: string;
  /** Absent on a part drawn on its own, which has no circuit. */
  readonly circuit_hash?: string;
  readonly instances: readonly Instance[];
  readonly parts: Readonly<Record<string, PartData>>;
  readonly wires: readonly Wire[];
  readonly not_simulated?: readonly PinNotSimulated[];
}
