import { EGG_IDS, NPC_IDS, type EggId, type NpcId } from "./contracts";
import { GEAR_MAX, playerHeartMax, wholeBloodline } from "./balance";
import { ROUTE_LENGTH } from "./route";
import {
  CONSUMABLE_IDS,
  GEAR_IDS,
  type CodexEntry,
  type Facing,
  type GearTiers,
  type Run,
  type Satchel,
  type Save,
} from "./types";

const KEY = "bloodline-save-v2";
const LEGACY_KEY = "bloodline-save-v1";
const CODEX_LIMIT = 60;

export function emptyGear(): GearTiers {
  return { armor: 0, shield: 0, lens: 0, hourglass: 0, seal: 0 };
}

export function emptySatchel(): Satchel {
  return { potion: 0, scroll: 0, sand: 0, note: 0 };
}

export function emptySave(): Save {
  return {
    version: 2,
    gold: 0,
    gear: emptyGear(),
    satchel: emptySatchel(),
    unlocked: 1,
    lastBloodline: 1,
    run: null,
    secrets: [],
    answers: 0,
    codex: [],
    lastSeen: [],
    npcVisits: {},
    seen: { prologue: false, controls: false },
    stats: { climbs: 0, thrones: 0, best: 0, earned: 0 },
  };
}

type LegacySave = {
  version: 1;
  gold?: number;
  gear?: Partial<Record<"armor" | "shield" | "codexLens" | "hourglass" | "mentorSeal", boolean>>;
  unlocked?: number;
  codex?: CodexEntry[];
  lastSeen?: string[];
};

/** v1 kept gear as booleans and stopped at Bloodline III. Owned gear becomes tier one. */
export function migrateV1(legacy: LegacySave): Save {
  const save = emptySave();
  const gear = legacy.gear ?? {};
  save.gold = count(legacy.gold);
  save.gear = {
    armor: gear.armor ? 1 : 0,
    shield: gear.shield ? 1 : 0,
    lens: gear.codexLens ? 1 : 0,
    hourglass: gear.hourglass ? 1 : 0,
    seal: gear.mentorSeal ? 1 : 0,
  };
  save.unlocked = Math.min(3, wholeBloodline(legacy.unlocked ?? 1));
  save.lastBloodline = save.unlocked;
  save.codex = cleanCodex(legacy.codex);
  save.lastSeen = cleanStrings(legacy.lastSeen);
  save.seen.prologue = true;
  return save;
}

export function loadSave(): Save {
  if (typeof window === "undefined") return emptySave();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) return normalize(JSON.parse(raw));
    const legacy = window.localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      const parsed = JSON.parse(legacy) as LegacySave;
      if (parsed && parsed.version === 1) {
        const migrated = migrateV1(parsed);
        writeSave(migrated);
        return migrated;
      }
    }
  } catch {
    // A corrupt save starts fresh rather than locking the castle.
  }
  return emptySave();
}

export function writeSave(save: Save) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(save));
  } catch {
    // A full storage quota should not crash the climb.
  }
}

export function wipeSave() {
  try {
    window.localStorage.removeItem(KEY);
    window.localStorage.removeItem(LEGACY_KEY);
  } catch {
    // Nothing to wipe.
  }
}

