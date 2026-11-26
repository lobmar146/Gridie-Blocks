// Adapted from maker-sandbox (MIT, Copyright 2026 Alwurts).
import { type ThreeEvent, useFrame, useLoader, useThree } from "@react-three/fiber";
import { EffectComposer, Outline } from "@react-three/postprocessing";
import { BlendFunction, SelectiveBloomEffect } from "postprocessing";
import { type RefObject, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useSyncExternalStore } from "react";
import { BackSide, Box3, type Group, Mesh, MeshStandardMaterial, type Object3D, Quaternion } from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { type BuiltScene, buildScene, fromGltf, type Tag, tagOf } from "./build";
import type { CameraMode } from "./camera-frame";
import { CameraRig } from "./camera-rig";
import { glowIntensity, litColour, pixelGlow, shownCurrent } from "./glow";
import type { Hovered, HoverStore } from "./hover";
import type { Command, FrameMessage, Ref, SceneMessage, ScreenImage, Vec3 } from "./protocol";
import { showScreen } from "./screen";
import { holeAt, instanceAt, refOf, stripText } from "./refs";
import { applyRoom, roomTexture, StageFloor, StageLights, StageRoom } from "./stage";
import type { StageTheme } from "./stage-theme";
import type { Box } from "./wire-geometry";
import { WireMesh } from "./wire-mesh";

/** orbefab.com's brand orange. */
const HOVER = "#e85d04";

/** The render layer bloom reads. The hover outline toggles its own layer, 10, on the hovered
 * meshes, so bloom must not share it. */
const BLOOM_LAYER = 11;

/** Scratch for a turn joint's pose, so a frame allocates nothing. */
const turned = new Quaternion();

/** Each mesh the scene glows, with its glow material. */
function glowMeshes(built: BuiltScene): { mesh: Mesh; material: MeshStandardMaterial }[] {
  const materials = new Set<MeshStandardMaterial>(built.glows.map((glow) => glow.material));
  const meshes: { mesh: Mesh; material: MeshStandardMaterial }[] = [];
  built.root.traverse((object) => {
    if (!(object instanceof Mesh)) return;
    const list = Array.isArray(object.material) ? object.material : [object.material];
    const material = list.find((each) => each instanceof MeshStandardMaterial && materials.has(each));
    if (material !== undefined) meshes.push({ mesh: object, material });
  });
  return meshes;
}

/** Bloom over the meshes on BLOOM_LAYER only. A depth pass of that layer masks the frame, so a
 * pixel blooms only where the nearest surface is one of those meshes, or a clear lens over one. */
function useBloom(): SelectiveBloomEffect {
  const scene = useThree((state) => state.scene);
  const camera = useThree((state) => state.camera);
  const bloom = useMemo(() => {
    const effect = new SelectiveBloomEffect(scene, camera, {
      blendFunction: BlendFunction.ADD,
      intensity: 1.2,
      luminanceSmoothing: 0.2,
      luminanceThreshold: 1,
      mipmapBlur: true,
    });
    effect.selection.layer = BLOOM_LAYER;
    return effect;
  }, [scene, camera]);
  useEffect(() => () => bloom.dispose(), [bloom]);
  // The mask turns depth into distance with the camera's near and far planes, and it copies
  // them only when told. The near plane moves with the orbit distance, so copy it each time.
  const copied = useRef({ bloom, near: camera.near, far: camera.far });
  useFrame(() => {
    const last = copied.current;
    if (last.bloom === bloom && last.near === camera.near && last.far === camera.far) return;
    bloom.mainCamera = camera;
    copied.current = { bloom, near: camera.near, far: camera.far };
  });
  return bloom;
}

function Effects({ hover }: { hover: HoverStore }) {
  const hovered = useSyncExternalStore(hover.subscribe, hover.get);
  const bloom = useBloom();
  const target = hovered?.object;
  const selection = useMemo(() => {
    const meshes: Object3D[] = [];
    target?.traverse((object) => {
      if (object instanceof Mesh) meshes.push(object);
    });
    return meshes;
  }, [target]);
  return (
    <EffectComposer autoClear={false} multisampling={0}>
      <primitive object={bloom} />
      <Outline
        blur
        edgeStrength={6}
        hiddenEdgeColor={HOVER}
        pulseSpeed={0}
        selection={selection}
        visibleEdgeColor={HOVER}
        xRay
      />
    </EffectComposer>
  );
}

/** One box per drawn mesh, plus one per wire. A part's own box has empty corners, and those
 * would push the camera back. */
