import type { ItemId } from "./contracts";
import type { Rng } from "./rng";
import type {
  ChallengeKind,
  ConsumableId,
  GearId,
  GearTiers,
  Lifelines,
  Role,
  Tier,
} from "./types";

export function wholeBloodline(value: number): number {
  return Number.isFinite(value) ? Math.max(1, Math.floor(value)) : 1;
}

/** The authored tier a Bloodline mostly draws from. */
export function baseTier(bloodline: number): Tier {
  const n = wholeBloodline(bloodline);
  return n >= 3 ? 3 : (n as Tier);
}

/** From Bloodline IV on, most content is tier III with some older questions mixed in. */
export function contentTier(bloodline: number, rng: Rng): Tier {
  const n = wholeBloodline(bloodline);
  if (n <= 3) return n as Tier;
  const roll = rng();
  if (roll < 0.72) return 3;
  if (roll < 0.94) return 2;
  return 1;
}

export function enemyHeartCount(bloodline: number, role: Role, onPath = false): number {
  if (onPath) return pathHeartCount(bloodline, role);
  const n = wholeBloodline(bloodline);
  const base = n <= 3 ? n + 1 : Math.min(9, 4 + Math.floor((n - 3) / 2));
  if (role !== "boss") return base;
  return base + (n >= 4 ? 2 : 1);
}

// ——— Topic path levels ———

/** Guardian hearts by level. A path's question bank is finite, so the curve is gentler than a Bloodline's. */
const PATH_HEARTS = [2, 2, 3, 3, 4] as const;

export function wholeLevel(value: number): number {
  return Math.min(PATH_HEARTS.length, wholeBloodline(value));
}

function pathHeartCount(level: number, role: Role): number {
  const base = PATH_HEARTS[wholeLevel(level) - 1];
  return role === "boss" ? base + 1 : base;
}

/** Seconds for a path question by level. Hard levels ask longer questions, so the clock shrinks slowly. */
const PATH_RECALL = [45, 40, 36, 33, 30] as const;

/** Plain facts about a path level for the selector. */
export function levelFacts(level: number): string[] {
  const n = wholeLevel(level);
  return [
    `Guardians hold ${pathHeartCount(n, "algo")} hearts, the throne ${pathHeartCount(n, "boss")}`,
    `${secondsFor("mcq", n, undefined, true)}s to answer`,
    `${freeHints(n)} free hint${freeHints(n) === 1 ? "" : "s"}`,
  ];
}

export const BASE_HEARTS = 3;

export function playerHeartMax(gear: GearTiers): number {
  return BASE_HEARTS + gear.armor;
}

export function freeHints(bloodline: number): number {
  return wholeBloodline(bloodline) >= 4 ? 1 : 2;
}

export function startingLifelines(gear: GearTiers, bloodline: number, duckPerk: boolean): Lifelines {
  return {
    hint: freeHints(bloodline) + (duckPerk ? 1 : 0),
    time: 1 + gear.hourglass,
    senior: 1 + gear.seal,
  };
}

export const EXTRA_SECONDS = 20;

const BASE_SECONDS: Record<ChallengeKind, number> = {
  mcq: 45,
  model: 45,
  box: 45,
  latency: 50,
  pipeline: 55,
  context: 55,
  stack: 50,
  flood: 60,
  complexity: 55,
  pointers: 55,
  bsearch: 55,
  brackets: 45,
  maze: 60,
  swaps: 60,
  lru: 65,
};

/** How fast recall questions must be answered: 45s, 30s, 20s, then down to a 12s floor. */
function recallPace(n: number): number {
  if (n === 1) return 1;
  if (n === 2) return 0.67;
  if (n === 3) return 0.45;
  return Math.max(0.27, 0.45 - 0.025 * (n - 3));
}

/** Puzzles grow with the Bloodline, so their clock tightens more gently. */
function puzzlePace(n: number): number {
  return Math.max(0.6, 1 - 0.06 * (n - 1));
}

export function secondsFor(kind: ChallengeKind, bloodline: number, par?: number, onPath = false): number {
  const n = wholeBloodline(bloodline);
  if (kind === "mcq" || kind === "model" || kind === "box") {
    if (onPath) return PATH_RECALL[wholeLevel(n) - 1];
    return Math.max(12, Math.round(BASE_SECONDS[kind] * recallPace(n)));
  }
  const base = par ?? BASE_SECONDS[kind];
  return Math.max(20, Math.round(base * puzzlePace(n)));
}

