import { puzzleScale, wholeBloodline } from "../balance";
import { int, mulberry32, pick, shuffle } from "../rng";
import type {
  BinaryChallenge,
  BracketChallenge,
  LruChallenge,
  MazeChallenge,
  PointerChallenge,
  SwapChallenge,
} from "../types";

// ——— Pointer Dash ———

export function pointerWalk(values: number[], target: number): { steps: number; pair: [number, number] } | null {
  let left = 0;
  let right = values.length - 1;
  let steps = 0;
  while (left < right) {
    const sum = values[left] + values[right];
    if (sum === target) return { steps, pair: [left, right] };
    if (sum < target) left++;
    else right--;
    steps++;
  }
  return null;
}

export function makePointers(bloodline: number, salt: number): PointerChallenge {
  const n = wholeBloodline(bloodline);
  const size = puzzleScale(n).pointers;
  const rng = mulberry32(salt + 101);
  let values: number[] = [];
  let target = 0;
  let walk: { steps: number; pair: [number, number] } | null = null;
  for (let attempt = 0; attempt < 80 && !walk; attempt++) {
    values = shuffle(rng, range(1, size * 4))
      .slice(0, size)
      .sort((a, b) => a - b);
    const sums = new Map<number, number>();
    for (let i = 0; i < size; i++) {
      for (let j = i + 1; j < size; j++) sums.set(values[i] + values[j], (sums.get(values[i] + values[j]) ?? 0) + 1);
    }
    const unique = [...sums.entries()].filter(([, count]) => count === 1).map(([sum]) => sum);
    const good = shuffle(rng, unique).find((sum) => {
      const result = pointerWalk(values, sum);
      return result && result.steps >= Math.max(2, Math.floor(size / 2));
    });
    if (good !== undefined) {
      target = good;
      walk = pointerWalk(values, good);
    }
  }
  if (!walk) {
    values = range(1, size).map((value) => value * 2);
    target = values[1] + values[size - 2];
    walk = pointerWalk(values, target)!;
  }
  const [i, j] = walk.pair;
  return {
    kind: "pointers",
    id: `pointers-${n}-${salt}`,
    topic: "algo",
    bloodline: n,
    prompt: `Pointer Dash. The row is sorted. Walk the two pointers inward until their sum is ${target}.`,
    values,
    target,
    pair: walk.pair,
    steps: walk.steps,
    stumbles: puzzleScale(n).stumbles,
    hint: "Sum too small: only the left pointer can make it bigger. Too big: only the right one can shrink it.",
    senior: "Compare the sum to the target before every move. Equal means stop and lock it in.",
    principle: "Two pointers on a sorted array",
    why: "Two-sum on sorted input in O(n) without a hash map is a classic warm-up, and the reasoning carries to many window problems.",
    reveal: `Positions ${i + 1} and ${j + 1}: ${values[i]} + ${values[j]} = ${target}, reached in ${walk.steps} moves.`,
    par: 25 + walk.steps * 4,
  };
}

// ——— Binary Search Hunt ———

export function makeBinary(bloodline: number, salt: number): BinaryChallenge {
  const n = wholeBloodline(bloodline);
  const bits = puzzleScale(n).binaryBits;
  const rng = mulberry32(salt + 202);
  const max = 2 ** bits - 1;
  const secret = int(rng, 1, max);
  const guesses = bits + (n === 1 ? 1 : 0);
  return {
    kind: "bsearch",
    id: `bsearch-${n}-${salt}`,
    topic: "algo",
    bloodline: n,
    prompt: `Binary Search Hunt. A number hides between 1 and ${max}. Find it in ${guesses} guesses or fewer.`,
    max,
    secret,
    guesses,
    hint: "Guess the middle of what is left. Each answer throws away half.",
    senior: "Take (low + high) / 2, rounded down, every time. That never needs more than the guesses you have.",
    principle: "Binary search halves the range",
    why: `log2 of ${max + 1} is ${bits}: that is why ${bits} probes are always enough when every probe is a midpoint.`,
    reveal: `The number was ${secret}. Midpoint guesses find any number up to ${max} in ${bits} probes.`,
    par: 25 + guesses * 6,
  };
}

