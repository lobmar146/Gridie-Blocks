import { useSyncExternalStore } from "react";

/** The stage when no page has set the colours. The studio's dark ground. */
export const STAGE_DARK = {
  background: "#17191c",
  mat: "#202327",
  line: "#2c3036",
} as const;

export interface StageTheme {
  readonly background: string;
  readonly mat: string;
  readonly line: string;
}

const SERVER: StageTheme = STAGE_DARK;
let current: StageTheme = SERVER;

function read(): StageTheme {
  if (typeof document === "undefined") return SERVER;
  const style = getComputedStyle(document.documentElement);
  const value = (name: string, fallback: string) => style.getPropertyValue(name).trim() || fallback;
  const next: StageTheme = {
    background: value("--stage", STAGE_DARK.background),
    mat: value("--stage-mat", STAGE_DARK.mat),
    line: value("--stage-line", STAGE_DARK.line),
  };
  if (current.background === next.background && current.mat === next.mat && current.line === next.line) return current;
  current = next;
  return current;
}

function subscribe(onChange: () => void): () => void {
  if (typeof document === "undefined") return () => {};
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
}

/** The stage colours on `<html>`. A class change, including one from the other site's theme, updates it. */
export function useStageTheme(): StageTheme {
  return useSyncExternalStore(subscribe, read, () => SERVER);
}
