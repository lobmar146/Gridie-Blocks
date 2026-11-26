// The Worker that runs one Block for a viewer, in a browser as a module Worker and in node as a
// `worker_threads` Worker. The page first posts `{ type: "open", name, files }`, where `files` is
// an array of `[path, Uint8Array]` in the layout `Block.add` reads, then each command as the JSON
// text a viewer sends on `orbe show`'s WebSocket. The Worker posts back the JSON text of each
// message that WebSocket sends: `scene`, `frame` and `reply`, and `closed` when the Block does not
// open. While `play` runs it ticks every `tickMs()` of wall time, and it is the only clock.
import init, { Block, Session, tickMs } from "./orbe_wasm.js";

const pending = [];
let receive = (data) => pending.push(data);
let post;
if (typeof self === "undefined") {
  const { parentPort } = await import("node:worker_threads");
  const { readFile } = await import("node:fs/promises");
  parentPort.on("message", (data) => receive(data));
  post = (text) => parentPort.postMessage(text);
  await init({ module_or_path: await readFile(new URL("./orbe_wasm_bg.wasm", import.meta.url)) });
} else {
  self.onmessage = (event) => receive(event.data);
  post = (text) => self.postMessage(text);
  await init();
}

const tick = tickMs();
let session = null;
let timer = null;
let last = 0;
const cachedParts = new Map();

const flush = () => {
  for (const text of session.messages()) post(text);
};

function play() {
  const now = performance.now();
  session.tick(now - last);
  last = now;
  flush();
  timer = session.playing() ? setTimeout(play, Math.max(0, last + tick - performance.now())) : null;
}

function open({ name, files }) {
  if (timer !== null) {
    clearTimeout(timer);
    timer = null;
  }
  if (session !== null) {
    session.free();
    session = null;
  }
  const block = new Block();
  for (const [path, bytes] of files) {
    if (path.startsWith("parts/")) cachedParts.set(path, bytes);
    else block.add(path, bytes);
  }
  for (const [path, bytes] of cachedParts) block.add(path, bytes);
  try {
    session = Session.open(name, block);
  } catch (error) {
    post(JSON.stringify({ type: "closed", reason: error.message }));
    return;
  }
  flush();
}

receive = (data) => {
  if (data?.type === "open") {
    open(data);
    return;
  }
  if (session === null) return;
  session.command(data);
  flush();
  if (session.playing() && timer === null) {
    last = performance.now();
    timer = setTimeout(play, tick);
  } else if (!session.playing() && timer !== null) {
    clearTimeout(timer);
    timer = null;
  }
};
for (const data of pending.splice(0)) receive(data);