function drawnBoxes(built: BuiltScene): readonly Box[] {
  const boxes: Box[] = [];
  const box = new Box3();
  built.root.updateMatrixWorld(true);
  built.root.traverse((object) => {
    if (!(object instanceof Mesh)) return;
    object.geometry.boundingBox ?? object.geometry.computeBoundingBox();
    if (object.geometry.boundingBox === null) return;
    box.copy(object.geometry.boundingBox).applyMatrix4(object.matrixWorld);
    boxes.push({ min: [box.min.x, box.min.y, box.min.z], max: [box.max.x, box.max.y, box.max.z] });
  });
  if (boxes.length === 0) return built.boxes;
  return [...boxes, ...built.boxes.slice(built.boxes.length - built.wires.length)];
}

/** The nearest object at or above `object` whose tag passes `test`. */
function nearest(object: Object3D, test: (tag: Tag) => boolean): { object: Object3D; tag: Tag } | undefined {
  for (let at: Object3D | null = object; at !== null; at = at.parent) {
    const found = tagOf(at);
    if (found !== undefined && test(found)) return { object: at, tag: found };
  }
  return undefined;
}

/** A breadboard's hole under the pointer, as its ref and the strip it sits in. */
function holeUnder(scene: SceneMessage, ref: Ref, group: Object3D, event: ThreeEvent<PointerEvent>): Hovered | undefined {
  const path = ref.slice(1).split(".");
  const placed = instanceAt(scene, path);
  if (placed?.part.strips === undefined) return undefined;
  const local = group.worldToLocal(event.point.clone()).toArray() as Vec3;
  const hole = holeAt(placed.part, local);
  if (hole === undefined) return undefined;
  const board = refOf(path).slice(1);
  return {
    ref: refOf([...path, hole.pin]),
    why: undefined,
    error: undefined,
    strip: `strip ${stripText(hole.strip, `${board}.`)}`,
    object: group,
    x: event.nativeEvent.clientX,
    y: event.nativeEvent.clientY,
  };
}

function modelUrls(scene: SceneMessage): string[] {
  const urls = new Set<string>();
  for (const part of Object.values(scene.parts)) if (part.model !== null) urls.add(part.model);
  return [...urls];
}

/** The press a pointer holds, and how to stop listening for its end. */
interface Held {
  readonly ref: Ref;
  readonly pointerId: number;
  readonly stop: () => void;
}

const PRESS_ENDS = ["pointerup", "pointermove", "pointercancel", "lostpointercapture"] as const;

// A pointer's buttons share it, so a press ends when the primary (a mouse's left button,
// a pen's tip, a finger's contact) is up. In a chord, the primary lifting arrives as a
// pointermove, not a pointerup.
function endsPress(event: PointerEvent): boolean {
  if (event.type !== "pointerup" && event.type !== "pointermove") return true;
  return (event.buttons & 1) === 0;
}

