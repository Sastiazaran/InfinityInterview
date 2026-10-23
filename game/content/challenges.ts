import type { NodeId } from "../contracts";
import { baseTier, contentTier, puzzleScale, wholeBloodline } from "../balance";
import { int, mulberry32, pick, shuffle, type Rng } from "../rng";
import { specialistTier } from "../route";
import type {
  BoxChallenge,
  Bucket,
  Challenge,
  ChallengeKind,
  ComplexityChallenge,
  ContextChallenge,
  FloodChallenge,
  LatencyChallenge,
  Mcq,
  ModelChallenge,
  PipelineChallenge,
  Role,
  StackChallenge,
  Tier,
  Topic,
} from "../types";
import { MCQS } from "./mcq";
import { makeBinary, makeBrackets, makeLru, makeMaze, makePointers, makeSwaps } from "./minigames";

export function bfsOrder(cols: number, rows: number, walls: number[], start: number): number[] {
  const wall = new Set(walls);
  const seen = new Set<number>([start]);
  const queue = [start];
  const order: number[] = [];
  while (queue.length) {
    const cur = queue.shift()!;
    order.push(cur);
    const r = Math.floor(cur / cols);
    const c = cur % cols;
    const neigh: number[] = [];
    if (r > 0) neigh.push(cur - cols);
    if (c < cols - 1) neigh.push(cur + 1);
    if (r < rows - 1) neigh.push(cur + cols);
    if (c > 0) neigh.push(cur - 1);
    for (const n of neigh) {
      if (wall.has(n) || seen.has(n)) continue;
      seen.add(n);
      queue.push(n);
    }
  }
  return order;
}

function makeStack(bloodline: number, salt: number): StackChallenge {
  const n = wholeBloodline(bloodline);
  const rng = mulberry32(salt);
  const structure: "stack" | "queue" = rng() < Math.min(0.6, 0.18 * (n - 1)) ? "queue" : "stack";
  const steps = puzzleScale(n).stackSteps;
  const data: number[] = [];
  const ops: StackChallenge["ops"] = [];
  for (let i = 0; i < steps; i++) {
    const pop = data.length > 0 && rng() < (n === 1 ? 0.35 : 0.45);
    if (pop) {
      if (structure === "stack") data.pop();
      else data.shift();
      ops.push({ op: "pop" });
    } else {
      const value = 1 + Math.floor(rng() * 9);
      data.push(value);
      ops.push({ op: "push", value });
    }
  }
  if (data.length === 0) {
    const value = 1 + Math.floor(rng() * 9);
    data.push(value);
    ops.push({ op: "push", value });
  }
  const verbIn = structure === "stack" ? "PUSH" : "ENQUEUE";
  const verbOut = structure === "stack" ? "POP" : "DEQUEUE";
  const script = ops.map((op) => (op.op === "push" ? `${verbIn} ${op.value}` : verbOut)).join(", ");
  const answer = [...data];
  return {
    kind: "stack",
    id: `stack-${n}-${salt}`,
    topic: "algo",
    bloodline: n,
    structure,
    prompt: `A ${structure} starts empty. ${script}. Type what remains, ${
      structure === "stack" ? "bottom first." : "front first."
    }`,
    ops,
    answer,
    hint:
      structure === "stack"
        ? "Pop removes the newest value, not the oldest."
        : "Dequeue removes the oldest value, the front.",
    senior:
      structure === "stack"
        ? "Write the values vertically. Push adds to the top. Pop takes the top."
        : "Keep a line. Enqueue joins the back. Dequeue leaves from the front.",
    principle: structure === "stack" ? "Stack (LIFO)" : "Queue (FIFO)",
    why: "Tracing by hand is the skill underneath every later question about these structures.",
    reveal: `Remaining, ${structure === "stack" ? "bottom to top" : "front to back"}: ${answer.join(", ")}.`,
    par: 20 + ops.length * 4,
  };
}

