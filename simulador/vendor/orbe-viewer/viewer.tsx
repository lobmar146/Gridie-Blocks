// Adapted from maker-sandbox (MIT, Copyright 2026 Alwurts).
import { Canvas, type RootState, useThree } from "@react-three/fiber";
import {
  Component,
  type ReactNode,
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { Color } from "three";
import type { BuiltScene } from "./build";
import type { CameraMode } from "./camera-frame";
import { createHoverStore, type HoverStore } from "./hover";
import type { Command, FrameMessage, FrameState, Reply, SceneMessage, ScreenImage } from "./protocol";
import { SceneView } from "./scene-view";
import { useStageTheme } from "./stage-theme";
import { applySerial, EMPTY_SERIAL, serialShown, type SerialView } from "./serial";
import { commandLine, errorText, type SessionSource } from "./session";
import { speedText } from "./speed";
import {
  type Control,
  formatValue,
  IDLE,
  nearest,
  nextThumb,
  paramControl,
  shownValue,
  type Thumb,
  type ThumbEvent,
  worldControl,
} from "./world";

class ShowError extends Component<{ children: ReactNode }, { error: Error | null }> {
  override state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  override render() {
    const { error } = this.state;
    return error === null ? this.props.children : <pre style={overlay}>{error.message}</pre>;
  }
}

const overlay = {
  position: "absolute",
  inset: 0,
  margin: 0,
  padding: 16,
  color: "#ff8a80",
  font: "13px ui-monospace, monospace",
  whiteSpace: "pre-wrap",
} as const;

function HoverLabel({ hover }: { hover: HoverStore }) {
  const hovered = useSyncExternalStore(hover.subscribe, hover.get);
  if (hovered === null) return null;
  return (
    <div
      data-testid="hover-label"
      style={{
        position: "fixed",
        left: hovered.x + 14,
        top: hovered.y + 14,
        pointerEvents: "none",
        padding: "2px 8px",
        borderRadius: "var(--radius, 6px)",
        background: "var(--stage-label-bg, rgba(20, 22, 26, 0.92))",
        border: "1px solid var(--stage-label-border, #3a3f47)",
        maxWidth: 360,
        color: "var(--stage-label-fg, #e6ebf2)",
        font: "12px ui-monospace, monospace",
      }}
    >
      <div>{hovered.ref}</div>
      {hovered.strip === undefined ? null : <div style={{ color: "var(--stage-label-muted, #c9ced6)" }}>{hovered.strip}</div>}
      {hovered.why === undefined ? null : <div style={{ color: "var(--stage-label-muted, #c9ced6)" }}>not simulated: {hovered.why}</div>}
      {hovered.error === undefined ? null : <div style={{ color: "#ff8a80" }}>error: {hovered.error}</div>}
    </div>
  );
}

/** UART text the firmware printed. A Block that prints nothing shows no strip. */
function SerialStrip({ source }: { source: SessionSource }) {
  const [view, setView] = useState<SerialView>(EMPTY_SERIAL);
  const box = useRef<HTMLPreElement>(null);
  useEffect(
    () =>
      source.subscribe((message) => {
        if (message.type === "scene") {
          setView(EMPTY_SERIAL);
          return;
        }
        if (message.type === "frame" && message.serial !== undefined) {
          const update = message.serial;
          setView((current) => applySerial(current, update));
        }
      }),
    [source]
  );
  useEffect(() => {
    const node = box.current;
    if (node !== null) node.scrollTop = node.scrollHeight;
  }, [view.text, view.trimmed]);
  if (view.text === "") return null;
  return (
    <pre
      ref={box}
      data-testid="serial"
      style={{
        alignSelf: "stretch",
        width: "100%",
        flexShrink: 0,
        maxHeight: "6.5rem",
        overflow: "auto",
        boxSizing: "border-box",
        margin: 0,
        padding: "6px 8px",
        borderRadius: "var(--radius, 6px)",
        border: "1px solid var(--border, #3a3f47)",
        background: "var(--background, rgba(20, 22, 26, 0.92))",
        color: "var(--foreground, #e6ebf2)",
        font: "12px/1.4 ui-monospace, SFMono-Regular, Menlo, monospace",
        whiteSpace: "pre-wrap",
        overflowWrap: "anywhere",
        pointerEvents: "auto",
      }}
    >
      {serialShown(view)}
    </pre>
  );
}

/** The instances and wires the viewer could not draw, which the rest of the scene draws
 * around, and the commands the session refused or never got. */
function Errors({ errors }: { errors: readonly string[] }) {
  if (errors.length === 0) return null;
  return (
    <pre data-testid="errors" style={{ ...overlay, inset: "auto 0 0 0", pointerEvents: "none" }}>
      {errors.join("\n")}
    </pre>
  );
}

/** `t_ps` in seconds, to the microsecond. */
const seconds = (t_ps: number) => `${(t_ps / 1e12).toFixed(6)} s`;

/** How long a slider waits after the last key step before it sends, so a burst of presses or a
 * held arrow sends one `set`. */
const SETTLE_MS = 300;

const field = {
  font: "inherit",
  color: "inherit",
  background: "var(--stage-field, #2a2f37)",
  border: "1px solid var(--stage-field-border, #4a5058)",
  borderRadius: "var(--radius, 4px)",
  padding: "1px 4px",
} as const;

/** One control's thumb and its number, for a world quantity or a part's live param. A pointer
 * sends `set` when it lets go, the keyboard once no key is down for {@link SETTLE_MS}, and the
 * number when Enter is pressed. From then until the session answers and a frame follows, the
 * thumb holds the sent value. */
function Slider({
  control,
  frame,
  off,
  send,
}: {
  control: Control;
  frame: number;
  off: boolean;
  send: (command: Command) => Promise<boolean>;
}) {
  const values = control.stops;
  const [thumb, setThumb] = useState<Thumb>(IDLE);
  const [typed, setTyped] = useState<string | null>(null);
  const [why, setWhy] = useState<string | null>(null);
  const live = useRef({ thumb, frame, pointer: false, keys: false, timer: 0 });
  live.current.frame = frame;

  const apply = useCallback(
    (event: ThumbEvent) => {
      const before = live.current.thumb;
      const after = nextThumb(before, event);
      live.current.thumb = after;
      setThumb(after);
      if (after.kind === "sending" && after !== before) {
        const value = after.value;
        void send(control.command(value)).then((ok) => apply({ type: "replied", value, ok, frame: live.current.frame }));
      }
    },
    [control, send]
  );
  useEffect(() => apply({ type: "frame" }), [apply, frame]);
  useEffect(() => () => window.clearTimeout(live.current.timer), []);

  const settle = () => {
    window.clearTimeout(live.current.timer);
    apply({ type: "settle", frame: live.current.frame });
  };
  const settleLater = () => {
    window.clearTimeout(live.current.timer);
    live.current.timer = window.setTimeout(settle, SETTLE_MS);
  };
  const letGo = () => {
    live.current.pointer = false;
    settle();
  };

  const shown = shownValue(thumb, frame);
  const { id, label, unit } = control;
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
      <label htmlFor={id} style={{ minWidth: 84 }}>
        {label}
      </label>
      <input
        id={id}
        data-testid={id}
        type="range"
        min={0}
        max={values.length - 1}
        step={1}
        value={nearest(values, shown)}
        disabled={off}
        aria-valuetext={unit === "" ? formatValue(shown) : `${formatValue(shown)} ${unit}`}
        onChange={(event) => {
          const value = values[Number(event.currentTarget.value)];
          if (value === undefined) return;
          apply({ type: "move", value });
          if (!live.current.pointer && !live.current.keys) settleLater();
        }}
        onPointerDown={(event) => {
          live.current.pointer = true;
          window.clearTimeout(live.current.timer);
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerUp={letGo}
        onPointerCancel={letGo}
        onKeyDown={() => {
          live.current.keys = true;
          window.clearTimeout(live.current.timer);
        }}
        onKeyUp={() => {
          live.current.keys = false;
          settleLater();
        }}
        onBlur={settle}
        style={{ width: "clamp(96px, 30vw, 180px)", margin: 0 }}
      />
      <input
        data-testid={`${id}-value`}
        data-frame={String(frame)}
        aria-label={unit === "" ? label : `${label} in ${unit}`}
        inputMode="decimal"
        disabled={off}
        value={typed ?? formatValue(shown)}
        onFocus={(event) => event.currentTarget.select()}
        onChange={(event) => {
          setTyped(event.currentTarget.value);
          setWhy(null);
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setTyped(null);
            setWhy(null);
          }
          if (event.key !== "Enter" || typed === null) return;
          const parsed = control.parse(typed);
          if (!parsed.ok) {
            setWhy(parsed.why);
            return;
          }
          setTyped(null);
          apply({ type: "send", value: parsed.value, frame: live.current.frame });
        }}
        onBlur={() => {
          setTyped(null);
          setWhy(null);
        }}
        style={{ ...field, width: 64, textAlign: "right", outline: why === null ? undefined : "1px solid #ff8a80" }}
      />
      {unit === "" ? null : <span>{unit}</span>}
      {why === null ? null : (
        <div data-testid={`${id}-error`} style={{ flexBasis: "100%", color: "#ff8a80" }}>
          {why}
        </div>
      )}
    </div>
  );
}

const worldValues = (frame: FrameMessage) => frame.world ?? [];
const paramValues = (frame: FrameMessage) => frame.params ?? [];

const sameValues = (a: readonly number[], b: readonly number[]) => a.length === b.length && a.every((value, i) => value === b[i]);

/** One slider per control, each at the value `values` reads from a frame, off once the session
 * stopped or faulted, since the session then refuses every `set`. `name` is the panel's test id,
 * and `still` what stays as it is once the session ended. */
function SliderPanel({
  controls,
  values: valuesOf,
  name,
  still,
  source,
  send,
}: {
  controls: readonly Control[];
  values: (frame: FrameMessage) => readonly number[];
  name: string;
  still: string;
  source: SessionSource;
  send: (command: Command) => Promise<Reply | null>;
}) {
  const [now, setNow] = useState<{ values: readonly number[]; state: FrameState } | null>(null);
  useEffect(
    () =>
      source.subscribe((message) => {
        if (message.type !== "frame") return;
        const values = valuesOf(message);
        setNow((current) =>
          current !== null && current.state === message.state && sameValues(current.values, values)
            ? current
            : { values, state: message.state }
        );
      }),
    [source, valuesOf]
  );
  const set = useCallback((command: Command) => send(command).then((reply) => reply?.ok === true), [send]);
  if (now === null) return null;
  const off = now.state === "stopped" || now.state === "faulted";
  return (
    <div
      data-testid={name}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 6,
        padding: "8px 10px",
        borderRadius: "var(--radius, 6px)",
        background: "var(--stage-label-bg, rgba(20, 22, 26, 0.92))",
        border: "1px solid var(--stage-label-border, #3a3f47)",
        color: "var(--stage-label-fg, #e6ebf2)",
        font: "12px ui-monospace, monospace",
        pointerEvents: "auto",
      }}
    >
      {controls.map((control, index) => (
        <Slider key={control.id} control={control} frame={now.values[index] ?? control.start} off={off} send={set} />
      ))}
      {off ? (
        <div data-testid={`${name}-off`} style={{ color: "var(--stage-label-muted, #c9ced6)" }}>
          {`The session ${now.state}, so ${still}.`}
        </div>
      ) : null}
    </div>
  );
}