// ——— Gold ———

export function heartGold(bloodline: number): number {
  return 1 + Math.ceil(wholeBloodline(bloodline) / 2);
}

export function stageGold(bloodline: number, nodeIndex: number): number {
  const n = wholeBloodline(bloodline);
  return Math.round((5 + 2 * nodeIndex) * (1 + 0.35 * (n - 1)));
}

export function flawlessGold(bloodline: number): number {
  return 3 + wholeBloodline(bloodline);
}

export function throneGold(bloodline: number): number {
  return 20 + 10 * wholeBloodline(bloodline);
}

export function chestGold(bloodline: number, seed: number): number {
  return 4 + 2 * wholeBloodline(bloodline) + (seed % 5);
}

export function comboGold(bloodline: number): number {
  return 1 + Math.floor(wholeBloodline(bloodline) / 3);
}

export function comboLength(bloodline: number): number {
  return Math.min(7, 3 + Math.ceil(wholeBloodline(bloodline) / 2));
}

// ——— Prices ———

export const GEAR_MAX: Record<GearId, number> = {
  armor: 8,
  shield: 1,
  lens: 1,
  hourglass: 5,
  seal: 5,
};

const GEAR_BASE: Record<GearId, number> = {
  armor: 45,
  shield: 40,
  lens: 35,
  hourglass: 30,
  seal: 50,
};

const GEAR_GROWTH: Record<GearId, number> = {
  armor: 1.8,
  shield: 1,
  lens: 1,
  hourglass: 1.7,
  seal: 1.7,
};

/** Price of the next tier. Tiers rise geometrically so later Bloodlines still have a use for gold. */
export function gearPrice(id: GearId, owned: number): number {
  const raw = GEAR_BASE[id] * Math.pow(GEAR_GROWTH[id], owned);
  return Math.round(raw / 5) * 5;
}

const CONSUMABLE_BASE: Record<ConsumableId, number> = {
  potion: 12,
  scroll: 8,
  sand: 8,
  note: 10,
};

const CONSUMABLE_STEP: Record<ConsumableId, number> = {
  potion: 3,
  scroll: 2,
  sand: 2,
  note: 2,
};

export function consumablePrice(id: ConsumableId, bloodline: number): number {
  return CONSUMABLE_BASE[id] + CONSUMABLE_STEP[id] * (wholeBloodline(bloodline) - 1);
}

export const SATCHEL_MAX = 9;

export function isGear(id: ItemId): id is GearId {
  return id === "armor" || id === "shield" || id === "lens" || id === "hourglass" || id === "seal";
}

// ——— Puzzle sizes ———

export function puzzleScale(bloodline: number) {
  const n = wholeBloodline(bloodline);
  return {
    pointers: Math.min(14, 5 + n),
    binaryBits: Math.min(10, 4 + Math.floor((n - 1) / 2)),
    brackets: Math.min(10, 3 + Math.floor(n * 0.8)),
    bracketPairs: Math.min(4, Math.floor((n - 1) / 2)),
    mazeCols: Math.min(8, 4 + Math.floor(n / 2)),
    mazeRows: Math.min(7, 4 + Math.floor((n - 1) / 2)),
    mazeLoops: Math.min(6, 1 + Math.floor(n / 2)),
    swaps: Math.min(10, 5 + Math.floor((n - 1) / 2)),
    swapSlack: n === 1 ? 2 : n <= 3 ? 1 : 0,
    lruCapacity: Math.min(5, 2 + Math.floor(n / 2)),
    stumbles: n === 1 ? 2 : n <= 3 ? 1 : 0,
    stackSteps: Math.min(12, 3 + Math.ceil(n * 1.5)),
    floodSide: n === 1 ? 3 : n <= 4 ? 4 : 5,
    floodWalls: Math.min(6, n === 1 ? 0 : n),
    snippets: n >= 4 ? 4 : 3,
  };
}

/** Plain facts about a Bloodline for the selector. */
export function bloodlineFacts(bloodline: number): string[] {
  const n = wholeBloodline(bloodline);
  const facts = [
    `Guardians hold ${enemyHeartCount(n, "algo")} hearts`,
    `${secondsFor("mcq", n)}s to answer`,
    `${freeHints(n)} free hint${freeHints(n) === 1 ? "" : "s"}`,
  ];
  if (n >= 4) facts.push("The throne holds two extra hearts", "Larger puzzles");
  return facts;
}
