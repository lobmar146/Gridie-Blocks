import type { Command, Reply, ReplyError, ToViewer } from "./protocol";

/** Where the viewer's messages come from and its commands go: a WebSocket to the session
 * process, or orbe-wasm's Worker. */
export interface SessionSource {
  /** Calls `listener` with every message from now on, and returns the unsubscribe. A source
   * sends the current scene, then the latest frame, to each new listener. That frame carries
   * the serial text already delivered, bounded to 4096 bytes. */
  subscribe(listener: (message: ToViewer) => void): () => void;
  /** Rejects when the command never reached the session. */
  send(command: Command): Promise<Reply>;
  /** Frees what the source holds, such as its Worker and object URLs or its socket. Listeners
   * get nothing more, and commands reject. A page calls it when it shows another session or
   * unmounts. */
  close(): void;
}

/** The reply's error as the CLI prints it, such as `error[ended]: …` with its hint below. */
export function errorText(error: ReplyError): string {
  const head = `error[${error.code}]: ${error.message}`;
  return error.hint === "" ? head : `${head}\n  hint: ${error.hint}`;
}

/** The command as the CLI writes it, such as `press @btn1`. */
export function commandLine(command: Command): string {
  switch (command.cmd) {
    case "press":
    case "release":
      return `${command.cmd} ${command.ref}`;
    case "play":
    case "pause":
      return command.cmd;
    case "set":
      return `set ${"ref" in command ? command.ref : command.quantity} ${command.value}`;
  }
}