/** Accept anything shaped like a v2 save and repair what is missing or out of range. */
export function normalize(input: unknown): Save {
  const base = emptySave();
  if (!input || typeof input !== "object") return base;
  const version = (input as { version?: unknown }).version;
  if (version === 1) return migrateV1(input as LegacySave);
  if (version !== 2) return base;
  const raw = input as Partial<Save>;

  const gear = emptyGear();
  for (const id of GEAR_IDS) gear[id] = Math.min(GEAR_MAX[id], count(raw.gear?.[id]));
  const satchel = emptySatchel();
  for (const id of CONSUMABLE_IDS) satchel[id] = count(raw.satchel?.[id]);
  const unlocked = wholeBloodline(raw.unlocked ?? 1);
  const npcVisits: Partial<Record<NpcId, number>> = {};
  for (const id of NPC_IDS) {
    const visits = count(raw.npcVisits?.[id]);
    if (visits) npcVisits[id] = visits;
  }
  const secrets = Array.isArray(raw.secrets)
    ? raw.secrets.filter((id): id is EggId => (EGG_IDS as string[]).includes(id))
    : [];

  return {
    version: 2,
    gold: count(raw.gold),
    gear,
    satchel,
    unlocked,
    lastBloodline: Math.min(unlocked, wholeBloodline(raw.lastBloodline ?? unlocked)),
    run: normalizeRun(raw.run, gear),
    secrets: Array.from(new Set(secrets)),
    answers: count(raw.answers),
    codex: cleanCodex(raw.codex),
    lastSeen: cleanStrings(raw.lastSeen),
    npcVisits,
    seen: {
      prologue: Boolean(raw.seen?.prologue),
      controls: Boolean(raw.seen?.controls),
    },
    stats: {
      climbs: count(raw.stats?.climbs),
      thrones: count(raw.stats?.thrones),
      best: count(raw.stats?.best),
      earned: count(raw.stats?.earned),
    },
  };
}

const FACINGS: Facing[] = ["up", "down", "left", "right"];

function normalizeRun(input: unknown, gear: GearTiers): Run | null {
  if (!input || typeof input !== "object") return null;
  const raw = input as Partial<Run>;
  if (typeof raw.id !== "string") return null;
  const maxHearts = Math.max(1, count(raw.maxHearts) || playerHeartMax(gear));
  const nodeIndex = Math.min(ROUTE_LENGTH - 1, count(raw.nodeIndex));
  const hearts = Math.min(maxHearts, count(raw.hearts));
  if (hearts <= 0) return null;
  const pos =
    raw.pos && Number.isFinite(raw.pos.x) && Number.isFinite(raw.pos.y)
      ? {
          x: Math.floor(raw.pos.x),
          y: Math.floor(raw.pos.y),
          facing: FACINGS.includes(raw.pos.facing) ? raw.pos.facing : "up",
        }
      : null;
  const duel =
    raw.duel && typeof raw.duel === "object" && count(raw.duel.enemyHearts) > 0
      ? {
          enemyHearts: count(raw.duel.enemyHearts),
          enemyMax: Math.max(1, count(raw.duel.enemyMax)),
          shield: Boolean(raw.duel.shield),
          misses: count(raw.duel.misses),
          hits: count(raw.duel.hits),
          seats: Array.isArray(raw.duel.seats) ? raw.duel.seats : [],
        }
      : null;
  return {
    id: raw.id,
    bloodline: wholeBloodline(raw.bloodline ?? 1),
    nodeIndex,
    hearts,
    maxHearts,
    lifelines: {
      hint: count(raw.lifelines?.hint),
      time: count(raw.lifelines?.time),
      senior: count(raw.lifelines?.senior),
    },
    gold: count(raw.gold),
    usedIds: cleanStrings(raw.usedIds),
    chests: cleanStrings(raw.chests),
    pos,
    duel,
    answers: count(raw.answers),
    correct: count(raw.correct),
  };
}

function count(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}

function cleanStrings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function cleanCodex(value: unknown): CodexEntry[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (entry): entry is CodexEntry =>
        Boolean(entry) &&
        typeof entry.id === "string" &&
        typeof entry.prompt === "string" &&
        typeof entry.principle === "string",
    )
    .map((entry) => ({ ...entry, bloodline: wholeBloodline(entry.bloodline ?? 1) }))
    .slice(0, CODEX_LIMIT);
}

export function rememberMiss(save: Save, entry: CodexEntry): Save {
  const codex = [entry, ...save.codex.filter((item) => item.id !== entry.id)].slice(0, CODEX_LIMIT);
  return { ...save, codex };
}
