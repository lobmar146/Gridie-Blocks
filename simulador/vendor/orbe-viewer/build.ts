// Builds the three.js scene from a scene message and the parts' loaded GLBs. Every instance
// is a group in its parent's part frame, and one turn at the root maps the part frame into
// the viewer's world.

import { Box3, type Color, Euler, Group, Mesh, MeshStandardMaterial, type Object3D, Quaternion, Vector3 } from "three";
import type { GLTF } from "three/addons/loaders/GLTFLoader.js";
import { fourBands } from "./bands";
import { glowColour } from "./glow";
import { type Footprint, layOut } from "./layout";
import { darkGlass, planarUv, type ScreenBinding } from "./screen";
import type { Anchor, InstanceBase, PartData, Placement, Ref, SceneMessage, Vec3, Wire } from "./protocol";
import { instanceAt, type LeadAt, leadRef, leadsOf, partOf, refOf } from "./refs";
import { type Box, routeWire, type WireEnd, type WirePath } from "./wire-geometry";

/** The one mapping from the part frame (mm, +Z up) into the viewer's world (mm, +Y up):
 * part (x, y, z) lands at world (x, z, -y). It is the same turn glTF puts on a GLB's root. */
export const TO_THREE = new Euler(-Math.PI / 2, 0, 0);

const GLTF_TURN = new Quaternion(-Math.SQRT1_2, 0, 0, Math.SQRT1_2);
const TURN_TOLERANCE = 1e-6;

/** A GLB's nodes in the part frame, in mm. Refuses a GLB whose one root carries anything
 * other than glTF's -90 degree turn about X, a mesh included. */
export function fromGltf(gltf: GLTF, url: string): Group {
  const roots = gltf.scene.children;
  const root = roots[0];
  if (roots.length !== 1 || root === undefined) {
    throw new Error(`${url}: the GLB has ${roots.length} root nodes, and the viewer takes one`);
  }
  const q = root.quaternion;
  const turn = [q.x - GLTF_TURN.x, q.y - GLTF_TURN.y, q.z - GLTF_TURN.z, q.w - GLTF_TURN.w];
  const onlyTurn =
    turn.every((d) => Math.abs(d) < TURN_TOLERANCE) &&
    root.position.lengthSq() === 0 &&
    root.scale.equals(new Vector3(1, 1, 1));
  if (!onlyTurn) {
    throw new Error(`${url}: the GLB's root must carry exactly glTF's -90 degree turn about X`);
  }
  if (gltf.parser.associations.get(root)?.meshes !== undefined) {
    throw new Error(`${url}: the GLB's root node has a mesh, and the viewer draws only the root's children`);
  }
  const body = new Group();
  body.scale.setScalar(1000);
  for (const child of root.children) body.add(child.clone());
  return body;
}

/** What the viewer marks on an object, for hover and clicks. */
export interface Tag {
  /** The ref hover shows. */
  readonly ref: Ref;
  /** Set on an instance's group. */
  readonly instance?: { readonly pressable: boolean };
  /** Why the ref is not simulated, for hover. */
  readonly why?: string;
  /** Why the instance could not be drawn as its part data says, so it shows its GLB as
   * loaded. */
  readonly error?: string;
}

export function tagOf(object: Object3D): Tag | undefined {
  return object.userData.orbe as Tag | undefined;
}

function tag(object: Object3D, value: Tag): void {
  object.userData.orbe = value;
}

export interface GlowBinding {
  readonly material: MeshStandardMaterial;
  /** The material's colour while the LED is dark. */
  readonly base: Color;
  readonly by: GlowDrive;
}

/** What lights a glow: an LED's current on its `channels.leds` channel, with `full` the
 * current that is intensity 1, or an addressable LED's colour on its `channels.pixels`
 * channel. */
export type GlowDrive =
  | { readonly kind: "current"; readonly full: number; readonly channel: number }
  | { readonly kind: "pixel"; readonly channel: number };