// ——— Bracket Forge ———

export const CLOSER: Record<string, string> = { "(": ")", "[": "]", "{": "}", "<": ">" };
export const CLOSERS = [")", "]", "}", ">"] as const;
const OPENERS = Object.keys(CLOSER);

export function makeBrackets(bloodline: number, salt: number): BracketChallenge {
  const n = wholeBloodline(bloodline);
  const scale = puzzleScale(n);
  const rng = mulberry32(salt + 303);
  const open = Array.from({ length: scale.brackets }, () => pick(rng, OPENERS));
  const tokens: string[] = [];
  const groupsAt = new Map<number, number>();
  for (let g = 0; g < scale.bracketPairs; g++) {
    const gap = int(rng, 1, open.length);
    groupsAt.set(gap, (groupsAt.get(gap) ?? 0) + 1);
  }
  open.forEach((opener, index) => {
    tokens.push(opener);
    const groups = groupsAt.get(index + 1) ?? 0;
    for (let g = 0; g < groups; g++) {
      const outer = pick(rng, OPENERS);
      if (n >= 5 && rng() < 0.5) {
        const inner = pick(rng, OPENERS);
        tokens.push(outer, inner, CLOSER[inner], CLOSER[outer]);
      } else {
        tokens.push(outer, CLOSER[outer]);
      }
    }
  });
  const answer = [...open].reverse().map((opener) => CLOSER[opener]);
  return {
    kind: "brackets",
    id: `brackets-${n}-${salt}`,
    topic: "algo",
    bloodline: n,
    prompt: "Bracket Forge. Close everything still open, newest first. Pairs already closed stay closed.",
    tokens,
    answer,
    hint: "Read from the right. The last opener without a partner is the first one you close.",
    senior: "Push every opener on a stack, pop when you meet its closer. Whatever is left closes in pop order.",
    principle: "Matching brackets with a stack",
    why: "Valid parentheses is the stack problem interviewers reach for first, and it is how parsers check nesting.",
    reveal: `Close with ${answer.join(" ")}.`,
    par: 20 + answer.length * 4 + tokens.length,
  };
}

/** Index of the opener that must be closed next, after `typed` closers. */
export function bracketTop(tokens: string[], typed: number): number {
  const stack: number[] = [];
  tokens.forEach((token, index) => {
    if (CLOSER[token]) stack.push(index);
    else stack.pop();
  });
  return stack[stack.length - 1 - typed] ?? -1;
}

// ——— Maze Run ———

export function mazeDistances(cols: number, rows: number, walls: Set<number>, from: number): number[] {
  const dist = new Array<number>(cols * rows).fill(-1);
  dist[from] = 0;
  const queue = [from];
  while (queue.length) {
    const cur = queue.shift()!;
    for (const next of neighbors(cols, rows, cur)) {
      if (walls.has(next) || dist[next] >= 0) continue;
      dist[next] = dist[cur] + 1;
      queue.push(next);
    }
  }
  return dist;
}

export function neighbors(cols: number, rows: number, cell: number): number[] {
  const r = Math.floor(cell / cols);
  const c = cell % cols;
  const out: number[] = [];
  if (r > 0) out.push(cell - cols);
  if (c < cols - 1) out.push(cell + 1);
  if (r < rows - 1) out.push(cell + cols);
  if (c > 0) out.push(cell - 1);
  return out;
}

