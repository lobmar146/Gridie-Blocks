// The studio stage: a room light, a key light with a shadow map, and a floor grid that fades
// into the page colour so the floor has no edge.

import { useThree } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import {
  Color,
  type DirectionalLight,
  PCFShadowMap,
  MeshStandardMaterial,
  PMREMGenerator,
  ShaderMaterial,
  type Texture,
  type WebGLRenderer,
} from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { union } from "./camera-frame";
import type { StageTheme } from "./stage-theme";
import type { Box } from "./wire-geometry";

const MAT_CELL_MM = 10;
const KEY_LIGHT = 1.9;
// The approved studio lite strengths. Metal is 0.42 and plastic is 0.18. A highlight can pass
// luminance 1 from some angles. Bloom does not use that: it reads only the LED glow meshes.
const METAL_ROOM = 0.42;
const PLASTIC_ROOM = 0.18;
// The opaque grid sits 0.5 mm under the lowest mesh. A shadow plane 0.01 mm above that grid
// z-fights, and a large board's shadow breaks into stripes. This clearance stays under the parts.
const SHADOW_CLEAR_MM = 0.3;

/** True when `background` is a dark colour. Three stores the hex in linear space. */
function isDark(background: string): boolean {
  const color = new Color(background);
  return 0.2126 * color.r + 0.7152 * color.g + 0.0722 * color.b < 0.18;
}

const rooms = new WeakMap<WebGLRenderer, Texture>();

/** The room image, made once per renderer. */
export function roomTexture(gl: WebGLRenderer): Texture {
  let texture = rooms.get(gl);
  if (texture === undefined) {
    const pmrem = new PMREMGenerator(gl);
    const room = new RoomEnvironment();
    texture = pmrem.fromScene(room, 0.04).texture;
    room.dispose();
    pmrem.dispose();
    rooms.set(gl, texture);
  }
  return texture;
}

/** Each finish carries the room map itself. Three uses `scene.environmentIntensity` while
 * `envMap` is null, so a plastic and a metal would otherwise share one strength. Metalness
 * is the GLB's. */
export function applyRoom(material: MeshStandardMaterial, texture: Texture): void {
  material.envMap = texture;
  material.envMapIntensity = material.metalness >= 0.5 ? METAL_ROOM : PLASTIC_ROOM;
  material.needsUpdate = true;
}

/** The room image lights every standard material. A finish's metal and roughness come from the GLB. */
export function StageRoom() {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  useLayoutEffect(() => {
    const previous = scene.environment;
    const intensity = scene.environmentIntensity;
    scene.environment = roomTexture(gl);
    // A material that never got its own map takes the plastic share.
    scene.environmentIntensity = PLASTIC_ROOM;
    return () => {
      scene.environment = previous;
      scene.environmentIntensity = intensity;
    };
  }, [gl, scene]);
  return null;
}

function ShadowMap() {
  const gl = useThree((state) => state.gl);
  useLayoutEffect(() => {
    gl.shadowMap.enabled = true;
    gl.shadowMap.type = PCFShadowMap;
    gl.shadowMap.needsUpdate = true;
    return () => {
      gl.shadowMap.enabled = false;
    };
  }, [gl]);
  return null;
}

/** A key light whose shadow covers the whole scene. */
function ShadowKey({ boxes }: { boxes: readonly Box[] }) {
  const light = useRef<DirectionalLight>(null);
  const box = useMemo(() => union(boxes), [boxes]);
  useLayoutEffect(() => {
    const lamp = light.current;
    if (lamp === null) return;
    const centre: [number, number, number] = [
      (box.min[0] + box.max[0]) / 2,
      box.min[1],
      (box.min[2] + box.max[2]) / 2,
    ];
    const reach = Math.max(box.max[0] - box.min[0], box.max[2] - box.min[2], 60) * 0.75;
    const direction = [-0.64, 1, 0.08] as const;
    const length = Math.hypot(direction[0], direction[1], direction[2]);
    const distance = reach * 3;
    lamp.position.set(
      centre[0] + (direction[0] / length) * distance,
      centre[1] + (direction[1] / length) * distance,
      centre[2] + (direction[2] / length) * distance,
    );
    lamp.target.position.set(centre[0], centre[1], centre[2]);
    lamp.target.updateMatrixWorld();
    const camera = lamp.shadow.camera;
    camera.left = -reach;
    camera.right = reach;
    camera.top = reach;
    camera.bottom = -reach;
    camera.near = distance * 0.2;
    camera.far = distance * 2;
    camera.updateProjectionMatrix();
    lamp.shadow.mapSize.set(2048, 2048);
    lamp.shadow.radius = 4;
    lamp.shadow.bias = -0.0004;
    lamp.shadow.normalBias = 0.02;
    lamp.shadow.needsUpdate = true;
  }, [box]);
  return <directionalLight castShadow intensity={KEY_LIGHT} ref={light} />;
}

