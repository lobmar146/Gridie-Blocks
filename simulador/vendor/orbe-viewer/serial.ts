/** The most UTF-8 bytes of serial text a page holds. A frame sends at most this many. */
export const SERIAL_HOLD = 4096;

/** Shown above the kept bytes when earlier output was dropped. */
export const SERIAL_TRIMMED = "earlier output trimmed";

/** The serial text a page shows, and how far it has read. */
export interface SerialView {
  readonly text: string;
  /** UTF-8 bytes of the session's serial text this view has caught up to. */
  readonly end: number;
  /** True when `text` leaves out earlier bytes, so the strip says {@link SERIAL_TRIMMED}. */
  readonly trimmed: boolean;
}

export const EMPTY_SERIAL: SerialView = { text: "", end: 0, trimmed: false };

/** `serial` on a frame. `text` is at most {@link SERIAL_HOLD} bytes. */
export interface SerialUpdate {
  readonly from: number;
  readonly text: string;
  /** True when `text` is not an append onto bytes already shown at `from`. */
  readonly replace?: boolean;
  /** True when `text` leaves out earlier bytes the session still has. */
  readonly trimmed?: boolean;
}

/** Applies one frame's serial update. A `from` other than `view.end`, or `replace`, drops what
 * the page shows and keeps `text`. The page then holds at most {@link SERIAL_HOLD} bytes, and
 * `trimmed` is set when that cut, or the frame, left earlier bytes out. */
export function applySerial(view: SerialView, update: SerialUpdate): SerialView {
  const added = utf8Length(update.text);
  const replace = update.replace === true || update.from !== view.end;
  let text = replace ? update.text : view.text + update.text;
  let trimmed = replace ? update.trimmed === true : view.trimmed;
  if (utf8Length(text) > SERIAL_HOLD) {
    text = takeTail(text, SERIAL_HOLD);
    trimmed = true;
  }
  return { text, end: update.from + added, trimmed };
}

/** The strip's text. The trim note sits on its own line where earlier bytes were dropped. */
export function serialShown(view: SerialView): string {
  if (view.text === "") return "";
  return view.trimmed ? `${SERIAL_TRIMMED}\n${view.text}` : view.text;
}

/** The `serial` a late listener should see: the bytes this page still holds, as one replace.
 * Absent when it holds none. */
export function serialReplay(view: SerialView): SerialUpdate | undefined {
  if (view.text === "") return undefined;
  const update: SerialUpdate = {
    from: view.end - utf8Length(view.text),
    text: view.text,
    replace: true,
  };
  return view.trimmed ? { ...update, trimmed: true } : update;
}

function utf8Length(text: string): number {
  return new TextEncoder().encode(text).length;
}

/** The end of `text`, at most `max` UTF-8 bytes, on a character boundary. */
function takeTail(text: string, max: number): string {
  const bytes = new TextEncoder().encode(text);
  if (bytes.length <= max) return text;
  let start = bytes.length - max;
  while (start < bytes.length) {
    const byte = bytes[start];
    if (byte === undefined || (byte & 0xc0) !== 0x80) break;
    start += 1;
  }
  return new TextDecoder().decode(bytes.subarray(start));
}
