// A screen part's glass on its model: the node `view.screen` names shows the image each frame
// carries for it on `channels.screens`.

import { Box3, BufferAttribute, DataTexture, Mesh, type MeshStandardMaterial, type Object3D, RGBAFormat, SRGBColorSpace } from "three";
import type { ScreenImage } from "./protocol";

/** A screen node's materials and the image they show. */
export interface ScreenBinding {
  readonly materials: readonly MeshStandardMaterial[];
  /** The screen's index on `channels.screens`. */
  readonly channel: number;
  /** The image the materials show, or undefined before the first. */
  shown: ScreenImage | undefined;
  texture: DataTexture | undefined;
}

/** Maps each mesh under `node` flat onto its top face: u runs with +x and v down from +y, both
 * across the mesh's bounds, so the first image row lands at the edge farthest along +y. A side
 * face takes the colour of an edge row. */
export function planarUv(node: Object3D): void {
  node.traverse((object) => {
    if (!(object instanceof Mesh)) return;
    const geometry = object.geometry;
    const position = geometry.getAttribute("position");
    if (position === undefined) return;
    const box = new Box3().setFromBufferAttribute(position as BufferAttribute);
    const width = Math.max(box.max.x - box.min.x, Number.EPSILON);
    const depth = Math.max(box.max.y - box.min.y, Number.EPSILON);
    const uv = new Float32Array(position.count * 2);
    for (let k = 0; k < position.count; k += 1) {
      uv[2 * k] = (position.getX(k) - box.min.x) / width;
      uv[2 * k + 1] = (box.max.y - position.getY(k)) / depth;
    }
    geometry.setAttribute("uv", new BufferAttribute(uv, 2));
  });
}

/** Readies `materials` to show a screen: dark until its first image, which then lights them. */
export function darkGlass(materials: readonly MeshStandardMaterial[]): void {
  for (const material of materials) {
    material.color.setRGB(0, 0, 0);
    material.emissive.setRGB(0, 0, 0);
    material.emissiveIntensity = 1;
    material.toneMapped = false;
  }
}

/** The bytes of base64 `text`. */
export function decodeBase64(text: string): Uint8Array {
  const binary = atob(text);
  const bytes = new Uint8Array(binary.length);
  for (let k = 0; k < binary.length; k += 1) bytes[k] = binary.charCodeAt(k);
  return bytes;
}

/** Shows `image` on the binding's materials. A lit pixel glows its own colour and a dark one
 * stays black. */
export function showScreen(binding: ScreenBinding, image: ScreenImage): void {
  const rgba = decodeBase64(image.rgba);
  if (rgba.length !== image.width * image.height * 4) {
    console.warn(`a screen image of ${rgba.length} bytes is not ${image.width} by ${image.height} pixels`);
    binding.shown = image;
    return;
  }
  let texture = binding.texture;
  if (texture === undefined || texture.image.width !== image.width || texture.image.height !== image.height) {
    texture?.dispose();
    texture = new DataTexture(rgba, image.width, image.height, RGBAFormat);
    texture.colorSpace = SRGBColorSpace;
    binding.texture = texture;
    for (const material of binding.materials) {
      material.emissive.setRGB(1, 1, 1);
      material.emissiveMap = texture;
      material.needsUpdate = true;
    }
  } else {
    (texture.image.data as Uint8Array).set(rgba);
  }
  texture.needsUpdate = true;
  binding.shown = image;
}