/** Hemisphere fill, a shadow-mapped key from the front left, and a softer fill from the other side. */
export function StageLights({ boxes, background }: { boxes: readonly Box[]; background: string }) {
  const dark = isDark(background);
  return (
    <>
      <ShadowMap />
      <hemisphereLight args={["#f2f5fa", dark ? "#1c1d20" : "#9a9ca3", 0.55]} />
      <ShadowKey boxes={boxes} />
      <directionalLight intensity={0.55} position={[70, 50, -10]} />
    </>
  );
}

const GRID_VERTEX = `
  varying vec3 vWorld;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }`;

// An unlit floor with an anti-aliased grid in world mm. It fades into the background, so it has no
// edge, and it never moirés at a grazing angle as a repeated texture does.
const GRID_FRAGMENT = `
  uniform vec3 fill;
  uniform vec3 line;
  uniform vec3 major;
  uniform vec3 background;
  uniform vec2 centre;
  uniform vec2 radius;
  uniform float cell;
  varying vec3 vWorld;
  float gridLine(vec2 p, float width) {
    vec2 g = abs(fract(p - 0.5) - 0.5) / (fwidth(p) * width);
    return 1.0 - min(min(g.x, g.y), 1.0);
  }
  void main() {
    vec2 p = vWorld.xz / cell;
    float minor = gridLine(p, 1.0);
    float big = gridLine(p / 5.0, 1.4);
    vec3 colour = mix(fill, line, minor);
    colour = mix(colour, major, big);
    float d = length((vWorld.xz - centre) / radius);
    colour = mix(colour, background, smoothstep(0.45, 1.0, d));
    gl_FragColor = vec4(colour, 1.0);
    #include <colorspace_fragment>
  }`;

const MAJOR_LIGHT = new Color("#000000");
const MAJOR_DARK = new Color("#ffffff");

/** The fading floor grid, and the plane that receives the shadow map. */
export function StageFloor({ boxes, colours }: { boxes: readonly Box[]; colours: StageTheme }) {
  const box = useMemo(() => union(boxes), [boxes]);
  const spanX = box.max[0] - box.min[0];
  const spanZ = box.max[2] - box.min[2];
  const radiusX = Math.max(140, spanX * 1.6);
  const radiusZ = Math.max(110, spanZ * 1.6);
  const centreX = (box.min[0] + box.max[0]) / 2;
  const centreZ = (box.min[2] + box.max[2]) / 2;
  const material = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: {
          fill: { value: new Color() },
          line: { value: new Color() },
          major: { value: new Color() },
          background: { value: new Color() },
          centre: { value: [0, 0] },
          radius: { value: [1, 1] },
          cell: { value: MAT_CELL_MM },
        },
        vertexShader: GRID_VERTEX,
        fragmentShader: GRID_FRAGMENT,
      }),
    [],
  );
  useEffect(() => () => material.dispose(), [material]);
  useLayoutEffect(() => {
    const fill = material.uniforms.fill?.value as Color;
    const line = material.uniforms.line?.value as Color;
    const major = material.uniforms.major?.value as Color;
    const background = material.uniforms.background?.value as Color;
    fill.set(colours.mat);
    line.set(colours.line);
    major.set(colours.line).lerp(isDark(colours.background) ? MAJOR_DARK : MAJOR_LIGHT, 0.025);
    background.set(colours.background);
    const centre = material.uniforms.centre?.value as [number, number];
    const radius = material.uniforms.radius?.value as [number, number];
    centre[0] = centreX;
    centre[1] = centreZ;
    radius[0] = radiusX;
    radius[1] = radiusZ;
  }, [centreX, centreZ, colours.background, colours.line, colours.mat, material, radiusX, radiusZ]);
  const y = box.min[1] - 0.5;
  const shadow = isDark(colours.background) ? 0.55 : 0.28;
  return (
    <>
      <mesh material={material} name="stage-mat" position={[centreX, y, centreZ]} renderOrder={-20} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[radiusX * 2.2, radiusZ * 2.2]} />
      </mesh>
      <mesh position={[centreX, y + SHADOW_CLEAR_MM, centreZ]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[radiusX * 2.2, radiusZ * 2.2]} />
        <shadowMaterial depthWrite={false} opacity={shadow} transparent />
      </mesh>
    </>
  );
}