export interface SlideBinding {
  readonly node: Object3D;
  readonly rest: Vector3;
  readonly delta: Vector3;
  readonly channel: number;
}

/** A node that turns with a param, such as a potentiometer's shaft with its `position`. */
export interface TurnBinding {
  readonly node: Object3D;
  readonly rest: Quaternion;
  /** The turn axis in the node's parent frame, a unit vector. */
  readonly axis: Vector3;
  /** The turn in radians from where the model draws the node, at a value of the param. */
  readonly angle: (value: number) => number;
  /** The param's index in a frame's `params`, or the servo's index in `horn_deg`. -1 when neither runs it. */
  readonly channel: number;
  /** The angle comes from a frame's `horn_deg` rather than `params`. */
  readonly horn: boolean;
  /** The instance's own value of the param, or 90° for a horn, which poses the node when no frame says more. */
  readonly value: number;
}

export interface DrawnWire {
  readonly path: WirePath;
  readonly colour: string;
}

export interface BuiltScene {
  /** In the viewer's world. */
  readonly root: Group;
  readonly glows: readonly GlowBinding[];
  /** Each screen node the session sends a glass for. */
  readonly screens: readonly ScreenBinding[];
  readonly slides: readonly SlideBinding[];
  readonly turns: readonly TurnBinding[];
  readonly wires: readonly DrawnWire[];
  /** One box per top-level instance and per wire, in the viewer's world. */
  readonly boxes: readonly Box[];
  /** One line per instance or wire the viewer could not draw as the scene says, each
   * starting with its ref. The rest of the scene still draws. */
  readonly errors: readonly string[];
}

function place(object: Object3D, placement: Placement): void {
  const [x, y, z] = placement.at;
  const [rx = 0, ry = 0, rz = 0] = placement.rotate.map((deg) => (deg * Math.PI) / 180);
  object.position.set(x, y, z);
  // Three's ZYX order is R = Rz·Ry·Rx, the turn about fixed X, then Y, then Z.
  object.rotation.set(rx, ry, rz, "ZYX");
}

/** Gives every mesh under `node` a material of its own, so one instance's colour or glow
 * leaves the others alone. */
function ownMaterials(node: Object3D): MeshStandardMaterial[] {
  const materials: MeshStandardMaterial[] = [];
  node.traverse((object) => {
    if (!(object instanceof Mesh) || !(object.material instanceof MeshStandardMaterial)) return;
    if (object.userData.ownMaterial !== true) {
      object.material = object.material.clone();
      object.userData.ownMaterial = true;
    }
    materials.push(object.material);
  });
  return materials;
}

function namedNode(body: Object3D, name: string, part: string): Object3D {
  const node = body.getObjectByName(name);
  if (node === undefined) {
    throw new Error(`${part}: the GLB has no node "${name}"`);
  }
  return node;
}

/** What drives a glow `by` names. `"brightness"` is the part's one LED. A segment name is
 * that body's current, on `channels.leds` as `@disp.seg_a`, using the same `full`. Any other
 * name is the part's colour reading, and the session sends its colour when the part is on
 * `channels.pixels`. Undefined when the scene sends nothing to draw it by. */
function glowDrive(scene: SceneMessage, ref: Ref, part: PartData, by: string): GlowDrive | undefined {
  const full = part.readings.brightness?.full;
  if (by === "brightness") {
    const channel = scene.channels.leds.indexOf(ref);
    return channel >= 0 && full !== undefined ? { kind: "current", full, channel } : undefined;
  }
  const segment = scene.channels.leds.indexOf(`${ref}.${by}`);
  if (segment >= 0 && full !== undefined) return { kind: "current", full, channel: segment };
  const channel = scene.channels.pixels.indexOf(ref);
  return channel >= 0 ? { kind: "pixel", channel } : undefined;
}

interface Press {
  readonly node: Object3D;
  readonly owner: Group;
  readonly slide: Vec3;
  readonly channel: number;
}