/** The session's state and time, a button that plays or pauses it, and the fault below once
 * the session faulted. It reads frames itself, so a frame redraws only this bar. */
function Controls({ source, send }: { source: SessionSource; send: (command: Command) => void }) {
  const [now, setNow] = useState<{ state: FrameState; t_ps: number; ratio?: number; fault?: string } | null>(null);
  useEffect(
    () =>
      source.subscribe((message) => {
        if (message.type === "frame") {
          setNow({ state: message.state, t_ps: message.t_ps, ratio: message.ratio, fault: message.fault });
        }
      }),
    [source]
  );
  if (now === null) return null;
  const playing = now.state === "playing";
  const ended = now.state === "stopped" || now.state === "faulted";
  const speed = speedText(now.state, now.ratio);
  return (
    <>
      <div
        data-testid="controls"
        style={{
          display: "flex",
          gap: 10,
          alignItems: "center",
          padding: "4px 6px 4px 10px",
          borderRadius: "var(--radius, 6px)",
          background: "var(--stage-label-bg, rgba(20, 22, 26, 0.92))",
          border: "1px solid var(--stage-label-border, #3a3f47)",
          color: "var(--stage-label-fg, #e6ebf2)",
          font: "12px ui-monospace, monospace",
          pointerEvents: "auto",
        }}
      >
        <span data-testid="state">{now.state}</span>
        <span data-testid="time">t = {seconds(now.t_ps)}</span>
        {speed === null ? null : (
          <span data-testid="speed" style={{ color: "var(--stage-label-muted, #c9ced6)" }}>
            {speed}
          </span>
        )}
        <button
          data-testid="play"
          disabled={ended}
          onClick={() => send({ cmd: playing ? "pause" : "play" })}
          style={{
            font: "inherit",
            color: "inherit",
            background: "var(--stage-field, #2a2f37)",
            border: "1px solid var(--stage-field-border, #4a5058)",
            borderRadius: "var(--radius, 4px)",
            padding: "2px 10px",
            cursor: ended ? "default" : "pointer",
          }}
          type="button"
        >
          {playing ? "Pause" : "Play"}
        </button>
      </div>
      {now.fault === undefined ? null : (
        <pre data-testid="fault" style={{ ...overlay, position: "static", padding: 0, maxWidth: "100%" }}>
          {now.fault}
        </pre>
      )}
    </>
  );
}