function makeFlood(bloodline: number, salt: number): FloodChallenge {
  const n = wholeBloodline(bloodline);
  const rng = mulberry32(salt + 17);
  const scale = puzzleScale(n);
  const cols = scale.floodSide;
  const rows = scale.floodSide;
  const start = n >= 5 ? int(rng, 0, cols * rows - 1) : 0;
  const walls: number[] = [];
  let guard = 0;
  while (walls.length < scale.floodWalls && guard < 40) {
    guard++;
    const cell = Math.floor(rng() * cols * rows);
    if (cell !== start && !walls.includes(cell)) walls.push(cell);
  }
  let order = bfsOrder(cols, rows, walls, start);
  if (order.length < Math.max(4, cols * rows - scale.floodWalls - 2)) {
    walls.length = 0;
    order = bfsOrder(cols, rows, walls, start);
  }
  return {
    kind: "flood",
    id: `flood-${n}-${salt}`,
    topic: "algo",
    bloodline: n,
    prompt:
      "Mark every open cell in breadth-first order from S. From each cell, neighbors are tried up, then right, then down, then left.",
    cols,
    rows,
    walls,
    start,
    order,
    hint: "Finish a whole ring of distance before you step further out.",
    senior: `The first mark is S. The next marks are its open neighbors in the order up, right, down, left. There are ${order.length} cells to visit.`,
    principle: "BFS visit order",
    why: "If you can predict the order, you understand the queue inside the search.",
    reveal: `Visit ${order.length} open cells. The first is the start, then neighbors in the order up, right, down, left.`,
    par: 20 + order.length * 3,
  };
}

const SNIPPETS: { code: string; bucket: Bucket; tier: Tier }[] = [
  { code: "return table[key]", bucket: "O(1)", tier: 1 },
  { code: "return items[items.length - 1]", bucket: "O(1)", tier: 1 },
  { code: "seen.has(id)", bucket: "O(1)", tier: 1 },
  { code: "let s = 0\nfor (const x of items) s += x", bucket: "O(n)", tier: 1 },
  { code: "for (const x of items)\n  if (x === target) return true", bucket: "O(n)", tier: 1 },
  { code: "for (const a of items)\n  for (const b of items)\n    touch(a, b)", bucket: "O(n²)", tier: 1 },
  { code: "while (i < n && j < n) {\n  if (a[i] < b[j]) i++\n  else j++\n}", bucket: "O(n)", tier: 2 },
  { code: "for (let i = 0; i < n; i++)\n  for (let j = 0; j < 3; j++)\n    mark(i)", bucket: "O(n)", tier: 2 },
  { code: "for (let i = 0; i < n; i++)\n  for (let j = i + 1; j < n; j++)\n    pair(i, j)", bucket: "O(n²)", tier: 2 },
  { code: "return node.next === null", bucket: "O(1)", tier: 3 },
  { code: "for (const cell of cells) paint(cell)", bucket: "O(n)", tier: 3 },
  {
    code: "for (const word of words)\n  for (const other of words)\n    if (word !== other) score(word, other)",
    bucket: "O(n²)",
    tier: 3,
  },
];

function makeComplexity(bloodline: number, salt: number): ComplexityChallenge {
  const n = wholeBloodline(bloodline);
  const tier = baseTier(n);
  const rng = mulberry32(salt + 91);
  const buckets: Bucket[] = ["O(1)", "O(n)", "O(n²)"];
  if (puzzleScale(n).snippets > 3) buckets.push(pick(rng, buckets));
  const taken = new Set<string>();
  const snippets = buckets.map((bucket, index) => {
    const pool = SNIPPETS.filter((s) => s.bucket === bucket && s.tier <= tier && !taken.has(s.code));
    const choice = pool.length ? pick(rng, pool) : SNIPPETS.find((s) => s.bucket === bucket)!;
    taken.add(choice.code);
    return { id: `${index}-${bucket}`, code: choice.code, bucket };
  });
  const mixed = shuffle(rng, snippets);
  return {
    kind: "complexity",
    id: `cx-${n}-${salt}`,
    topic: "algo",
    bloodline: n,
    prompt: "Place each snippet in its bucket. A loop of constant length does not make the whole thing quadratic.",
    snippets: mixed,
    hint: "Count how many times the innermost work runs as n grows.",
    senior:
      "A direct lookup is constant. One walk over the input is linear. Pairing every item with every item is quadratic.",
    principle: "Big-O from the loops",
    why: "Interviewers ask you to read a few lines and say the cost before you optimize anything.",
    reveal: mixed.map((s) => `${s.bucket}: ${s.code.split("\n")[0]}`).join(" · "),
    par: 20 + mixed.length * 10,
  };
}