export function makeMaze(bloodline: number, salt: number): MazeChallenge {
  const n = wholeBloodline(bloodline);
  const scale = puzzleScale(n);
  const rng = mulberry32(salt + 404);
  const cw = scale.mazeCols;
  const ch = scale.mazeRows;
  const cols = cw * 2 + 1;
  const rows = ch * 2 + 1;
  const open = new Set<number>();
  const at = (x: number, y: number) => y * cols + x;
  const visited = new Set<number>();
  const stack: [number, number][] = [[0, 0]];
  visited.add(0);
  open.add(at(1, 1));
  while (stack.length) {
    const [x, y] = stack[stack.length - 1];
    const options = (
      [
        [x, y - 1],
        [x + 1, y],
        [x, y + 1],
        [x - 1, y],
      ] as [number, number][]
    ).filter(([nx, ny]) => nx >= 0 && ny >= 0 && nx < cw && ny < ch && !visited.has(ny * cw + nx));
    if (!options.length) {
      stack.pop();
      continue;
    }
    const [nx, ny] = pick(rng, options);
    visited.add(ny * cw + nx);
    open.add(at(nx * 2 + 1, ny * 2 + 1));
    open.add(at(x + nx + 1, y + ny + 1));
    stack.push([nx, ny]);
  }
  const candidates: number[] = [];
  for (let y = 1; y < rows - 1; y++) {
    for (let x = 1; x < cols - 1; x++) {
      const cell = at(x, y);
      if (open.has(cell)) continue;
      const horizontal = open.has(at(x - 1, y)) && open.has(at(x + 1, y));
      const vertical = open.has(at(x, y - 1)) && open.has(at(x, y + 1));
      if (horizontal !== vertical) candidates.push(cell);
    }
  }
  for (const cell of shuffle(rng, candidates).slice(0, scale.mazeLoops)) open.add(cell);
  const walls: number[] = [];
  for (let cell = 0; cell < cols * rows; cell++) if (!open.has(cell)) walls.push(cell);
  const start = at(1, 1);
  const exit = at(cols - 2, rows - 2);
  const shortest = mazeDistances(cols, rows, new Set(walls), start)[exit];
  return {
    kind: "maze",
    id: `maze-${n}-${salt}`,
    topic: "algo",
    bloodline: n,
    prompt: `Maze Run. Walk from the gold start to the exit in exactly ${shortest} steps, the shortest path. No step to spare.`,
    cols,
    rows,
    walls,
    start,
    exit,
    shortest,
    hint: "Look ahead before you walk. Loops make some routes longer than others.",
    senior: "Breadth-first search explores every cell one step out, then two, so the first time it reaches the exit is the shortest path.",
    principle: "BFS finds shortest paths in unweighted grids",
    why: "Shortest path in a grid is BFS, not DFS. DFS finds a path; BFS finds the shortest one.",
    reveal: `The shortest route is ${shortest} steps. BFS reaches the exit at distance ${shortest} before any longer route.`,
    par: 20 + Math.round(shortest * 1.6),
  };
}

// ——— Swap Sort ———

export function inversionCount(values: number[]): number {
  let count = 0;
  for (let i = 0; i < values.length; i++) {
    for (let j = i + 1; j < values.length; j++) if (values[i] > values[j]) count++;
  }
  return count;
}

export function makeSwaps(bloodline: number, salt: number): SwapChallenge {
  const n = wholeBloodline(bloodline);
  const scale = puzzleScale(n);
  const rng = mulberry32(salt + 505);
  const size = scale.swaps;
  const sorted = shuffle(rng, range(1, size * 3))
    .slice(0, size)
    .sort((a, b) => a - b);
  const shakes = Math.min(18, 3 + size + Math.floor(n / 2));
  let values = [...sorted];
  for (let attempt = 0; attempt < 40; attempt++) {
    values = [...sorted];
    for (let s = 0; s < shakes; s++) {
      const i = int(rng, 0, size - 2);
      [values[i], values[i + 1]] = [values[i + 1], values[i]];
    }
    if (inversionCount(values) >= Math.max(3, Math.floor(shakes * 0.6))) break;
  }
  if (inversionCount(values) === 0) values = [...sorted].reverse();
  const inversions = inversionCount(values);
  return {
    kind: "swaps",
    id: `swaps-${n}-${salt}`,
    topic: "algo",
    bloodline: n,
    prompt: `Swap Sort. Sort the row from small to large by swapping neighbors. You have ${inversions + scale.swapSlack} swaps.`,
    values,
    inversions,
    budget: inversions + scale.swapSlack,
    hint: "Only swap a pair that is out of order. Every such swap fixes exactly one inversion.",
    senior: `There are ${inversions} out-of-order pairs. Bubble the largest misplaced value right, one swap at a time.`,
    principle: "Adjacent swaps equal inversions",
    why: "Bubble sort makes exactly one swap per inversion, which is why it is O(n²) on reversed input and fast on nearly sorted input.",
    reveal: `${inversions} inversions, so ${inversions} adjacent swaps is the minimum.`,
    par: 20 + inversions * 4,
  };
}