export function SceneView({
  scene,
  frame,
  ledPeak,
  screens,
  send,
  hover,
  mode,
  onBuilt,
  colours,
  pageScroll = false,
}: {
  scene: SceneMessage;
  frame: RefObject<FrameMessage | null>;
  /** Brightest LED current since the previous drawn frame, one entry per channel. */
  ledPeak: RefObject<number[]>;
  /** Each screen's last glass, per `channels.screens`. */
  screens: RefObject<(ScreenImage | undefined)[]>;
  send: (command: Command) => void;
  hover: HoverStore;
  mode: CameraMode;
  onBuilt: (built: BuiltScene) => void;
  /** Background, floor fill and grid line, from the page theme. */
  colours: StageTheme;
  /** One finger scrolls the page. Two fingers orbit and zoom. */
  pageScroll?: boolean;
}) {
  const urls = useMemo(() => modelUrls(scene), [scene]);
  const gltfs = useLoader(GLTFLoader, urls);
  const built = useMemo(() => {
    const models = new Map<string, Group | Error>(
      urls.map((url, index) => {
        const gltf = gltfs[index];
        if (gltf === undefined) return [url, new Error(`${url}: not loaded`)];
        try {
          return [url, fromGltf(gltf, url)];
        } catch (error) {
          return [url, error instanceof Error ? error : new Error(String(error))];
        }
      })
    );
    return buildScene(scene, models);
  }, [gltfs, scene, urls]);
  useEffect(() => onBuilt(built), [built, onBuilt]);

  const gl = useThree((state) => state.gl);
  const stage = useThree((state) => state.scene);
  useLayoutEffect(() => {
    const texture = roomTexture(gl);
    const visit = (object: Object3D) => {
      if (!(object instanceof Mesh)) return;
      object.castShadow = true;
      object.receiveShadow = true;
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      for (const material of materials) {
        if (!(material instanceof MeshStandardMaterial)) continue;
        // A pin or a shell is open. The back faces cast, so the shadow keeps the part's shape.
        material.shadowSide = BackSide;
        applyRoom(material, texture);
      }
    };
    built.root.traverse(visit);
    stage.getObjectByName("stage-wires")?.traverse(visit);
  }, [built, gl, stage]);

  const glowing = useMemo(() => glowMeshes(built), [built]);
  useFrame(() => {
    const live = frame.current;
    const peaks = ledPeak.current;
    for (const glow of built.glows) {
      const { by } = glow;
      const intensity =
        by.kind === "current"
          ? glowIntensity(shownCurrent(live?.led_a[by.channel] ?? 0, peaks[by.channel] ?? 0), by.full)
          : pixelGlow(live?.pixel_rgb[by.channel] ?? [], glow.material.emissive);
      glow.material.emissiveIntensity = intensity;
      litColour(glow.base, intensity, glow.material.color);
    }
    // A glow mesh is on the bloom layer only from intensity 1 up, its full current or a
    // channel at 255, where its own luminance reaches the bloom threshold. Below that, a
    // highlight on it or on the lens over it would bloom from some angles, and the LED would
    // read as lit.
    for (const { mesh, material } of glowing) {
      if (material.emissiveIntensity >= 1) mesh.layers.enable(BLOOM_LAYER);
      else mesh.layers.disable(BLOOM_LAYER);
    }
    const count = Math.max(peaks.length, live?.led_a.length ?? 0);
    for (let channel = 0; channel < count; channel += 1) peaks[channel] = live?.led_a[channel] ?? 0;
    peaks.length = count;
    for (const screen of built.screens) {
      const image = screens.current[screen.channel];
      if (image !== undefined && image !== screen.shown) showScreen(screen, image);
    }
    for (const slide of built.slides) {
      slide.node.position.copy(slide.rest);
      if (live?.switches[slide.channel] === 1) slide.node.position.add(slide.delta);
    }
    for (const turn of built.turns) {
      const value = turn.horn ? (live?.horn_deg?.[turn.channel] ?? turn.value) : (live?.params?.[turn.channel] ?? turn.value);
      turned.setFromAxisAngle(turn.axis, turn.angle(value));
      turn.node.quaternion.copy(turned).multiply(turn.rest);
    }
  });

  const canvas = useThree((state) => state.gl.domElement);
  const held = useRef<Held | null>(null);
  const release = useCallback(() => {
    const pressed = held.current;
    if (pressed === null) return;
    held.current = null;
    pressed.stop();
    send({ cmd: "release", ref: pressed.ref });
  }, [send]);
  useEffect(() => {
    window.addEventListener("blur", release);
    return () => {
      window.removeEventListener("blur", release);
      release();
    };
  }, [release]);
  // A new scene follows an `open`, which restarts the session, so a press held across it
  // is dropped without a release.
  useEffect(
    () => () => {
      held.current?.stop();
      held.current = null;
    },
    [scene]
  );

  // React Three Fiber never calls an object's onPointerCancel or onLostPointerCapture, so
  // the press listens for its own pointer's end on the canvas.
  const press = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    if (event.button !== 0) return;
    const instance = nearest(event.object, (tag) => tag.instance !== undefined);
    if (instance?.tag.instance?.pressable !== true || held.current !== null) return;
    const { ref } = instance.tag;
    const { pointerId } = event;
    const end = (native: PointerEvent) => {
      if (native.pointerId === held.current?.pointerId && endsPress(native)) release();
    };
    for (const kind of PRESS_ENDS) canvas.addEventListener(kind, end);
    held.current = {
      ref,
      pointerId,
      stop: () => {
        for (const kind of PRESS_ENDS) canvas.removeEventListener(kind, end);
      },
    };
    (event.target as Element).setPointerCapture(pointerId);
    send({ cmd: "press", ref });
  };
  const move = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    const found = nearest(event.object, () => true);
    if (found === undefined) {
      hover.set(null);
      return;
    }
    const at = { object: found.object, x: event.nativeEvent.clientX, y: event.nativeEvent.clientY };
    const hole = found.tag.instance === undefined ? undefined : holeUnder(scene, found.tag.ref, found.object, event);
    hover.set(hole ?? { ref: found.tag.ref, why: found.tag.why, error: found.tag.error, ...at });
  };

  const frameBoxes = useMemo(() => drawnBoxes(built), [built]);
  return (
    <>
      <StageRoom />
      <StageLights background={colours.background} boxes={built.boxes} />
      <CameraRig boxes={frameBoxes} mode={mode} pageScroll={pageScroll} />
      <primitive
        object={built.root}
        onPointerDown={press}
        onPointerMove={move}
        onPointerOut={() => hover.set(null)}
      />
      <group name="stage-wires">
        {built.wires.map((wire, index) => (
          <WireMesh key={index} wire={wire} />
        ))}
      </group>
      <StageFloor boxes={built.boxes} colours={colours} />
      <Effects hover={hover} />
    </>
  );
}