const BOXES: Omit<BoxChallenge, "id" | "bloodline">[] = [
  {
    kind: "box",
    topic: "system",
    prompt: "A retry must not charge the coin twice. Which piece belongs in the box?",
    cards: [
      { id: "idem", label: "Idempotency set", detail: "Remember the attempt. The second call finds it." },
      { id: "cache", label: "Page cache", detail: "Remember a rendered page for a while." },
      { id: "queue", label: "Work queue", detail: "Hold jobs for a worker." },
      { id: "geo", label: "Geohash", detail: "Bucket nearby places." },
    ],
    answer: "idem",
    hint: "The second request has to be recognizable as the first attempt.",
    senior: "Store the attempt key before you charge. A page cache does not know a payment.",
    principle: "Idempotency key",
    why: "The box is a system, and the thing inside it is an algorithm: membership of the attempt.",
    reveal: "An idempotency set. The retry looks up the attempt and does not charge again.",
  },
  {
    kind: "box",
    topic: "system",
    prompt: "Find people within a kilometer without scanning the realm. What goes in the box?",
    cards: [
      { id: "geo", label: "Geohash", detail: "Nearby points share a cell, or a neighbor cell." },
      { id: "queue", label: "Work queue", detail: "Line of jobs." },
      { id: "lock", label: "Row lock", detail: "One writer at a time." },
      { id: "cache", label: "Page cache", detail: "A remembered document." },
    ],
    answer: "geo",
    hint: "You need a spatial bucket, then a true distance check.",
    senior: "Geohash or a quadtree. A queue does not know where anyone stands.",
    principle: "Spatial index",
    why: "Nearby search is a geohash question. The product name is decoration.",
    reveal: "A geohash. Query the cell and its neighbors, then filter by real distance.",
  },
  {
    kind: "box",
    topic: "system",
    prompt: "Show the live top ten scores after every update. What goes in the box?",
    cards: [
      { id: "sorted", label: "Sorted set", detail: "Ordered by score. The top of the range is the board." },
      { id: "queue", label: "Queue", detail: "Oldest in, first out. No notion of 'best'." },
      { id: "cache", label: "Blob store", detail: "Holds large bytes." },
      { id: "geo", label: "Geohash", detail: "Buckets space, not rank." },
    ],
    answer: "sorted",
    hint: "You need order by score, updated in place.",
    senior: "A sorted set. Rank and the top slice are the operations.",
    principle: "Sorted set",
    why: "A leaderboard interview is won by naming the ordered structure.",
    reveal: "A sorted set keyed by score.",
  },
  {
    kind: "box",
    topic: "system",
    prompt: "The counter must survive a worker that crashes after it has read an event. What goes in the box?",
    cards: [
      { id: "ack", label: "Queue with an ack", detail: "The event returns if the worker dies before acknowledging." },
      { id: "cache", label: "Page cache", detail: "Forgets under pressure, and is not a log." },
      { id: "geo", label: "Geohash", detail: "Not a delivery guarantee." },
      { id: "lock", label: "UI lock", detail: "Stops a double click. Does not keep the event." },
    ],
    answer: "ack",
    hint: "If you might die before the count is durable, do not acknowledge yet.",
    senior: "A queue that redelivers until ack, plus an idempotent write so the second delivery does not double count.",
    principle: "At-least-once delivery",
    why: "Durability of a count is a delivery question. The ack is the algorithm's handshake.",
    reveal: "A queue that acks only after the count is durable. Make the write idempotent.",
  },
  {
    kind: "box",
    topic: "system",
    prompt: "Two guests must not take the last room. What goes in the box?",
    cards: [
      { id: "lock", label: "Conditional write", detail: "The update lands only if the room is still free." },
      { id: "cache", label: "Stale 'free' flag", detail: "Both guests can read free and both write." },
      { id: "queue", label: "Email queue", detail: "Sends mail. Does not hold the room." },
      { id: "geo", label: "Geohash", detail: "Finds nearby rooms. Does not reserve one." },
    ],
    answer: "lock",
    hint: "The check and the reservation have to be one step.",
    senior: "Compare-and-set. A cache of 'free' races.",
    principle: "Conditional write",
    why: "Inventory is a concurrency algorithm, not a screen.",
    reveal: "A conditional write: succeed only while the room is free.",
  },
  {
    kind: "box",
    topic: "system",
    prompt: "Cap a caller at 100 requests a minute. What goes in the box?",
    cards: [
      { id: "window", label: "Sliding window", detail: "Count their calls in the last minute. Old calls fall out." },
      { id: "geo", label: "Geohash", detail: "Where they are, not how often." },
      { id: "blob", label: "Blob store", detail: "Their files, not their rate." },
      { id: "sorted", label: "Leaderboard", detail: "Their rank, not their budget." },
    ],
    answer: "window",
    hint: "Time moves. The count of the last sixty seconds has to move with it.",
    senior: "A sliding window keyed by caller. A total that never resets is not a rate.",
    principle: "Sliding-window rate limit",
    why: "Rate limiting is the sliding-window algorithm with a product wrapped around it.",
    reveal: "A sliding window of that caller's recent requests.",
  },
];