interface Turn {
  readonly node: Object3D;
  readonly owner: Group;
  readonly axis: Vec3;
  readonly angle: (value: number) => number;
  readonly channel: number;
  /** The angle comes from a frame's `horn_deg` rather than `params`. */
  readonly horn: boolean;
  readonly value: number;
}

interface Builder {
  readonly scene: SceneMessage;
  /** Each model URL's body, or why it could not be read. */
  readonly models: ReadonlyMap<string, Group | Error>;
  readonly pinReasons: ReadonlyMap<Ref, string>;
  readonly groups: Map<string, Group>;
  readonly glows: GlowBinding[];
  readonly screens: ScreenBinding[];
  readonly presses: Press[];
  readonly turns: Turn[];
  readonly errors: string[];
}

/** Draws the part's own body into `group`. Throws on part data the viewer cannot draw, and
 * then leaves `builder` as it was. */
function drawBody(builder: Builder, group: Group, instance: InstanceBase, path: readonly string[]): void {
  const { scene } = builder;
  const part = partOf(scene, instance);
  const ref = refOf(path);
  if (part.model === null) return;
  const template = builder.models.get(part.model);
  if (template === undefined) throw new Error(`model ${part.model} is not loaded`);
  if (template instanceof Error) throw template;
  const body = template.clone(true);
  const glows: GlowBinding[] = [];
  const presses: Press[] = [];

  for (const anchor of part.anchors) {
    const hover = leadRef(scene, { path, lead: anchor.lead });
    if (hover === undefined) continue;
    const why = builder.pinReasons.get(hover);
    for (const name of anchor.node === null ? anchor.also : [anchor.node, ...anchor.also]) {
      const node = body.getObjectByName(name);
      if (node !== undefined) tag(node, why === undefined ? { ref: hover } : { ref: hover, why });
    }
  }
  for (const { node, by } of part.view.tint ?? []) {
    const tint = part.tints[by]?.[String(instance.params[by])];
    if (tint === undefined) continue;
    for (const material of ownMaterials(namedNode(body, node, instance.part))) material.color.set(tint);
  }
  for (const { nodes, by } of part.view.recolour ?? []) {
    const ohms = instance.params[by];
    if (typeof ohms !== "number") throw new Error(`param "${by}" is not a number`);
    const bands = fourBands(ohms);
    if (bands === undefined) {
      console.warn(`${ref}: no 4-band code for ${ohms} ohm, so its bands keep the model's colours`);
      continue;
    }
    nodes.forEach((node, index) => {
      for (const material of ownMaterials(namedNode(body, node, instance.part))) {
        material.color.set(bands[index] ?? "#000000");
      }
    });
  }
  for (const { node, by } of part.view.glow ?? []) {
    const drive = glowDrive(scene, ref, part, by);
    if (drive === undefined) continue;
    for (const material of ownMaterials(namedNode(body, node, instance.part))) {
      material.emissive.copy(glowColour(material.color));
      material.emissiveIntensity = 0;
      material.toneMapped = false;
      glows.push({ material, base: material.color.clone(), by: drive });
    }
  }
  const screens: ScreenBinding[] = [];
  for (const { node } of part.view.screen ?? []) {
    const channel = scene.channels.screens?.indexOf(ref) ?? -1;
    if (channel < 0) continue;
    const glass = namedNode(body, node, instance.part);
    planarUv(glass);
    const materials = ownMaterials(glass);
    darkGlass(materials);
    screens.push({ materials, channel, shown: undefined, texture: undefined });
  }
  const press = part.controls.press;
  const switchChannel = scene.channels.switches.indexOf(ref);
  if (press !== undefined && switchChannel >= 0) {
    const joint = part.joints[press.joint];
    if (joint === undefined) throw new Error(`controls.press names no joint "${press.joint}"`);
    const { slide } = joint;
    if (slide === undefined) throw new Error(`controls.press names joint "${press.joint}", which does not slide`);
    presses.push({
      node: namedNode(body, joint.node, instance.part),
      owner: group,
      slide: [slide[0] * joint.range, slide[1] * joint.range, slide[2] * joint.range],
      channel: switchChannel,
    });
  }
  const turns: Turn[] = [];
  for (const joint of Object.values(part.joints)) {
    const { turn, by } = joint;
    if (turn === undefined || by === undefined) continue;
    const own = instance.params[by.param];
    const radians = (joint.range * Math.PI) / 180;
    const paramChannel = (scene.params ?? []).findIndex((param) => param.ref === `${ref}.${by.param}`);
    const hornChannel = scene.channels.horns.indexOf(ref);
    const horn = paramChannel < 0 && hornChannel >= 0;
    turns.push({
      node: namedNode(body, joint.node, instance.part),
      owner: group,
      axis: turn,
      angle: (value) => ((value - by.min) / (by.max - by.min) - 0.5) * radians,
      channel: horn ? hornChannel : paramChannel,
      horn,
      value: horn ? 90 : typeof own === "number" ? own : (by.min + by.max) / 2,
    });
  }
  group.add(body);
  builder.glows.push(...glows);
  builder.screens.push(...screens);
  builder.presses.push(...presses);
  builder.turns.push(...turns);
}

