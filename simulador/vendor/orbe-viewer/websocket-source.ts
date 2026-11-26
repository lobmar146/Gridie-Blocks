import { channelSource, receive } from "./channel-source";
import type { SessionSource } from "./session";

/** The address of the session's WebSocket for the page `orbe show` served, from the token in
 * its fragment, `#t=<token>`. `null` when the page has no token. */
export function sessionUrl(location: {
  readonly host: string;
  readonly protocol: string;
  readonly hash: string;
}): string | null {
  const token = new URLSearchParams(location.hash.slice(1)).get("t");
  if (token === null || token === "") return null;
  const scheme = location.protocol === "https:" ? "wss:" : "ws:";
  return `${scheme}//${location.host}/session?t=${encodeURIComponent(token)}`;
}

/** A live session, over the WebSocket `orbe show` serves. Commands sent before the socket opens
 * wait for it. Once the session closes or the socket drops, every listener gets a `closed`
 * message, and commands reject. */
export function websocketSource(open: () => WebSocket): SessionSource {
  return channelSource((inbox) => {
    const socket = open();
    const queued: string[] = [];
    socket.onopen = () => {
      for (const text of queued) socket.send(text);
      queued.length = 0;
    };
    socket.onmessage = (event) => {
      if (typeof event.data === "string") receive(inbox, event.data, "the session");
    };
    socket.onclose = () => inbox.drop("the connection to the session dropped");
    return {
      send(text) {
        if (socket.readyState === WebSocket.OPEN) socket.send(text);
        else queued.push(text);
      },
      close: () => socket.close(),
    };
  });
}
