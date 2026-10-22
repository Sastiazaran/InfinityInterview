import type { NodeId } from "../contracts";
import { wholeLevel } from "../balance";
import { generatePuzzle } from "../content/challenges";
import { mulberry32, pick, shuffle, type Rng } from "../rng";
import type { Challenge, ChallengeKind, Mcq, PathId } from "../types";
import { PATHS } from "./index";
import type { PathDef, PathPuzzle, PathQuestion } from "./types";

export type PathInput = {
  path: PathId;
  level: number;
  node: NodeId;
  /** A single seat to stay on, or omitted for the mixed climb. */
  track?: string | null;
  /** Challenges already asked in this duel. */
  asked: number;
  usedIds: string[];
  /** Ids from the previous climb, avoided while fresh content remains. */
  avoid: string[];
  salt: number;
};

/** Authored puzzles shown on a puzzle-only room, against generated ones. */
const AUTHORED_IN_PUZZLE_ROOM = 0.35;

/** The order levels are searched: this level, the one below, the one above, then the rest. */
export function levelOrder(level: number, count: number): number[] {
  const order = [level, level - 1, level + 1];
  for (let distance = 2; distance < count; distance++) order.push(level - distance, level + distance);
  return order.filter((value, index) => value >= 1 && value <= count && order.indexOf(value) === index);
}

/** Seats a guardian asks from first. A focused track stays on that seat; the throne walks the mix. */
export function seatsFor(def: PathDef, node: NodeId, asked: number, track?: string | null): string[] {
  if (track && Object.prototype.hasOwnProperty.call(def.seats, track)) return [track];
  const seats = def.rooms[node].seats;
  if (node !== "throne" || seats.length === 0) return seats;
  return [seats[asked % seats.length]];
}

type Pickable = { id: string; level: number; seat: string };

/**
 * Picks unused content at the nearest level, preferring the room's seats and content not seen
 * last climb. Returns null only when every item has been used this climb.
 */
export function chooseFrom<T extends Pickable>(
  items: readonly T[],
  level: number,
  seats: readonly string[],
  used: Set<string>,
  avoid: Set<string>,
  rng: Rng,
  levels: number,
): T | null {
  const near = levelOrder(level, levels);
  for (const strict of [true, false]) {
    const order = strict ? near.slice(0, 3) : near;
    for (const at of order) {
      const fresh = items.filter((item) => item.level === at && !used.has(item.id) && (!strict || !avoid.has(item.id)));
      const seated = fresh.filter((item) => seats.includes(item.seat));
      if (seated.length) return pick(rng, seated);
      if (fresh.length) return pick(rng, fresh);
    }
  }
  return null;
}

export function presentQuestion(question: PathQuestion, path: PathId, level: number, rng: Rng): Mcq {
  const order = shuffle(rng, question.options.map((_, index) => index));
  return {
    kind: "mcq",
    id: question.id,
    topic: path,
    bloodline: level,
    prompt: question.prompt,
    options: order.map((index) => question.options[index]),
    answer: order.indexOf(0),
    hint: question.hint,
    senior: question.senior,
    principle: question.principle,
    why: question.why,
    reveal: question.reveal ?? question.options[0],
  };
}

export function presentPuzzle(puzzle: PathPuzzle, path: PathId, level: number, rng: Rng): Challenge {
  const base = { ...puzzle, topic: path, bloodline: level, par: puzzle.par ?? 55 };
  switch (base.kind) {
    case "context":
      return { ...base, items: shuffle(rng, base.items) };
    case "latency":
      return { ...base, items: shuffle(rng, base.items) };
    case "box":
      return { ...base, cards: shuffle(rng, base.cards) };
    case "pipeline":
      return base;
  }
}

function generated(kinds: readonly ChallengeKind[], level: number, salt: number, used: Set<string>, rng: Rng) {
  return kinds.length ? generatePuzzle(pick(rng, kinds), level, salt, used) : null;
}

/** The next challenge in a duel on a topic path. Always returns something to ask. */
export function nextPathChallenge(input: PathInput): Challenge {
  const def = PATHS[input.path];
  const levels = Object.keys(def.levels).length;
  const level = Math.min(levels, wholeLevel(input.level));
  const room = def.rooms[input.node];
  const rng = mulberry32(input.salt);
  const used = new Set(input.usedIds);
  const avoid = new Set(input.avoid);
  const seats = seatsFor(def, input.node, input.asked, input.track);
  const authored = () => chooseFrom(def.puzzles, level, seats, used, avoid, rng, levels);
  const question = () => chooseFrom(def.questions, level, seats, used, avoid, rng, levels);
  const focused = Boolean(input.track && Object.prototype.hasOwnProperty.call(def.seats, input.track));

  if (room.puzzleOnly && room.puzzles.length && !focused) {
    const own = chooseFrom(
      def.puzzles.filter((item) => room.seats.includes(item.seat)),
      level,
      seats,
      used,
      avoid,
      rng,
      levels,
    );
    if (own && rng() < AUTHORED_IN_PUZZLE_ROOM) return presentPuzzle(own, input.path, level, rng);
    const offset = ((level - 1) * 2) % room.puzzles.length;
    const kind = room.puzzles[(offset + input.asked) % room.puzzles.length];
    return generatePuzzle(kind, level, input.salt, used);
  }

  const onboarding = level === 1 && input.asked === 0;
  if (!onboarding && rng() < def.mix) {
    const puzzle = authored();
    const useAuthored = puzzle && (room.puzzles.length === 0 || rng() < 0.5);
    if (useAuthored) return presentPuzzle(puzzle, input.path, level, rng);
    const made = generated(room.puzzles, level, input.salt, used, rng);
    if (made) return made;
  }

  const mcq = question();
  if (mcq) return presentQuestion(mcq, input.path, level, rng);
  const puzzle = authored();
  if (puzzle) return presentPuzzle(puzzle, input.path, level, rng);
  const made = generated(room.puzzles, level, input.salt, used, rng);
  if (made) return made;
  const atLevel = def.questions.filter((item) => item.level === level);
  return presentQuestion(pick(rng, atLevel.length ? atLevel : def.questions), input.path, level, rng);
}
