import type {
  Bloodline,
  BoxChallenge,
  Bucket,
  Challenge,
  ComplexityChallenge,
  ContextChallenge,
  FloodChallenge,
  LatencyChallenge,
  Mcq,
  ModelChallenge,
  PipelineChallenge,
  Role,
  StackChallenge,
  Topic,
} from "../types";
import { MCQS } from "./mcq";

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function bfsOrder(
  cols: number,
  rows: number,
  walls: number[],
  start: number,
): number[] {
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

function makeStack(bloodline: Bloodline, salt: number): StackChallenge {
  const rng = mulberry32(salt);
  const structure: "stack" | "queue" =
    bloodline === 3 && rng() > 0.45 ? "queue" : "stack";
  const steps = bloodline === 1 ? 4 : bloodline === 2 ? 6 : 7;
  const data: number[] = [];
  const ops: StackChallenge["ops"] = [];
  for (let i = 0; i < steps; i++) {
    const canPop = data.length > 0;
    const pop = canPop && rng() < (bloodline === 1 ? 0.35 : 0.45);
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
  const name = structure === "stack" ? "stack" : "queue";
  const verbIn = structure === "stack" ? "PUSH" : "ENQUEUE";
  const verbOut = structure === "stack" ? "POP" : "DEQUEUE";
  const script = ops
    .map((op) => (op.op === "push" ? `${verbIn} ${op.value}` : verbOut))
    .join(", ");
  const answer = [...data];
  return {
    kind: "stack",
    id: `stack-${bloodline}-${salt}`,
    topic: "algo",
    bloodline,
    structure,
    prompt: `A ${name} starts empty. ${script}. Build what remains, ${
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
  };
}

function makeFlood(bloodline: Bloodline, salt: number): FloodChallenge {
  const rng = mulberry32(salt + 17);
  const cols = bloodline === 1 ? 3 : 4;
  const rows = bloodline === 1 ? 3 : 4;
  const start = 0;
  const walls: number[] = [];
  const wallCount = bloodline === 1 ? 0 : bloodline === 2 ? 2 : 3;
  let guard = 0;
  while (walls.length < wallCount && guard < 30) {
    guard++;
    const cell = 1 + Math.floor(rng() * (cols * rows - 1));
    if (!walls.includes(cell)) walls.push(cell);
  }
  let order = bfsOrder(cols, rows, walls, start);
  if (order.length < 4) {
    walls.length = 0;
    order = bfsOrder(cols, rows, walls, start);
  }
  return {
    kind: "flood",
    id: `flood-${bloodline}-${salt}`,
    topic: "algo",
    bloodline,
    prompt:
      "Click every open cell in breadth-first order, starting at the marked cell. From each cell the neighbors are tried up, then right, then down, then left.",
    cols,
    rows,
    walls,
    start,
    order,
    hint: "Finish a whole ring of distance before you step further out.",
    senior: `The first cell is the start. The next clicks are its open neighbors in the order up, right, down, left. There are ${order.length} cells to visit.`,
    principle: "BFS visit order",
    why: "If you can predict the order, you understand the queue inside the search.",
    reveal: `Visit ${order.length} open cells. The first is the start, then neighbors in the order up, right, down, left.`,
  };
}

const SNIPPETS: { code: string; bucket: Bucket; tier: Bloodline }[] = [
  { code: "return table[key]", bucket: "O(1)", tier: 1 },
  { code: "return items[items.length - 1]", bucket: "O(1)", tier: 1 },
  { code: "seen.has(id)", bucket: "O(1)", tier: 1 },
  {
    code: "let s = 0\nfor (const x of items) s += x",
    bucket: "O(n)",
    tier: 1,
  },
  {
    code: "for (const x of items)\n  if (x === target) return true",
    bucket: "O(n)",
    tier: 1,
  },
  {
    code: "for (const a of items)\n  for (const b of items)\n    touch(a, b)",
    bucket: "O(n²)",
    tier: 1,
  },
  {
    code: "while (i < n && j < n) {\n  if (a[i] < b[j]) i++\n  else j++\n}",
    bucket: "O(n)",
    tier: 2,
  },
  {
    code: "for (let i = 0; i < n; i++)\n  for (let j = 0; j < 3; j++)\n    mark(i)",
    bucket: "O(n)",
    tier: 2,
  },
  {
    code: "for (let i = 0; i < n; i++)\n  for (let j = i + 1; j < n; j++)\n    pair(i, j)",
    bucket: "O(n²)",
    tier: 2,
  },
  { code: "return node.next === null", bucket: "O(1)", tier: 3 },
  {
    code: "for (const cell of cells) paint(cell)",
    bucket: "O(n)",
    tier: 3,
  },
  {
    code: "for (const word of words)\n  for (const other of words)\n    if (word !== other) score(word, other)",
    bucket: "O(n²)",
    tier: 3,
  },
];

function makeComplexity(bloodline: Bloodline, salt: number): ComplexityChallenge {
  const rng = mulberry32(salt + 91);
  const buckets: Bucket[] = ["O(1)", "O(n)", "O(n²)"];
  const snippets = buckets.map((bucket) => {
    const pool = SNIPPETS.filter(
      (s) => s.bucket === bucket && s.tier <= bloodline,
    );
    const pick = pool[Math.floor(rng() * pool.length)];
    return { id: `${bucket}-${pick.code.slice(0, 12)}`, code: pick.code, bucket };
  });
  for (let i = snippets.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [snippets[i], snippets[j]] = [snippets[j], snippets[i]];
  }
  return {
    kind: "complexity",
    id: `cx-${bloodline}-${salt}`,
    topic: "algo",
    bloodline,
    prompt:
      "Place each snippet in its bucket. Read the loops. A loop of constant length does not make the whole thing quadratic.",
    snippets,
    hint: "Count how many times the innermost work runs as n grows.",
    senior:
      "One snippet does a direct lookup or a single push. One walks the input once. One pairs every item with every item.",
    principle: "Big-O from the loops",
    why: "Interviewers ask you to read a few lines and say the cost before you optimize anything.",
    reveal: snippets
      .map((s) => `${s.bucket}: ${s.code.split("\n")[0]}`)
      .join(" · "),
  };
}

const BOXES: Omit<BoxChallenge, "id" | "bloodline">[] = [
  {
    kind: "box",
    topic: "system",
    prompt:
      "A retry must not charge the coin twice. Which piece belongs in the box?",
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
    prompt:
      "The counter must survive a worker that crashes after it has read an event. What goes in the box?",
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

function makeBox(bloodline: Bloodline, salt: number): BoxChallenge {
  const rng = mulberry32(salt + 13);
  const start = bloodline === 1 ? 0 : bloodline === 2 ? 2 : 4;
  const slice = BOXES.slice(start, start + 2);
  const pick = slice[Math.floor(rng() * slice.length)];
  return { ...pick, id: `box-${bloodline}-${salt}`, bloodline };
}

function makeLatency(salt: number): LatencyChallenge {
  return {
    kind: "latency",
    id: `lat-${salt}`,
    topic: "specialist",
    bloodline: 1,
    prompt:
      "Mark only what must block first paint. Leave the rest off the critical path.",
    items: [
      { id: "html", label: "The HTML document", onPath: true },
      { id: "css", label: "CSS for the first screen", onPath: true },
      { id: "font", label: "The font used in the title", onPath: true },
      { id: "video", label: "A marketing video below the fold", onPath: false },
      { id: "analytics", label: "An analytics beacon", onPath: false },
    ],
    hint: "First paint needs the document, the CSS that styles it, and the type in the title.",
    senior: "The video and the analytics beacon can wait until after the first screen.",
    principle: "Critical rendering path",
    why: "Performance interviews ask you to refuse work that is not on the first screen.",
    reveal: "On the path: HTML, first-screen CSS, and the title font. Off it: the video and analytics.",
  };
}

function makePipeline(salt: number): PipelineChallenge {
  return {
    kind: "pipeline",
    id: `pipe-${salt}`,
    topic: "specialist",
    bloodline: 2,
    prompt: "Order the path a change should take. Production is last.",
    stages: [
      "Unit tests",
      "Build the image",
      "Deploy to staging",
      "Smoke-test staging",
      "Deploy to production",
    ],
    hint: "Prove the change before you build an image you might ship. Prove staging before production.",
    senior: "Tests, then the image, then staging, then a smoke test, then production.",
    principle: "Pipeline order",
    why: "A delivery interview is often just this order, said without hesitation.",
    reveal: "Unit tests → image → staging → smoke test → production.",
  };
}

function makeContext(salt: number): ContextChallenge {
  return {
    kind: "context",
    id: `ctx-${salt}`,
    topic: "specialist",
    bloodline: 3,
    prompt:
      "Two contexts. Billing means the payer's money. Shipping means the parcel. Sort each noun.",
    groups: ["Billing", "Shipping"],
    items: [
      { id: "invoice", label: "Invoice", group: "Billing" },
      { id: "charge", label: "Card charge", group: "Billing" },
      { id: "refund", label: "Refund", group: "Billing" },
      { id: "track", label: "Tracking number", group: "Shipping" },
      { id: "bin", label: "Warehouse bin", group: "Shipping" },
      { id: "weight", label: "Parcel weight", group: "Shipping" },
    ],
    hint: "If the noun is about money leaving or returning, it is billing.",
    senior: "Invoice, charge, and refund are billing. Tracking, the bin, and weight are shipping.",
    principle: "Bounded context",
    why: "Sorting nouns is how you notice that one word is doing two jobs.",
    reveal: "Billing: invoice, charge, refund. Shipping: tracking number, warehouse bin, parcel weight.",
  };
}

function makeModel(salt: number): ModelChallenge {
  const variants: Omit<ModelChallenge, "id" | "kind" | "topic" | "bloodline">[] = [
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
      prompt:
        "One input column is the label, renamed 'result_copy'. The score is perfect. What is wrong?",
      options: ["Data leakage", "Overfitting to a small font", "The model is too slow", "The test set is too honest"],
      answer: 0,
      hint: "The answer was handed to the model in the input.",
      senior: "Leakage. Drop the column. A perfect score with the label in the features is not a result.",
      principle: "Data leakage",
      why: "A perfect score is a prompt to look for the label hiding in the features.",
      reveal: "Data leakage. The column is the label.",
    },
  ];
  const pick = variants[salt % variants.length];
  return {
    kind: "model",
    id: `model-${salt}`,
    topic: "specialist",
    bloodline: 3,
    ...pick,
  };
}

function chooseMcq(
  topic: Topic | "boss",
  bloodline: Bloodline,
  avoid: Set<string>,
  duelUsed: Set<string>,
  seat?: Topic,
): Mcq {
  let pool = MCQS.filter((item) => item.topic === topic && item.bloodline === bloodline);
  if (seat) {
    const seated = pool.filter((item) => item.seat === seat);
    if (seated.length) pool = seated;
  }
  const unused = pool.filter((item) => !duelUsed.has(item.id));
  const fresh = unused.filter((item) => !avoid.has(item.id));
  const bag = fresh.length ? fresh : unused.length ? unused : pool;
  return bag[Math.floor(Math.random() * bag.length)];
}

export function nextChallenge(input: {
  bloodline: Bloodline;
  role: Role;
  heartIndex: number;
  avoid: string[];
  usedIds: string[];
  salt: number;
  bossSeatsUsed: Topic[];
}): Challenge {
  const avoid = new Set(input.avoid);
  const used = new Set(input.usedIds);
  if (input.role === "puzzle") {
    const cycle = input.heartIndex % 4;
    if (cycle === 0) return makeStack(input.bloodline, input.salt);
    if (cycle === 1) return makeFlood(input.bloodline, input.salt);
    if (cycle === 2) return makeComplexity(input.bloodline, input.salt);
    return makeBox(input.bloodline, input.salt);
  }
  if (input.role === "specialist") {
    if (input.heartIndex === 0 && input.bloodline === 1) return makeLatency(input.salt);
    if (input.heartIndex === 0 && input.bloodline === 2) return makePipeline(input.salt);
    if (input.heartIndex === 0 && input.bloodline === 3) return makeContext(input.salt);
    if (input.heartIndex === 1 && input.bloodline === 3) return makeModel(input.salt);
    return chooseMcq("specialist", input.bloodline, avoid, used);
  }
  if (input.role === "boss") {
    const order: Topic[] = ["algo", "system", "craft"];
    const seat = order[input.bossSeatsUsed.length % order.length];
    return chooseMcq("boss", input.bloodline, avoid, used, seat);
  }
  const topic: Topic =
    input.role === "algo" ? "algo" : input.role === "system" ? "system" : "craft";
  return chooseMcq(topic, input.bloodline, avoid, used);
}
