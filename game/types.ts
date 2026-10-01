export type Bloodline = 1 | 2 | 3;

export type Role = "algo" | "system" | "craft" | "puzzle" | "specialist" | "boss";

export type Topic = "algo" | "system" | "craft" | "specialist";

export type Gear = {
  armor: boolean;
  shield: boolean;
  codexLens: boolean;
  hourglass: boolean;
  mentorSeal: boolean;
};

export type CodexEntry = {
  id: string;
  prompt: string;
  reveal: string;
  why: string;
  principle: string;
  topic: Topic | "boss";
  bloodline: Bloodline;
  at: number;
};

export type Save = {
  version: 1;
  gold: number;
  gear: Gear;
  unlocked: Bloodline;
  codex: CodexEntry[];
  lastSeen: string[];
};

export type Mcq = {
  kind: "mcq";
  id: string;
  topic: Topic | "boss";
  seat?: Topic;
  bloodline: Bloodline;
  prompt: string;
  options: string[];
  answer: number;
  hint: string;
  senior: string;
  principle: string;
  why: string;
  reveal: string;
};

export type StackChallenge = {
  kind: "stack";
  id: string;
  topic: "algo";
  bloodline: Bloodline;
  structure: "stack" | "queue";
  prompt: string;
  ops: { op: "push" | "pop"; value?: number }[];
  answer: number[];
  hint: string;
  senior: string;
  principle: string;
  why: string;
  reveal: string;
};

export type FloodChallenge = {
  kind: "flood";
  id: string;
  topic: "algo";
  bloodline: Bloodline;
  prompt: string;
  cols: number;
  rows: number;
  walls: number[];
  start: number;
  order: number[];
  hint: string;
  senior: string;
  principle: string;
  why: string;
  reveal: string;
};

export type Bucket = "O(1)" | "O(n)" | "O(n²)";

export type ComplexityChallenge = {
  kind: "complexity";
  id: string;
  topic: "algo";
  bloodline: Bloodline;
  prompt: string;
  snippets: { id: string; code: string; bucket: Bucket }[];
  hint: string;
  senior: string;
  principle: string;
  why: string;
  reveal: string;
};

export type BoxChallenge = {
  kind: "box";
  id: string;
  topic: "system";
  bloodline: Bloodline;
  prompt: string;
  cards: { id: string; label: string; detail: string }[];
  answer: string;
  hint: string;
  senior: string;
  principle: string;
  why: string;
  reveal: string;
};

export type LatencyChallenge = {
  kind: "latency";
  id: string;
  topic: "specialist";
  bloodline: Bloodline;
  prompt: string;
  items: { id: string; label: string; onPath: boolean }[];
  hint: string;
  senior: string;
  principle: string;
  why: string;
  reveal: string;
};

export type PipelineChallenge = {
  kind: "pipeline";
  id: string;
  topic: "specialist";
  bloodline: Bloodline;
  prompt: string;
  stages: string[];
  hint: string;
  senior: string;
  principle: string;
  why: string;
  reveal: string;
};

export type ContextChallenge = {
  kind: "context";
  id: string;
  topic: "specialist";
  bloodline: Bloodline;
  prompt: string;
  groups: string[];
  items: { id: string; label: string; group: string }[];
  hint: string;
  senior: string;
  principle: string;
  why: string;
  reveal: string;
};

export type ModelChallenge = {
  kind: "model";
  id: string;
  topic: "specialist";
  bloodline: Bloodline;
  prompt: string;
  options: string[];
  answer: number;
  hint: string;
  senior: string;
  principle: string;
  why: string;
  reveal: string;
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
  | ModelChallenge;

export type Lifelines = {
  hint: number;
  time: number;
  senior: number;
};

export type Run = {
  bloodline: Bloodline;
  nodeIndex: number;
  playerHearts: number;
  playerMax: number;
  enemyHearts: number;
  enemyMax: number;
  gold: number;
  lifelines: Lifelines;
  shieldLeft: boolean;
  usedIds: string[];
  challenge: Challenge | null;
};
