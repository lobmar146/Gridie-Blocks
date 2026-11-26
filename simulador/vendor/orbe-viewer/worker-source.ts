import { channelSource, receive } from "./channel-source";
import type { SceneMessage } from "./protocol";
import type { BlockFiles } from "./registry";
import type { SessionSource } from "./session";

/** What the source posts a Worker running orbe-wasm's `worker.js` first, before any command. */
export interface OpenMessage {
  readonly type: "open";
  readonly name: string;
  /** Each file as `[path, bytes]`, the Block's own and `parts/<id>/<path>` for its parts. */
  readonly files: readonly (readonly [string, Uint8Array])[];
}

export interface ReusableSessionSource extends SessionSource {
  reload(load: () => Promise<BlockFiles>): void;
}

/** A Block's live session, in a Worker running orbe-wasm's `worker.js`. `load` gives the Block's
 * files, and commands sent before they reach the Worker wait for them. The Worker has no server,
 * so each part model the scene names, a path in the Block's files such as
 * `/parts/led-5mm/led-5mm.glb`, is served from those files as an object URL. `reload` reopens
 * a new scene in the same Worker and viewer without re-instantiating WASM or WebGL. */
export function workerSource(open: () => Worker, load: () => Promise<BlockFiles>): ReusableSessionSource {
  return channelSource((inbox) => {
    const worker = open();
    const queued: string[] = [];
    const allFiles = new Map<string, Uint8Array>();
    const sentParts = new Set<string>();
    let ready = false;
    let loadEpoch = 0;
    let closed = false;
    const models = new Map<string, string>();
    const served = (scene: SceneMessage): SceneMessage => {
      const parts = Object.fromEntries(
        Object.entries(scene.parts).map(([id, part]) => {
          const bytes = part.model === null ? undefined : allFiles.get(part.model.replace(/^\//, ""));
          if (part.model === null || bytes === undefined) return [id, part];
          let url = models.get(part.model);
          if (url === undefined) {
            url = URL.createObjectURL(new Blob([bytes as Uint8Array<ArrayBuffer>], { type: "model/gltf-binary" }));
            models.set(part.model, url);
          }
          return [id, { ...part, model: url }];
        })
      );
      return { ...scene, parts };
    };

    const runLoad = (loader: () => Promise<BlockFiles>) => {
      const epoch = ++loadEpoch;
      loader().then(
        (block) => {
          if (closed || epoch !== loadEpoch) return;
          const delta: [string, Uint8Array][] = [];
          for (const [path, bytes] of block.files) {
            allFiles.set(path, bytes);
            if (path.startsWith("parts/")) {
              if (!sentParts.has(path)) {
                sentParts.add(path);
                delta.push([path, bytes]);
              }
            } else {
              delta.push([path, bytes]);
            }
          }
          ready = true;
          const opening: OpenMessage = { type: "open", name: block.name, files: delta };
          worker.postMessage(opening);
          for (const text of queued) worker.postMessage(text);
          queued.length = 0;
        },
        (error: unknown) => {
          if (closed || epoch !== loadEpoch) return;
          inbox.drop(`the Block did not load: ${error instanceof Error ? error.message : String(error)}`);
        }
      );
    };

    worker.onmessage = (event: MessageEvent<string>) => {
      if (closed) return;
      receive(
        { message: (message) => inbox.message(message.type === "scene" ? served(message) : message), drop: inbox.drop },
        event.data,
        "the session's Worker"
      );
    };
    worker.onerror = (event) => {
      event.preventDefault();
      inbox.drop(`the session's Worker failed: ${event.message}`);
    };
    runLoad(load);
    return {
      send(text) {
        if (!ready) queued.push(text);
        else worker.postMessage(text);
      },
      reload(nextLoad: () => Promise<BlockFiles>) {
        if (closed) return;
        ready = false;
        queued.length = 0;
        runLoad(nextLoad);
      },
      close() {
        closed = true;
        worker.terminate();
        for (const url of models.values()) URL.revokeObjectURL(url);
        models.clear();
      },
    };
  }) as ReusableSessionSource;
}