/** Paints the canvas clear color and the scene background from the page theme. */
function StageBackdrop({ color }: { color: string }) {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  useLayoutEffect(() => {
    const next = new Color(color);
    scene.background = next;
    gl.setClearColor(next);
  }, [color, gl, scene]);
  return null;
}

export interface ViewerProps {
  readonly source: SessionSource;
  /** Called once the canvas has its renderer, scene and camera. */
  readonly onCreated?: (state: RootState) => void;
  /** GrIDIE: la escena ya se ve en pantalla (ver SceneView). */
  readonly onReady?: () => void;
  /** A wheel scrolls the page, and zooms only with Ctrl or ⌘. One finger scrolls the page.
   * Two fingers orbit and zoom. The viewer's own page leaves this off. */
  readonly pageScroll?: boolean;
}

const HINT_MS = 1600;

const hintStyle = {
  position: "absolute",
  left: "50%",
  bottom: 16,
  transform: "translateX(-50%)",
  zIndex: 2,
  maxWidth: "calc(100% - 24px)",
  pointerEvents: "none",
  padding: "6px 10px",
  background: "var(--stage-label-bg, rgba(20, 22, 26, 0.92))",
  color: "var(--stage-label-fg, #e6ebf2)",
  border: "1px solid var(--stage-label-border, #3a3f47)",
  font: "12px ui-monospace, monospace",
  whiteSpace: "nowrap",
} as const;