function makeBox(bloodline: number, salt: number, used: Set<string>): BoxChallenge {
  const n = wholeBloodline(bloodline);
  const rng = mulberry32(salt + 13);
  const tier = contentTier(n, rng);
  const start = (tier - 1) * 2;
  const tiered = BOXES.slice(start, start + 2);
  const fresh = BOXES.filter((box) => !used.has(boxId(box)));
  const bag = tiered.filter((box) => !used.has(boxId(box)));
  const choice = bag.length ? pick(rng, bag) : fresh.length ? pick(rng, fresh) : pick(rng, tiered);
  return { ...choice, cards: shuffle(rng, choice.cards), id: boxId(choice), bloodline: n, par: 45 };
}

function boxId(box: Omit<BoxChallenge, "id" | "bloodline">): string {
  return `box-${box.answer}`;
}

function makeLatency(n: number, salt: number): LatencyChallenge {
  const rng = mulberry32(salt + 7);
  return {
    kind: "latency",
    id: "lat-first-paint",
    topic: "specialist",
    bloodline: n,
    prompt: "Mark only what must block first paint. Leave the rest off the critical path.",
    items: shuffle(rng, [
      { id: "html", label: "The HTML document", onPath: true },
      { id: "css", label: "CSS for the first screen", onPath: true },
      { id: "font", label: "The font used in the title", onPath: true },
      { id: "video", label: "A marketing video below the fold", onPath: false },
      { id: "analytics", label: "An analytics beacon", onPath: false },
      { id: "chat", label: "A support chat widget", onPath: false },
    ]),
    hint: "First paint needs the document, the CSS that styles it, and the type in the title.",
    senior: "The video, the chat widget, and the analytics beacon can wait until after the first screen.",
    principle: "Critical rendering path",
    why: "Performance interviews ask you to refuse work that is not on the first screen.",
    reveal: "On the path: HTML, first-screen CSS, and the title font. Off it: the video, the chat widget, and analytics.",
    par: 50,
  };
}

function makePipeline(n: number): PipelineChallenge {
  return {
    kind: "pipeline",
    id: "pipe-delivery",
    topic: "specialist",
    bloodline: n,
    prompt: "Order the path a change should take. Production is last.",
    stages: ["Unit tests", "Build the image", "Deploy to staging", "Smoke-test staging", "Deploy to production"],
    hint: "Prove the change before you build an image you might ship. Prove staging before production.",
    senior: "Tests, then the image, then staging, then a smoke test, then production.",
    principle: "Pipeline order",
    why: "A delivery interview is often just this order, said without hesitation.",
    reveal: "Unit tests → image → staging → smoke test → production.",
    par: 50,
  };
}