function build(builder: Builder, instance: InstanceBase, path: readonly string[]): Group {
  const ref = refOf(path);
  const group = new Group();
  group.name = ref;
  builder.groups.set(path.join("."), group);
  const pressable = builder.scene.parts[instance.part]?.controls.press !== undefined;
  const why = instance.not_simulated;
  try {
    drawBody(builder, group, instance, path);
    tag(group, { ref, instance: { pressable }, ...(why === undefined ? {} : { why }) });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    builder.errors.push(`${ref}: ${message}`);
    tag(group, { ref, instance: { pressable: false }, error: message });
    const model = builder.scene.parts[instance.part]?.model;
    const plain = model == null ? undefined : builder.models.get(model);
    if (plain instanceof Group) group.add(plain.clone(true));
  }

  for (const child of instance.children) {
    const childPath = [...path, child.name];
    // The type says a child always has one, but the message is read from a session.
    const placement = child.placement as Placement | null | undefined;
    if (placement == null) {
      builder.errors.push(`${refOf(childPath)}: the scene message gives this child no placement`);
      continue;
    }
    const childGroup = build(builder, child, childPath);
    place(childGroup, placement);
    group.add(childGroup);
  }
  return group;
}

function footprint(object: Object3D): Footprint {
  const box = new Box3().setFromObject(object);
  return { minX: box.min.x, minY: box.min.y, maxX: box.max.x, maxY: box.max.y };
}

function boxOf(object: Object3D): Box {
  const box = new Box3().setFromObject(object);
  return { min: box.min.toArray(), max: box.max.toArray() };
}

function anchorOf(builder: Builder, at: LeadAt): { group: Group; anchor: Anchor } {
  const group = builder.groups.get(at.path.join("."));
  const anchor = instanceAt(builder.scene, at.path)?.part.anchors.find((item) => item.lead === at.lead);
  if (group === undefined || anchor === undefined) {
    throw new Error(`${refOf(at.path)}: no anchor for lead ${at.lead}`);
  }
  return { group, anchor };
}

function wireEnd(group: Group, anchor: Anchor): WireEnd {
  const at = group.localToWorld(new Vector3(...anchor.at));
  const axis = new Vector3(...anchor.axis).transformDirection(group.matrixWorld);
  return { at: at.toArray(), axis: axis.toArray() };
}

function nearestPair(a: readonly WireEnd[], b: readonly WireEnd[]): readonly [WireEnd, WireEnd] | undefined {
  let best: readonly [WireEnd, WireEnd] | undefined;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const from of a) {
    for (const to of b) {
      const d = Math.hypot(from.at[0] - to.at[0], from.at[1] - to.at[1], from.at[2] - to.at[2]);
      if (d < bestDistance) {
        best = [from, to];
        bestDistance = d;
      }
    }
  }
  return best;
}

