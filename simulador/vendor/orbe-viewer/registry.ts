// Loads a Block from a registry `orbe registry build` wrote, as docs/registry.md's client does:
// the index, the Block's record, the record of each part it runs, and every file by its hash,
// each checked before it is used. Nothing here is written anywhere, so step 8 is the caller's.

/** A Block's files as the Worker opens them: its own at their paths in its folder, and each file
 * of a part it runs at `parts/<id>/<path>`. */
export interface BlockFiles {
  readonly name: string;
  readonly files: ReadonlyMap<string, Uint8Array>;
}

/** Fetches the bytes at a URL, or rejects. */
export type Get = (url: URL) => Promise<Uint8Array>;

export const fetchBytes: Get = async (url) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url.href} answered ${response.status}`);
  return new Uint8Array(await response.arrayBuffer());
};

const FORMAT = 1;
const RESERVED = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])$/;
// The id and version grammar of docs/registry.md, so a row cannot name a URL outside the index.
const ID = /^(?!(index|con|prn|aux|nul|com[0-9]|lpt[0-9])$)[a-z][a-z0-9-]{0,63}$/;
const VERSION = /^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$/;

interface Row {
  readonly name: string;
  readonly type: string;
  readonly version: string;
  readonly url: string;
  readonly sha256: string;
  readonly bytes: number;
}

interface FileEntry {
  readonly path: string;
  readonly url: string;
  readonly sha256: string;
  readonly bytes: number;
}

interface ItemRecord {
  readonly format: number;
  readonly type: string;
  readonly name: string;
  readonly version: string;
  readonly registryDependencies: readonly string[];
  readonly files: readonly FileEntry[];
  readonly hash: string;
}

/** Loads the newest version of the Block `id` from the registry whose index is at `index`. It
 * rejects with an Error that names the first check that failed. */
export async function loadBlock(index: URL, id: string, get: Get = fetchBytes): Promise<BlockFiles> {
  const doc = parse(await get(index), `the index at ${index.href}`) as { format: number; items: readonly Row[] };
  if (doc.format !== FORMAT) throw new Error(`the index is format ${doc.format}, and this client reads ${FORMAT}`);
  const seen = new Set<string>();
  for (const row of doc.items) {
    if (!ID.test(row.name) || !VERSION.test(row.version)) {
      throw new Error(`the index lists ${JSON.stringify(row.name)}@${JSON.stringify(row.version)}, which is not an id and a version`);
    }
    const key = `${row.name}@${row.version}`;
    if (seen.has(key)) throw new Error(`the index lists ${key} twice`);
    seen.add(key);
  }
  const files = new Map<string, Uint8Array>();
  const block = await load(get, index, doc.items, id, undefined, "block");
  for (const [path, bytes] of block.files) files.set(path, bytes);
  const parts = await Promise.all(
    block.record.registryDependencies.map((dependency) => {
      if (dependency.startsWith("@")) throw new Error(`${id} runs ${dependency}, from another registry`);
      const [name, version] = dependency.split("@");
      return load(get, index, doc.items, name ?? "", version, "part");
    })
  );
  for (const part of parts) {
    for (const [path, bytes] of part.files) files.set(`parts/${part.record.name}/${path}`, bytes);
  }
  return { name: id, files };
}

/** The record of `name`, at `version` or else its newest, and its files by path. */
async function load(
  get: Get,
  index: URL,
  rows: readonly Row[],
  name: string,
  version: string | undefined,
  type: string
): Promise<{ record: ItemRecord; files: Map<string, Uint8Array> }> {
  const row = rows
    .filter((row) => row.name === name && (version === undefined || row.version === version))
    .sort((a, b) => compareVersions(b.version, a.version))[0];
  const wanted = version === undefined ? name : `${name}@${version}`;
  if (row === undefined) throw new Error(`the registry has no ${wanted}`);
  if (row.type !== type) throw new Error(`${wanted} is a ${row.type}, not a ${type}`);
  if (row.url !== `${row.name}@${row.version}.json`) throw new Error(`${wanted}'s record is at ${row.url}`);
  const at = new URL(row.url, index);
  const record = parse(await checked(await get(at), at, row, `${wanted}'s record`), `${wanted}'s record`) as ItemRecord;
  if (record.name !== row.name || record.type !== row.type || record.version !== row.version) {
    throw new Error(`${row.url} holds ${record.type} ${record.name}@${record.version}`);
  }
  if (record.format !== FORMAT) throw new Error(`${row.url} is format ${record.format}, and this client reads ${FORMAT}`);
  checkPaths(record.files.map((file) => file.path), row.url);
  const files = new Map<string, Uint8Array>();
  await Promise.all(
    record.files.map(async (file) => {
      if (file.url !== `files/${file.sha256}`) throw new Error(`${row.url} puts ${file.path} at ${file.url}`);
      const url = new URL(file.url, at);
      files.set(file.path, await checked(await get(url), url, file, `${row.url}'s ${file.path}`));
    })
  );
  const lines = [...record.files]
    .sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0))
    .map((file) => `${file.sha256}  ${file.path}\n`)
    .join("");
  const hash = `sha256:${await sha256(new TextEncoder().encode(lines))}`;
  if (hash !== record.hash) throw new Error(`${row.url}'s files hash to ${hash}, not ${record.hash}`);
  return { record, files };
}

/** `body`, once its size and SHA-256 are the ones `want` lists. */
async function checked(
  body: Uint8Array,
  url: URL,
  want: { readonly sha256: string; readonly bytes: number },
  what: string
): Promise<Uint8Array> {
  if (body.byteLength !== want.bytes) throw new Error(`${what} at ${url.href} is ${body.byteLength} bytes, not ${want.bytes}`);
  const hex = await sha256(body);
  if (hex !== want.sha256) throw new Error(`${what} at ${url.href} has SHA-256 ${hex}, not ${want.sha256}`);
  return body;
}

/** Step 5 of the contract: paths every platform can hold, each once, case aside. */
function checkPaths(paths: readonly string[], record: string): void {
  const folded = new Set<string>();
  for (const path of paths) {
    const bad =
      path === "" ||
      path.startsWith("/") ||
      /[\\:*?"<>|\u0000-\u001f\u007f]/.test(path) ||
      path.split("/").some((segment) => {
        const stem = segment.split(".")[0]?.toLowerCase() ?? "";
        return segment === "" || segment === "." || segment === ".." || /[. ]$/.test(segment) || RESERVED.test(stem);
      });
    if (bad) throw new Error(`${record} lists a file at ${JSON.stringify(path)}, which some platform cannot hold`);
    const key = path.toLowerCase();
    if (folded.has(key)) throw new Error(`${record} lists ${JSON.stringify(path)} twice, case aside`);
    folded.add(key);
  }
}

export function compareVersions(a: string, b: string): number {
  const x = a.split(".").map(Number);
  const y = b.split(".").map(Number);
  for (let i = 0; i < 3; i += 1) {
    const d = (x[i] ?? 0) - (y[i] ?? 0);
    if (d !== 0) return d;
  }
  return 0;
}

function parse(bytes: Uint8Array, what: string): unknown {
  try {
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch (error) {
    throw new Error(`${what} is not JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function sha256(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", bytes as Uint8Array<ArrayBuffer>);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
