"use client";

import { useEffect, useEffectEvent } from "react";
import type { Facing } from "@/game/types";

/** Higher layers hear a key first. A modal layer stops keys from reaching anything below it. */
export const LAYER = {
  GLOBAL: 0,
  SCREEN: 10,
  CHALLENGE: 20,
  PANEL: 30,
  MODAL: 40,
  CONFIRM: 50,
} as const;

/** Return true when the key was used. Used keys never scroll the page or click a button. */
export type KeyHandler = (event: KeyboardEvent) => boolean | void;

type Layer = { priority: number; order: number; modal: boolean; handler: KeyHandler };

const layers = new Set<Layer>();
let order = 0;
let installed = false;

function dispatch(event: KeyboardEvent) {
  if (event.ctrlKey || event.metaKey || event.altKey) return;
  const sorted = [...layers].sort((a, b) => b.priority - a.priority || b.order - a.order);
  for (const layer of sorted) {
    if (layer.handler(event)) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    if (layer.modal) {
      if (PAGE_KEYS.has(event.key)) event.preventDefault();
      return;
    }
  }
  if (PAGE_KEYS.has(event.key)) event.preventDefault();
}

/** Keys that would otherwise scroll the page or press a focused button. */
const PAGE_KEYS = new Set([" ", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Enter", "Backspace"]);

function install() {
  if (installed || typeof window === "undefined") return;
  installed = true;
  window.addEventListener("keydown", dispatch, { capture: true });
}

export function useKeyLayer(
  priority: number,
  handler: KeyHandler,
  options: { enabled?: boolean; modal?: boolean } = {},
) {
  const enabled = options.enabled ?? true;
  const modal = options.modal ?? false;
  const onKey = useEffectEvent((event: KeyboardEvent) => handler(event));
  useEffect(() => {
    if (!enabled) return;
    install();
    const layer: Layer = { priority, order: ++order, modal, handler: (event) => onKey(event) };
    layers.add(layer);
    return () => {
      layers.delete(layer);
    };
  }, [enabled, modal, priority]);
}

/** Every key release, regardless of layers. The map uses it to stop walking. */
export function useKeyUp(handler: (event: KeyboardEvent) => void, enabled = true) {
  const onUp = useEffectEvent((event: KeyboardEvent) => handler(event));
  useEffect(() => {
    if (!enabled) return;
    const listener = (event: KeyboardEvent) => onUp(event);
    const blur = () => onUp(new KeyboardEvent("keyup", { key: "*" }));
    window.addEventListener("keyup", listener);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keyup", listener);
      window.removeEventListener("blur", blur);
    };
  }, [enabled]);
}

export function isConfirm(event: KeyboardEvent): boolean {
  return event.key === "Enter" || event.key === " " || event.key === "z" || event.key === "Z";
}

export function isBack(event: KeyboardEvent): boolean {
  return event.key === "x" || event.key === "X" || event.key === "Backspace";
}

export function isMenu(event: KeyboardEvent): boolean {
  return event.key === "Escape" || event.key === "p" || event.key === "P";
}

const ARROWS: Record<string, Facing> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
};

const WASD: Record<string, Facing> = {
  w: "up",
  W: "up",
  s: "down",
  S: "down",
  a: "left",
  A: "left",
  d: "right",
  D: "right",
};

/** Arrow keys only. Challenges use this so letters stay free for lifelines. */
export function arrowOf(event: KeyboardEvent): Facing | null {
  return ARROWS[event.key] ?? null;
}

/** Arrow keys or WASD, for walking the map. */
export function walkOf(event: KeyboardEvent): Facing | null {
  return ARROWS[event.key] ?? WASD[event.key] ?? null;
}

export function digitOf(event: KeyboardEvent): number | null {
  return /^[0-9]$/.test(event.key) ? Number(event.key) : null;
}

/** Clamp-free wrap for list cursors. */
export function wrapIndex(index: number, length: number): number {
  if (length <= 0) return 0;
  return ((index % length) + length) % length;
}