function makeContext(n: number, salt: number): ContextChallenge {
  const rng = mulberry32(salt + 5);
  return {
    kind: "context",
    id: "ctx-billing-shipping",
    topic: "specialist",
    bloodline: n,
    prompt: "Two contexts. Billing means the payer's money. Shipping means the parcel. Sort each noun.",
    groups: ["Billing", "Shipping"],
    items: shuffle(rng, [
      { id: "invoice", label: "Invoice", group: "Billing" },
      { id: "charge", label: "Card charge", group: "Billing" },
      { id: "refund", label: "Refund", group: "Billing" },
      { id: "track", label: "Tracking number", group: "Shipping" },
      { id: "bin", label: "Warehouse bin", group: "Shipping" },
      { id: "weight", label: "Parcel weight", group: "Shipping" },
    ]),
    hint: "If the noun is about money leaving or returning, it is billing.",
    senior: "Invoice, charge, and refund are billing. Tracking, the bin, and weight are shipping.",
    principle: "Bounded context",
    why: "Sorting nouns is how you notice that one word is doing two jobs.",
    reveal: "Billing: invoice, charge, refund. Shipping: tracking number, warehouse bin, parcel weight.",
    par: 55,
  };
}

const MODELS: Omit<ModelChallenge, "id" | "kind" | "topic" | "bloodline">[] = [
  {
    prompt:
      "A model scores 99% on the rows it trained on and 61% on people it has never seen. What do you call that?",
    options: ["Overfitting", "Data leakage", "A healthy generalization", "Underfitting"],
    answer: 0,
    hint: "The gap between the study set and new people is the clue.",
    senior: "It memorized the training rows. That is overfitting, not leakage, unless the label was in the input.",
    principle: "Overfitting",
    why: "The train-versus-new gap is the ML question general interviews actually ask.",
    reveal: "Overfitting. High on the training rows, weak on people it has not seen.",
  },
  {
    prompt: "One input column is the label, renamed 'result_copy'. The score is perfect. What is wrong?",
    options: ["Data leakage", "Overfitting to a small font", "The model is too slow", "The test set is too honest"],
    answer: 0,
    hint: "The answer was handed to the model in the input.",
    senior: "Leakage. Drop the column. A perfect score with the label in the features is not a result.",
    principle: "Data leakage",
    why: "A perfect score is a prompt to look for the label hiding in the features.",
    reveal: "Data leakage. The column is the label.",
  },
];

function makeModel(n: number, salt: number, used: Set<string>): ModelChallenge {
  const rng = mulberry32(salt + 3);
  const fresh = MODELS.map((model, index) => ({ model, id: `model-${index}` })).filter((m) => !used.has(m.id));
  const choice = fresh.length ? pick(rng, fresh) : { model: MODELS[salt % MODELS.length], id: `model-${salt % MODELS.length}` };
  const order = shuffle(rng, choice.model.options.map((_, index) => index));
  return {
    kind: "model",
    id: choice.id,
    topic: "specialist",
    bloodline: n,
    ...choice.model,
    options: order.map((index) => choice.model.options[index]),
    answer: order.indexOf(choice.model.answer),
  };
}

/** Options are authored with the answer first, so they are always shuffled when asked. */
function present(mcq: Mcq, n: number, rng: Rng): Mcq {
  const order = shuffle(rng, mcq.options.map((_, index) => index));
  return {
    ...mcq,
    bloodline: n,
    options: order.map((index) => mcq.options[index]),
    answer: order.indexOf(mcq.answer),
  };
}

const TIER_FALLBACK: Record<Tier, Tier[]> = { 1: [1, 2, 3], 2: [2, 1, 3], 3: [3, 2, 1] };

function chooseMcq(
  topic: Topic | "boss",
  tier: Tier,
  used: Set<string>,
  avoid: Set<string>,
  rng: Rng,
  seat?: Topic,
): Mcq | null {
  const fromTopic = MCQS.filter((item) => item.topic === topic);
  const seated = seat ? fromTopic.filter((item) => item.seat === seat) : fromTopic;
  const source = seated.length ? seated : fromTopic;
  for (const strict of [true, false]) {
    for (const t of TIER_FALLBACK[tier]) {
      const bag = source.filter(
        (item) => item.bloodline === t && !used.has(item.id) && (!strict || !avoid.has(item.id)),
      );
      if (bag.length) return pick(rng, bag);
    }
  }
  return null;
}

