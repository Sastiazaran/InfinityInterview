import type { Bloodline, CodexEntry, Gear, Save } from "./types";

const KEY = "bloodline-save-v1";

export const EMPTY_GEAR: Gear = {
  armor: false,
  shield: false,
  codexLens: false,
  hourglass: false,
  mentorSeal: false,
};

export function emptySave(): Save {
  return {
    version: 1,
    gold: 0,
    gear: { ...EMPTY_GEAR },
    unlocked: 1,
    codex: [],
    lastSeen: [],
  };
}

export function loadSave(): Save {
  if (typeof window === "undefined") return emptySave();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return emptySave();
    const parsed = JSON.parse(raw) as Save;
    if (parsed.version !== 1 || !parsed.gear) return emptySave();
    return {
      ...emptySave(),
      ...parsed,
      gear: { ...EMPTY_GEAR, ...parsed.gear },
      codex: Array.isArray(parsed.codex) ? parsed.codex : [],
      lastSeen: Array.isArray(parsed.lastSeen) ? parsed.lastSeen : [],
      unlocked: clampBloodline(parsed.unlocked),
    };
  } catch {
    return emptySave();
  }
}

export function writeSave(save: Save) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(save));
  } catch {
    // A full storage quota should not crash the climb.
  }
}

function clampBloodline(value: number): Bloodline {
  if (value >= 3) return 3;
  if (value === 2) return 2;
  return 1;
}

export function rememberMiss(save: Save, entry: CodexEntry): Save {
  const codex = [entry, ...save.codex.filter((item) => item.id !== entry.id)].slice(0, 40);
  return { ...save, codex };
}