// ——— LRU Gatekeeper ———

export type LruStep = {
  key: string;
  hit: boolean;
  /** Slot holding the least recently used key when the cache is full on a miss. */
  evict: number | null;
  /** Fixed slot positions before this request. Empty slots are "". */
  before: string[];
  after: string[];
  /** Least recently used slot before this request, when every slot is filled. */
  lru: number | null;
};

export function lruTimeline(capacity: number, requests: string[]): LruStep[] {
  const slots: string[] = new Array(capacity).fill("");
  const lastUsed = new Map<string, number>();
  const steps: LruStep[] = [];
  requests.forEach((key, time) => {
    const before = [...slots];
    const full = slots.every(Boolean);
    let lru: number | null = null;
    if (full) {
      let oldest = Infinity;
      slots.forEach((slotKey, index) => {
        const used = lastUsed.get(slotKey) ?? -1;
        if (used < oldest) {
          oldest = used;
          lru = index;
        }
      });
    }
    const hit = slots.includes(key);
    let evict: number | null = null;
    if (!hit) {
      const free = slots.indexOf("");
      if (free >= 0) slots[free] = key;
      else {
        evict = lru;
        slots[lru!] = key;
      }
    }
    lastUsed.set(key, time);
    steps.push({ key, hit, evict, before, after: [...slots], lru });
  });
  return steps;
}

export function makeLru(bloodline: number, salt: number): LruChallenge {
  const n = wholeBloodline(bloodline);
  const scale = puzzleScale(n);
  const rng = mulberry32(salt + 606);
  const capacity = scale.lruCapacity;
  const letters = "ABCDEFGHJK".slice(0, capacity + 2).split("");
  const length = 7 + capacity * 2;
  let requests: string[] = [];
  for (let attempt = 0; attempt < 60; attempt++) {
    requests = [];
    for (let i = 0; i < length; i++) {
      const recent = requests.slice(-capacity);
      requests.push(recent.length && rng() < 0.35 ? pick(rng, recent) : pick(rng, letters));
    }
    const timeline = lruTimeline(capacity, requests);
    const evictions = timeline.filter((step) => step.evict !== null).length;
    const hits = timeline.filter((step) => step.hit).length;
    if (evictions >= 3 && hits >= 2) break;
  }
  const timeline = lruTimeline(capacity, requests);
  const evictions = timeline.filter((step) => step.evict !== null).length;
  return {
    kind: "lru",
    id: `lru-${n}-${salt}`,
    topic: "system",
    bloodline: n,
    prompt: `LRU Gatekeeper. The cache holds ${capacity}. Serve each request: a hit or a free slot passes, a full cache must evict the least recently used key.`,
    capacity,
    requests,
    stumbles: scale.stumbles,
    hint: "Recently used means touched by any request, a hit counts too. Look back through the log.",
    senior: "Scan the log backwards. The cached key you reach last is the least recently used.",
    principle: "Least-recently-used eviction",
    why: "LRU cache design is a favorite: a hash map for lookup plus a recency list, both O(1).",
    reveal: `${requests.length} requests, ${evictions} evictions. Each one removed the key untouched for longest.`,
    par: 20 + requests.length * 4,
  };
}

function range(from: number, to: number): number[] {
  return Array.from({ length: to - from + 1 }, (_, index) => from + index);
}
