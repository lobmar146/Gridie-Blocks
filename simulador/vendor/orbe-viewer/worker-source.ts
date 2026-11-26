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

/** A Block's live session, in a Worker running orbe-wasm's `worker.js`. `load` gives the Block's
 * files, and commands sent before they reach the Worker wait for them. The Worker has no server,
 * so each part model the scene names, a path in the Block's files such as
 * `/parts/led-5mm/led-5mm.glb`, is served from those files as an object URL. A Block that does
 * not load or open, a Worker that fails, or a message that is not a JSON message ends the session
 * with why, and frees it as `close` does. `close` terminates the Worker and revokes the object
 * URLs, and a message the Worker sent before it ended is dropped unread. */
export function workerSource(open: () => Worker, load: () => Promise<BlockFiles>): SessionSource {
  return channelSource((inbox) => {
    const worker = open();
    const queued: string[] = [];
    let files: BlockFiles | null = null;
    let closed = false;
    const models = new Map<string, string>();
    const served = (scene: SceneMessage): SceneMessage => {
      const parts = Object.fromEntries(
        Object.entries(scene.parts).map(([id, part]) => {
          const bytes = part.model === null ? undefined : files?.files.get(part.model.replace(/^\//, ""));
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
    load().then(
      (block) => {
        if (closed) return;
        files = block;
        const opening: OpenMessage = { type: "open", name: block.name, files: [...block.files] };
        worker.postMessage(opening);
        for (const text of queued) worker.postMessage(text);
        queued.length = 0;
      },
      (error: unknown) => inbox.drop(`the Block did not load: ${error instanceof Error ? error.message : String(error)}`)
    );
    return {
      send(text) {
        if (files === null) queued.push(text);
        else worker.postMessage(text);
      },
      close() {
        closed = true;
        worker.terminate();
        for (const url of models.values()) URL.revokeObjectURL(url);
        models.clear();
      },
    };
  });
}