const PALETTE = ["#ff8a1e", "#f2d21b", "#2f9e44", "#2f5fd0", "#7b3ff0", "#f4f4f4"] as const;

/** The wire's own colour, or the next colour in the palette when the scene sets none. */
function wireColour(wire: Wire, index: number): string {
  return wire.color ?? PALETTE[index % PALETTE.length] ?? "#f4f4f4";
}

export function buildScene(scene: SceneMessage, models: ReadonlyMap<string, Group | Error>): BuiltScene {
  const builder: Builder = {
    scene,
    models,
    pinReasons: new Map((scene.not_simulated ?? []).map(({ ref, why }) => [ref, why])),
    groups: new Map(),
    glows: [],
    screens: [],
    presses: [],
    turns: [],
    errors: [],
  };
  const root = new Group();
  root.rotation.copy(TO_THREE);

  const groups = scene.instances.map((instance) => build(builder, instance, [instance.name]));
  const placed: Footprint[] = [];
  const unplaced: Group[] = [];
  for (const [index, instance] of scene.instances.entries()) {
    const group = groups[index] as Group;
    if (instance.placement === null) {
      unplaced.push(group);
    } else {
      place(group, instance.placement);
      group.updateMatrixWorld(true);
      placed.push(footprint(group));
    }
  }
  const placements = layOut(placed, unplaced.map(footprint));
  for (const [index, group] of unplaced.entries()) {
    const placement = placements[index];
    if (placement !== undefined) place(group, placement);
  }
  for (const group of groups) root.add(group);
  root.updateMatrixWorld(true);

  const slides = builder.presses.map(({ node, owner, slide, channel }) => {
    const parent = node.parent ?? owner;
    const from = parent.worldToLocal(owner.localToWorld(new Vector3(0, 0, 0)));
    const to = parent.worldToLocal(owner.localToWorld(new Vector3(...slide)));
    return { node, rest: node.position.clone(), delta: to.sub(from), channel };
  });
  const turns = builder.turns.map(({ node, owner, axis, angle, channel, horn, value }) => {
    const parent = node.parent ?? owner;
    const from = parent.worldToLocal(owner.localToWorld(new Vector3(0, 0, 0)));
    const to = parent.worldToLocal(owner.localToWorld(new Vector3(...axis)));
    return { node, rest: node.quaternion.clone(), axis: to.sub(from).normalize(), angle, channel, horn, value };
  });

  const boxes = groups.map(boxOf);
  const wires: DrawnWire[] = [];
  for (const [index, wire] of scene.wires.filter((item) => item.kind === "jumper").entries()) {
    try {
      const [a, b] = wire.ends.map((end) => {
        const leads = leadsOf(scene, end);
        if (leads.length === 0) throw new Error(`"${end}" reaches no lead`);
        return leads.map((lead) => {
          const { group, anchor } = anchorOf(builder, lead);
          return wireEnd(group, anchor);
        });
      });
      const ends = a && b ? nearestPair(a, b) : undefined;
      if (ends === undefined) throw new Error("no ends");
      wires.push({ path: routeWire(ends, boxes), colour: wireColour(wire, index) });
    } catch (error) {
      builder.errors.push(`wire ${wire.ends.join(" - ")}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  const wireBoxes = wires.map(({ path }) => {
    const box = new Box3().setFromPoints(path.points.map((point) => new Vector3(...point)));
    return { min: box.min.toArray(), max: box.max.toArray() };
  });
  if (builder.errors.length > 0) console.error(`the viewer could not draw all of the scene:\n${builder.errors.join("\n")}`);
  return { root, glows: builder.glows, screens: builder.screens, slides, turns, wires, boxes: [...boxes, ...wireBoxes], errors: builder.errors };
}
