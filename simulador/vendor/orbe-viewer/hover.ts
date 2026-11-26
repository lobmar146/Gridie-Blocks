import type { Object3D } from "three";
import type { Ref } from "./protocol";

export interface Hovered {
  readonly ref: Ref;
  /** Why the ref is not simulated. */
  readonly why: string | undefined;
  /** Why the instance is not drawn as its part data says. */
  readonly error: string | undefined;
  /** A breadboard hole's strip, such as `strip bb.a20 to bb.e20`. */
  readonly strip?: string;
  readonly object: Object3D;
  /** The pointer, in client pixels. */
  readonly x: number;
  readonly y: number;
}

/** What the pointer is over, kept out of React state so a pointer move renders only the
 * label and the outline. */
export interface HoverStore {
  get(): Hovered | null;
  set(next: Hovered | null): void;
  subscribe(listener: () => void): () => void;
}

export function createHoverStore(): HoverStore {
  let current: Hovered | null = null;
  const listeners = new Set<() => void>();
  return {
    get: () => current,
    set(next) {
      if (next === current) return;
      current = next;
      for (const listener of listeners) listener();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
