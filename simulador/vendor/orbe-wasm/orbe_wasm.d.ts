/* tslint:disable */
/* eslint-disable */

/**
 * The files of one Block, gathered before it opens.
 */
export class Block {
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Adds one file: `parts/<id>/<path>` is a file of the catalog part `id`, and any other path
     * is the Block's own, from its folder, such as `scene.jsonc` or `build/button.ino.hex`.
     */
    add(path: string, bytes: Uint8Array): void;
    constructor();
}

/**
 * A Block's live session, and the messages it has for its viewer.
 */
export class Session {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Runs one command as a viewer sends it, such as `{"id": 1, "cmd": "press", "ref":
     * "@btn1"}`. Its `reply`, and the frames for what changed, wait in `messages`. Serial text
     * longer than one frame is several frames.
     */
    command(text: string): void;
    /**
     * The JSON text of each message since the last call, in order.
     */
    messages(): string[];
    /**
     * Opens the Block's `scene.jsonc` as `orbe open` does in its folder, in a session named
     * `name`. Its `scene` message and first `frame` wait in `messages`. Throws an `Error` whose
     * message is the refusal as `orbe open` prints it.
     */
    static open(name: string, block: Block): Session;
    /**
     * Whether `play` runs, so the Worker keeps ticking.
     */
    playing(): boolean;
    /**
     * One `play` tick, `wall_ms` milliseconds of wall time after the last: the session advances
     * by that much, up to one tick, and the tick's frames wait in `messages`. Serial text longer
     * than one frame is several frames. A paused session does not move.
     */
    tick(wall_ms: number): void;
}

/**
 * The JSON text of the `scene` message of the catalog part `id` drawn on its own, with no
 * session. `parts` holds the files of the part and of every part it is built from, each at
 * `parts/<id>/<path>`. It takes the `Block`, which is freed. Throws an `Error` that lists the
 * findings when the part is missing or does not parse.
 */
export function partScene(id: string, parts: Block): string;

/**
 * The JSON text of each part the Block's `scene.jsonc` places, in the file's order. A number
 * is its amount in the param's SI unit. A file is the path as written, and the file need not
 * be there. It takes the `Block`, which is freed. Throws an `Error` that lists the findings
 * as `orbe check` prints them.
 */
export function sceneParts(block: Block): string;

/**
 * The wall time between two `play` ticks, in milliseconds.
 */
export function tickMs(): number;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly __wbg_block_free: (a: number, b: number) => void;
    readonly __wbg_session_free: (a: number, b: number) => void;
    readonly block_add: (a: number, b: number, c: number, d: number, e: number) => void;
    readonly block_new: () => number;
    readonly partScene: (a: number, b: number, c: number, d: number) => void;
    readonly sceneParts: (a: number, b: number) => void;
    readonly session_command: (a: number, b: number, c: number) => void;
    readonly session_messages: (a: number, b: number) => void;
    readonly session_open: (a: number, b: number, c: number, d: number) => void;
    readonly session_playing: (a: number) => number;
    readonly session_tick: (a: number, b: number) => void;
    readonly tickMs: () => number;
    readonly __wbindgen_export: (a: number, b: number) => number;
    readonly __wbindgen_export2: (a: number, b: number, c: number, d: number) => number;
    readonly __wbindgen_add_to_stack_pointer: (a: number) => number;
    readonly __wbindgen_export3: (a: number, b: number, c: number) => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
