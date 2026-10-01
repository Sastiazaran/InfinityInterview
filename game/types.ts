import type { EggId, NpcId } from "./contracts";

/** Any whole number >= 1. */
export type Bloodline = number;

/** Authored content exists for tiers 1-3. Later Bloodlines draw from these. */
export type Tier = 1 | 2 | 3;

export type Role = "algo" | "system" | "craft" | "puzzle" | "specialist" | "boss";

export type Topic = "algo" | "system" | "craft" | "specialist";

export const GEAR_IDS = ["armor", "shield", "lens", "hourglass", "seal"] as const;
export type GearId = (typeof GEAR_IDS)[number];

export const CONSUMABLE_IDS = ["potion", "scroll", "sand", "note"] as const;
export type ConsumableId = (typeof CONSUMABLE_IDS)[number];

export type GearTiers = Record<GearId, number>;
export type Satchel = Record<ConsumableId, number>;

export type CodexEntry = {
  id: string;
  prompt: string;
  reveal: string;
  why: string;
  principle: string;
  topic: Topic | "boss";
  bloodline: number;
  at: number;
};

type Lesson = {
  id: string;
  /** Content tier while authored; the climb's Bloodline once presented. */
  bloodline: number;
  prompt: string;
  hint: string;
  senior: string;
  principle: string;
  why: string;
  reveal: string;
  /** Seconds a calm Bloodline I player needs. The timer scales from this. */
  par?: number;
};

export type Mcq = Lesson & {
  kind: "mcq";
  topic: Topic | "boss";
  seat?: Topic;
  options: string[];
  answer: number;
};

export type StackChallenge = Lesson & {
  kind: "stack";
  topic: "algo";
  structure: "stack" | "queue";
  ops: { op: "push" | "pop"; value?: number }[];
  answer: number[];
};

export type FloodChallenge = Lesson & {
  kind: "flood";
  topic: "algo";
  cols: number;
  rows: number;
  walls: number[];
  start: number;
  order: number[];
};

export type Bucket = "O(1)" | "O(n)" | "O(n²)";

export type ComplexityChallenge = Lesson & {
  kind: "complexity";
  topic: "algo";
  snippets: { id: string; code: string; bucket: Bucket }[];
};

export type BoxChallenge = Lesson & {
  kind: "box";
  topic: "system";
  cards: { id: string; label: string; detail: string }[];
  answer: string;
};

export type LatencyChallenge = Lesson & {
  kind: "latency";
  topic: "specialist";
  items: { id: string; label: string; onPath: boolean }[];
};

export type PipelineChallenge = Lesson & {
  kind: "pipeline";
  topic: "specialist";
  stages: string[];
};

export type ContextChallenge = Lesson & {
  kind: "context";
  topic: "specialist";
  groups: string[];
  items: { id: string; label: string; group: string }[];
};

export type ModelChallenge = Lesson & {
  kind: "model";
  topic: "specialist";
  options: string[];
  answer: number;
};

/** Two pointers walk a sorted row inward until their sum hits the target. */
export type PointerChallenge = Lesson & {
  kind: "pointers";
  topic: "algo";
  values: number[];
  target: number;
  pair: [number, number];
  /** Moves the two-pointer walk needs from the ends. */
  steps: number;
  /** Wrong-way moves forgiven before the duel counts a miss. */
  stumbles: number;
};

/** Find a hidden number in 1..max with at most `guesses` probes. */
export type BinaryChallenge = Lesson & {
  kind: "bsearch";
  topic: "algo";
  max: number;
  secret: number;
  guesses: number;
};

/** Close what is still open, newest first. */
export type BracketChallenge = Lesson & {
  kind: "brackets";
  topic: "algo";
  tokens: string[];
  answer: string[];
};

/** Reach the exit in exactly the breadth-first shortest number of steps. */
export type MazeChallenge = Lesson & {
  kind: "maze";
  topic: "algo";
  cols: number;
  rows: number;
  walls: number[];
  start: number;
  exit: number;
  shortest: number;
};

/** Sort with adjacent swaps under a budget. */
export type SwapChallenge = Lesson & {
  kind: "swaps";
  topic: "algo";
  values: number[];
  inversions: number;
  budget: number;
};

/** Serve requests through a small cache and evict the least recently used key. */
export type LruChallenge = Lesson & {
  kind: "lru";
  topic: "system";
  capacity: number;
  requests: string[];
  stumbles: number;
};

export type Challenge =
  | Mcq
  | StackChallenge
  | FloodChallenge
  | ComplexityChallenge
  | BoxChallenge
  | LatencyChallenge
  | PipelineChallenge
  | ContextChallenge
  | ModelChallenge
  | PointerChallenge
  | BinaryChallenge
  | BracketChallenge
  | MazeChallenge
  | SwapChallenge
  | LruChallenge;

export type ChallengeKind = Challenge["kind"];

export type MiniGameKind = "pointers" | "bsearch" | "brackets" | "maze" | "swaps" | "lru";

export type Lifelines = {
  hint: number;
  time: number;
  senior: number;
};

export type Facing = "up" | "down" | "left" | "right";

export type DuelState = {
  enemyHearts: number;
  enemyMax: number;
  /** The shield is still ready to block a miss in this duel. */
  shield: boolean;
  misses: number;
  hits: number;
  /** Boss seats already asked, so the throne mixes algorithms, systems, and craft. */
  seats: Topic[];
};

export type Run = {
  id: string;
  bloodline: number;
  /** The next node to fight. Equal to the route length once the throne falls. */
  nodeIndex: number;
  hearts: number;
  maxHearts: number;
  lifelines: Lifelines;
  /** Gold earned during this climb. It is already in the purse. */
  gold: number;
  usedIds: string[];
  chests: string[];
  pos: { x: number; y: number; facing: Facing } | null;
  duel: DuelState | null;
  answers: number;
  correct: number;
};

export type Save = {
  version: 2;
  gold: number;
  gear: GearTiers;
  satchel: Satchel;
  /** Highest Bloodline that can be climbed. */
  unlocked: number;
  /** The Bloodline the selector opens on. */
  lastBloodline: number;
  run: Run | null;
  secrets: EggId[];
  /** Every answer given, across every climb. */
  answers: number;
  codex: CodexEntry[];
  /** Challenge ids from the previous climb, avoided in the next. */
  lastSeen: string[];
  npcVisits: Partial<Record<NpcId, number>>;
  seen: { prologue: boolean; controls: boolean };
  stats: { climbs: number; thrones: number; best: number; earned: number };
};