/** Draws the session's scene and its frames, and sends presses, `set`, `play` and `pause` back. `T`
 * toggles the top view. */
export function Viewer({ source, onCreated, onReady, pageScroll = false }: ViewerProps) {
  const stage = useStageTheme();
  const box = useRef<HTMLDivElement>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [scene, setScene] = useState<SceneMessage | null>(null);
  const [mode, setMode] = useState<CameraMode>("tilted");
  const frame = useRef<FrameMessage | null>(null);
  const ledPeak = useRef<number[]>([]);
  const screens = useRef<(ScreenImage | undefined)[]>([]);
  const hover = useMemo(createHoverStore, []);
  const [partErrors, setPartErrors] = useState<readonly string[]>([]);
  const [sendErrors, setSendErrors] = useState<readonly string[]>([]);
  const [closed, setClosed] = useState<string | null>(null);
  const onBuilt = useCallback((built: BuiltScene) => setPartErrors(built.errors), []);
  const worldControls = useMemo(() => (scene?.world ?? []).map(worldControl), [scene]);
  const paramControls = useMemo(() => (scene?.params ?? []).map(paramControl), [scene]);
  const send = useCallback(
    (command: Command): Promise<Reply | null> => {
      const fail = (why: string) => {
        const line = `${commandLine(command)}: ${why}`;
        console.error(line);
        setSendErrors((errors) => [...errors, line]);
      };
      return source.send(command).then(
        (reply) => {
          if (!reply.ok) fail(errorText(reply.error));
          return reply;
        },
        (error: unknown) => {
          fail(error instanceof Error ? error.message : String(error));
          return null;
        }
      );
    },
    [source]
  );

  useEffect(
    () =>
      source.subscribe((message) => {
        if (message.type === "scene") {
          frame.current = null;
          ledPeak.current = [];
          screens.current = [];
          setSendErrors([]);
          setScene(message);
        } else if (message.type === "frame") {
          const peaks = ledPeak.current;
          for (let channel = 0; channel < message.led_a.length; channel += 1) {
            peaks[channel] = Math.max(peaks[channel] ?? 0, message.led_a[channel] ?? 0);
          }
          for (const [channel, image] of (message.screens ?? []).entries()) {
            if (image !== null) screens.current[channel] = image;
          }
          frame.current = message;
        } else {
          setClosed(message.reason);
        }
      }),
    [source]
  );
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement) return;
      if (event.key === "t" || event.key === "T") setMode((current) => (current === "top" ? "tilted" : "top"));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!pageScroll) return;
    const node = box.current;
    if (node === null) return;
    let timer = 0;
    const show = (text: string) => {
      setHint(text);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setHint(null), HINT_MS);
    };
    // Capture runs before OrbitControls' listener on the canvas, which would cancel the scroll.
    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey || event.metaKey) return;
      event.stopPropagation();
      show("Ctrl + scroll to zoom");
    };
    let finger: { id: number; x: number; y: number } | null = null;
    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType !== "touch") return;
      if (!event.isPrimary) {
        finger = null;
        return;
      }
      finger = { id: event.pointerId, x: event.clientX, y: event.clientY };
    };
    const onPointerMove = (event: PointerEvent) => {
      if (finger === null || event.pointerId !== finger.id) return;
      const dx = event.clientX - finger.x;
      const dy = event.clientY - finger.y;
      if (dx * dx + dy * dy < 64) return;
      finger = null;
      show("Use two fingers to move the view");
    };
    const onPointerEnd = (event: PointerEvent) => {
      if (finger?.id === event.pointerId) finger = null;
    };
    // The canvas does not inherit touch-action. OrbitControls sets none on its element, not always
    // on the canvas, so a finger on the canvas would still miss the page.
    const paintCanvas = () => {
      for (const canvas of node.querySelectorAll("canvas")) {
        if (canvas.style.touchAction !== "pan-y") canvas.style.touchAction = "pan-y";
      }
    };
    paintCanvas();
    const observer = new MutationObserver(paintCanvas);
    observer.observe(node, { childList: true, subtree: true });
    node.addEventListener("wheel", onWheel, { capture: true });
    node.addEventListener("pointerdown", onPointerDown, { capture: true });
    node.addEventListener("pointermove", onPointerMove, { capture: true });
    node.addEventListener("pointerup", onPointerEnd, { capture: true });
    node.addEventListener("pointercancel", onPointerEnd, { capture: true });
    return () => {
      observer.disconnect();
      window.clearTimeout(timer);
      node.removeEventListener("wheel", onWheel, { capture: true });
      node.removeEventListener("pointerdown", onPointerDown, { capture: true });
      node.removeEventListener("pointermove", onPointerMove, { capture: true });
      node.removeEventListener("pointerup", onPointerEnd, { capture: true });
      node.removeEventListener("pointercancel", onPointerEnd, { capture: true });
    };
  }, [pageScroll]);

  return (
    <div
      data-testid="viewer"
      ref={box}
      style={{ position: "relative", width: "100%", height: "100%", touchAction: pageScroll ? "pan-y" : "none" }}
    >
      <ShowError>
        {/* The effect composer forces tone mapping off. Bloom reads only the LED glow meshes. */}
        <Canvas dpr={[1, 1.75]} flat gl={{ antialias: false, alpha: false }} onCreated={onCreated}>
          <StageBackdrop color={stage.background} />
          {scene === null ? null : (
            <Suspense fallback={null}>
              <SceneView
                colours={stage}
                frame={frame}
                hover={hover}
                ledPeak={ledPeak}
                screens={screens}
                mode={mode}
                onBuilt={onBuilt}
                onReady={onReady}
                pageScroll={pageScroll}
                scene={scene}
                send={send}
              />
            </Suspense>
          )}
        </Canvas>
      </ShowError>
      <Errors errors={[...partErrors, ...sendErrors]} />
      {closed === null ? (
        <div
          style={{
            position: "absolute",
            top: 12,
            left: 12,
            width: "calc(100% - 24px)",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            gap: 8,
            pointerEvents: "none",
          }}
        >
          <Controls send={send} source={source} />
          <SerialStrip source={source} />
          {worldControls.length === 0 ? null : (
            <SliderPanel
              controls={worldControls}
              values={worldValues}
              name="world"
              still="the world stays as it is"
              send={send}
              source={source}
            />
          )}
          {paramControls.length === 0 ? null : (
            <SliderPanel
              controls={paramControls}
              values={paramValues}
              name="params"
              still="each knob stays where it is"
              send={send}
              source={source}
            />
          )}
        </div>
      ) : null}
      {closed === null ? null : (
        <div
          data-testid="closed"
          style={{ ...overlay, inset: 0, display: "grid", placeItems: "center", background: "rgba(16, 17, 20, 0.8)", color: "#e6ebf2" }}
        >
          {`the session ended: ${closed}`}
        </div>
      )}
      <HoverLabel hover={hover} />
      {hint === null ? null : (
        <div data-testid="gesture-hint" style={hintStyle}>
          {hint}
        </div>
      )}
    </div>
  );
}