const WEST_ROTATION: ChallengeKind[] = [
  "maze",
  "pointers",
  "brackets",
  "bsearch",
  "swaps",
  "lru",
  "stack",
  "flood",
  "complexity",
];

const MIX: Partial<Record<NodeId, ChallengeKind[]>> = {
  foothills: ["pointers", "bsearch", "swaps"],
  gate: ["brackets", "stack", "maze"],
  yard: ["lru", "box", "lru"],
  stair: ["complexity", "swaps"],
  throne: ["maze", "pointers", "brackets", "bsearch", "swaps", "lru"],
};

/** Builds a puzzle of one kind, sized for the Bloodline or path level. */
export function generatePuzzle(kind: ChallengeKind, n: number, salt: number, used: Set<string>): Challenge {
  switch (kind) {
    case "pointers":
      return makePointers(n, salt);
    case "bsearch":
      return makeBinary(n, salt);
    case "brackets":
      return makeBrackets(n, salt);
    case "maze":
      return makeMaze(n, salt);
    case "swaps":
      return makeSwaps(n, salt);
    case "lru":
      return makeLru(n, salt);
    case "stack":
      return makeStack(n, salt);
    case "flood":
      return makeFlood(n, salt);
    case "complexity":
      return makeComplexity(n, salt);
    case "box":
      return makeBox(n, salt, used);
    case "latency":
      return makeLatency(n, salt);
    case "pipeline":
      return makePipeline(n);
    case "context":
      return makeContext(n, salt);
    case "model":
      return makeModel(n, salt, used);
    default:
      return makePointers(n, salt);
  }
}

export type NextInput = {
  bloodline: number;
  node: NodeId;
  role: Role;
  /** Questions already asked in this duel. */
  asked: number;
  usedIds: string[];
  avoid: string[];
  salt: number;
  seats: Topic[];
};

function mixChance(n: number): number {
  return Math.min(0.42, 0.2 + 0.03 * n);
}

export function nextChallenge(input: NextInput): Challenge {
  const n = wholeBloodline(input.bloodline);
  const rng = mulberry32(input.salt);
  const used = new Set(input.usedIds);
  const avoid = new Set(input.avoid);

  if (input.role === "puzzle") {
    const offset = ((n - 1) * 2) % WEST_ROTATION.length;
    return generatePuzzle(WEST_ROTATION[(offset + input.asked) % WEST_ROTATION.length], n, input.salt, used);
  }

  if (input.role === "specialist") {
    const tier = specialistTier(n);
    const authored: ChallengeKind[] =
      tier === 1 ? ["latency"] : tier === 2 ? ["pipeline"] : ["context", "model"];
    const next = authored.find((kind) => {
      const probe = generatePuzzle(kind, n, input.salt, used);
      return !used.has(probe.id);
    });
    if (next && (input.asked === 0 || rng() < 0.35)) return generatePuzzle(next, n, input.salt, used);
    const mcq = chooseMcq("specialist", tier, used, avoid, rng);
    if (mcq) return present(mcq, n, rng);
    return generatePuzzle(pick(rng, ["lru", "pointers", "maze"] as ChallengeKind[]), n, input.salt, used);
  }

  const mixes = MIX[input.node] ?? [];
  const onboarding = n === 1 && input.asked === 0;
  if (mixes.length && !onboarding && rng() < mixChance(n)) {
    return generatePuzzle(pick(rng, mixes), n, input.salt, used);
  }

  const tier = contentTier(n, rng);
  if (input.role === "boss") {
    const order: Topic[] = ["algo", "system", "craft"];
    const seat = order[input.seats.length % order.length];
    const mcq = chooseMcq("boss", tier, used, avoid, rng, seat);
    if (mcq) return present(mcq, n, rng);
  } else {
    const topic: Topic = input.role === "algo" ? "algo" : input.role === "system" ? "system" : "craft";
    const mcq = chooseMcq(topic, tier, used, avoid, rng);
    if (mcq) return present(mcq, n, rng);
  }
  return generatePuzzle(pick(rng, mixes.length ? mixes : WEST_ROTATION), n, input.salt, used);
}
