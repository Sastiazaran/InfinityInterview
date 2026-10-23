"use client";

import { useState } from "react";
import type {
  Bucket,
  ComplexityChallenge,
  ContextChallenge,
  FloodChallenge,
  LatencyChallenge,
  PipelineChallenge,
  StackChallenge,
} from "@/game/types";
import { hash, mulberry32, shuffle } from "@/game/rng";
import { arrowOf, digitOf, isBack, isConfirm, LAYER, useKeyLayer, wrapIndex } from "@/components/keys";
import { Legend, type ChallengeProps } from "./shared";

// ——— Stack / queue trace ———

export function StackView({ challenge, active, onAnswer }: ChallengeProps<StackChallenge>) {
  const [built, setBuilt] = useState<number[]>([]);
  const pushes = challenge.ops.filter((op) => op.op === "push").length;
  const bank = Array.from(new Set(challenge.ops.flatMap((op) => (op.value ? [op.value] : [])))).sort(
    (a, b) => a - b,
  );
  const isStack = challenge.structure === "stack";

  function add(value: number) {
    setBuilt((previous) => (previous.length >= pushes ? previous : [...previous, value]));
  }

  function commit() {
    onAnswer(
      built.length === challenge.answer.length && built.every((value, index) => value === challenge.answer[index]),
    );
  }

  useKeyLayer(
    LAYER.CHALLENGE,
    (event) => {
      const digit = digitOf(event);
      if (digit !== null && digit >= 1) {
        add(digit);
        return true;
      }
      if (isBack(event)) {
        setBuilt((previous) => previous.slice(0, -1));
        return true;
      }
      if (isConfirm(event)) {
        if (!event.repeat) commit();
        return true;
      }
      return false;
    },
    { enabled: active },
  );

  return (
    <div className="play">
      <ol className="ops" aria-label="Operations">
        {challenge.ops.map((op, index) => (
          <li key={index} className={op.op}>
            {op.op === "push" ? `${isStack ? "PUSH" : "ENQUEUE"} ${op.value}` : isStack ? "POP" : "DEQUEUE"}
          </li>
        ))}
      </ol>
      <div className={`built ${isStack ? "as-stack" : "as-queue"}`} aria-label="Your answer">
        <span className="built-label">{isStack ? "Bottom → top" : "Front → back"}</span>
        <div className="built-row">
          {built.length === 0 && <span className="muted">Type the values that remain.</span>}
          {built.map((value, index) => (
            <span key={`${value}-${index}`} className="stone">
              {value}
            </span>
          ))}
        </div>
      </div>
      <div className="keypad">
        {bank.map((value) => (
          <button key={value} type="button" tabIndex={-1} className="chip" disabled={!active} onClick={() => add(value)}>
            {value}
          </button>
        ))}
        <button
          type="button"
          tabIndex={-1}
          className="chip ghost"
          disabled={!active}
          onClick={() => setBuilt((previous) => previous.slice(0, -1))}
        >
          Undo
        </button>
        <button type="button" tabIndex={-1} className="chip gold" disabled={!active} onClick={commit}>
          Commit
        </button>
      </div>
      <Legend
        keys={[
          ["1–9", "add a value"],
          ["⌫", "undo"],
          ["Z", `commit the ${challenge.structure}`],
        ]}
      />
    </div>
  );
}

// ——— BFS flood order ———

export function FloodView({ challenge, active, onAnswer }: ChallengeProps<FloodChallenge>) {
  const { cols, rows, start } = challenge;
  const walls = new Set(challenge.walls);
  const [marks, setMarks] = useState<number[]>([start]);
  const [cursor, setCursor] = useState(start);
  const total = challenge.order.length;

  function mark(cell: number) {
    if (walls.has(cell) || marks.includes(cell)) return;
    const next = [...marks, cell];
    setMarks(next);
    if (next.length >= total) onAnswer(next.every((value, index) => value === challenge.order[index]));
  }

  function move(dx: number, dy: number) {
    setCursor((cell) => {
      const x = Math.min(cols - 1, Math.max(0, (cell % cols) + dx));
      const y = Math.min(rows - 1, Math.max(0, Math.floor(cell / cols) + dy));
      return y * cols + x;
    });
  }

  useKeyLayer(
    LAYER.CHALLENGE,
    (event) => {
      const arrow = arrowOf(event);
      if (arrow) {
        if (arrow === "up") move(0, -1);
        if (arrow === "down") move(0, 1);
        if (arrow === "left") move(-1, 0);
        if (arrow === "right") move(1, 0);
        return true;
      }
      if (isConfirm(event)) {
        if (!event.repeat) mark(cursor);
        return true;
      }
      if (isBack(event)) {
        setMarks((previous) => (previous.length > 1 ? previous.slice(0, -1) : previous));
        return true;
      }
      return false;
    },
    { enabled: active },
  );

  return (
    <div className="play">
      <div
        className="grid flood"
        style={{ gridTemplateColumns: `repeat(${cols}, var(--cell))` }}
        aria-label={`Grid ${cols} by ${rows}`}
      >
        {Array.from({ length: cols * rows }, (_, cell) => {
          const order = marks.indexOf(cell);
          const wall = walls.has(cell);
          return (
            <button
              key={cell}
              type="button"
              tabIndex={-1}
              className={`cell ${wall ? "wall" : ""} ${cell === start ? "start" : ""} ${order >= 0 ? "marked" : ""} ${
                cursor === cell ? "cursor" : ""
              }`}
              disabled={wall || !active}
              onClick={() => {
                setCursor(cell);
                mark(cell);
              }}
            >
              {wall ? "" : order >= 0 ? order + 1 : ""}
            </button>
          );
        })}
      </div>
      <p className="tally">
        {marks.length} of {total} cells marked
      </p>
      <Legend
        keys={[
          ["←↑↓→", "move"],
          ["Z", "mark next"],
          ["⌫", "undo"],
        ]}
      />
    </div>
  );
}

// ——— Big-O buckets ———

const BUCKETS: Bucket[] = ["O(1)", "O(n)", "O(n²)"];

export function ComplexityView({ challenge, active, onAnswer }: ChallengeProps<ComplexityChallenge>) {
  const snippets = challenge.snippets;
  const [cursor, setCursor] = useState(0);
  const [placed, setPlaced] = useState<Record<string, Bucket>>({});
  const ready = snippets.every((snippet) => placed[snippet.id]);
  const rows = snippets.length + 1;

  function assign(bucket: Bucket) {
    const snippet = snippets[cursor];
    if (!snippet) return;
    const next = { ...placed, [snippet.id]: bucket };
    setPlaced(next);
    const open = snippets.findIndex((item, index) => index > cursor && !next[item.id]);
    const first = snippets.findIndex((item) => !next[item.id]);
    setCursor(open >= 0 ? open : first >= 0 ? first : snippets.length);
  }

  function commit() {
    if (!ready) return;
    onAnswer(snippets.every((snippet) => placed[snippet.id] === snippet.bucket));
  }

  useKeyLayer(
    LAYER.CHALLENGE,
    (event) => {
      const arrow = arrowOf(event);
      if (arrow === "up" || arrow === "down") {
        setCursor((value) => wrapIndex(value + (arrow === "up" ? -1 : 1), rows));
        return true;
      }
      if ((arrow === "left" || arrow === "right") && cursor < snippets.length) {
        const current = placed[snippets[cursor].id];
        const at = current ? BUCKETS.indexOf(current) : arrow === "left" ? 0 : -1;
        const nextBucket = BUCKETS[wrapIndex(at + (arrow === "left" ? -1 : 1), BUCKETS.length)];
        setPlaced({ ...placed, [snippets[cursor].id]: nextBucket });
        return true;
      }
      const digit = digitOf(event);
      if (digit !== null && digit >= 1 && digit <= 3) {
        if (cursor < snippets.length) assign(BUCKETS[digit - 1]);
        return true;
      }
      if (isBack(event) && cursor < snippets.length) {
        const rest = { ...placed };
        delete rest[snippets[cursor].id];
        setPlaced(rest);
        return true;
      }
      if (isConfirm(event)) {
        if (!event.repeat) {
          if (cursor >= snippets.length) commit();
          else setCursor((value) => value + 1);
        }
        return true;
      }
      return false;
    },
    { enabled: active },
  );

  return (
    <div className="play">
      <div className="snippets">
        {snippets.map((snippet, index) => (
          <div
            key={snippet.id}
            className={`snippet ${cursor === index ? "on" : ""}`}
            onMouseEnter={() => setCursor(index)}
          >
            <pre>{snippet.code}</pre>
            <div className="bucket-row">
              {BUCKETS.map((bucket, at) => (
                <button
                  key={bucket}
                  type="button"
                  tabIndex={-1}
                  disabled={!active}
                  className={`chip ${placed[snippet.id] === bucket ? "picked" : ""}`}
                  onClick={() => {
                    setCursor(index);
                    setPlaced({ ...placed, [snippet.id]: bucket });
                  }}
                >
                  <kbd>{at + 1}</kbd> {bucket}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <button
        type="button"
        tabIndex={-1}
        className={`commit-row ${cursor === snippets.length ? "on" : ""}`}
        disabled={!ready || !active}
        onMouseEnter={() => setCursor(snippets.length)}
        onClick={commit}
      >
        {ready ? "Commit the costs" : "Place every snippet first"}
      </button>
      <Legend
        keys={[
          ["↑↓", "snippet"],
          ["1 2 3", "bucket"],
          ["←→", "cycle"],
          ["Z", "commit on the last row"],
        ]}
      />
    </div>
  );
}

// ——— Critical rendering path ———

const FIRST_PAINT: [string, string] = ["Blocks first paint", "Can wait"];

export function LatencyView({ challenge, active, onAnswer }: ChallengeProps<LatencyChallenge>) {
  const items = challenge.items;
  const [marked, unmarked] = challenge.marks ?? FIRST_PAINT;
  const [cursor, setCursor] = useState(0);
  const [onPath, setOnPath] = useState<string[]>([]);

  function toggle(index: number) {
    const item = items[index];
    if (!item) return;
    setOnPath((previous) => (previous.includes(item.id) ? previous.filter((id) => id !== item.id) : [...previous, item.id]));
  }

  function commit() {
    const wanted = items.filter((item) => item.onPath).map((item) => item.id);
    onAnswer(wanted.length === onPath.length && wanted.every((id) => onPath.includes(id)));
  }

  useKeyLayer(
    LAYER.CHALLENGE,
    (event) => {
      const arrow = arrowOf(event);
      if (arrow === "up" || arrow === "down") {
        setCursor((value) => wrapIndex(value + (arrow === "up" ? -1 : 1), items.length + 1));
        return true;
      }
      const digit = digitOf(event);
      if (digit !== null && digit >= 1 && digit <= items.length) {
        setCursor(digit - 1);
        toggle(digit - 1);
        return true;
      }
      if (isConfirm(event)) {
        if (!event.repeat) {
          if (cursor >= items.length) commit();
          else toggle(cursor);
        }
        return true;
      }
      return false;
    },
    { enabled: active },
  );

  return (
    <div className="play">
      <div className="toggles">
        {items.map((item, index) => {
          const on = onPath.includes(item.id);
          return (
            <button
              key={item.id}
              type="button"
              tabIndex={-1}
              disabled={!active}
              className={`toggle ${cursor === index ? "on" : ""} ${on ? "checked" : ""}`}
              onMouseEnter={() => setCursor(index)}
              onClick={() => {
                setCursor(index);
                toggle(index);
              }}
            >
              <kbd>{index + 1}</kbd>
              <span className="toggle-state">{on ? marked : unmarked}</span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
      <button
        type="button"
        tabIndex={-1}
        className={`commit-row ${cursor === items.length ? "on" : ""}`}
        disabled={!active}
        onMouseEnter={() => setCursor(items.length)}
        onClick={commit}
      >
        {challenge.marks ? "Commit the marks" : "Commit the path"}
      </button>
      <Legend
        keys={[
          ["1–6", "toggle"],
          ["↑↓", "move"],
          ["Z", "toggle or commit"],
        ]}
      />
    </div>
  );
}

// ——— Delivery pipeline ———

export function PipelineView({ challenge, active, onAnswer }: ChallengeProps<PipelineChallenge>) {
  const [bank] = useState(() => {
    const rng = mulberry32(hash(challenge.id + challenge.bloodline));
    let mixed = shuffle(rng, challenge.stages);
    if (mixed.every((stage, index) => stage === challenge.stages[index])) mixed = [...mixed].reverse();
    return mixed;
  });
  const [order, setOrder] = useState<string[]>([]);
  const [cursor, setCursor] = useState(0);
  const remaining = bank.filter((stage) => !order.includes(stage));
  const at = Math.min(cursor, Math.max(0, remaining.length - 1));

  function place(stage: string | undefined) {
    if (!stage) return;
    const next = [...order, stage];
    setOrder(next);
    if (next.length === challenge.stages.length) {
      onAnswer(next.every((value, index) => value === challenge.stages[index]));
    }
  }

  useKeyLayer(
    LAYER.CHALLENGE,
    (event) => {
      const arrow = arrowOf(event);
      if (arrow === "up" || arrow === "down") {
        setCursor(wrapIndex(at + (arrow === "up" ? -1 : 1), remaining.length));
        return true;
      }
      const digit = digitOf(event);
      if (digit !== null && digit >= 1 && digit <= remaining.length) {
        place(remaining[digit - 1]);
        return true;
      }
      if (isConfirm(event)) {
        if (!event.repeat) place(remaining[at]);
        return true;
      }
      if (isBack(event)) {
        setOrder((previous) => previous.slice(0, -1));
        return true;
      }
      return false;
    },
    { enabled: active },
  );

  return (
    <div className="play two-col">
      <ol className="order" aria-label="Your pipeline">
        {challenge.stages.map((_, index) => (
          <li key={index} className={order[index] ? "filled" : ""}>
            <span className="order-num">{index + 1}</span>
            {order[index] ?? "…"}
          </li>
        ))}
      </ol>
      <div className="bank">
        {remaining.map((stage, index) => (
          <button
            key={stage}
            type="button"
            tabIndex={-1}
            disabled={!active}
            className={`chip wide ${index === at ? "on" : ""}`}
            onMouseEnter={() => setCursor(index)}
            onClick={() => place(stage)}
          >
            <kbd>{index + 1}</kbd> {stage}
          </button>
        ))}
      </div>
      <Legend
        keys={[
          ["↑↓", "choose"],
          ["Z", "queue it next"],
          ["⌫", "undo"],
        ]}
      />
    </div>
  );
}

// ——— Bounded contexts ———

export function ContextView({ challenge, active, onAnswer }: ChallengeProps<ContextChallenge>) {
  const items = challenge.items;
  const groups = challenge.groups;
  const [cursor, setCursor] = useState(0);
  const [placed, setPlaced] = useState<Record<string, string>>({});
  const ready = items.every((item) => placed[item.id]);

  function assign(index: number, group: string) {
    const item = items[index];
    if (!item) return;
    setPlaced((previous) => ({ ...previous, [item.id]: group }));
  }

  function commit() {
    if (!ready) return;
    onAnswer(items.every((item) => placed[item.id] === item.group));
  }

  useKeyLayer(
    LAYER.CHALLENGE,
    (event) => {
      const arrow = arrowOf(event);
      if (arrow === "up" || arrow === "down") {
        setCursor((value) => wrapIndex(value + (arrow === "up" ? -1 : 1), items.length + 1));
        return true;
      }
      if ((arrow === "left" || arrow === "right") && cursor < items.length) {
        assign(cursor, groups[arrow === "left" ? 0 : groups.length - 1]);
        return true;
      }
      const digit = digitOf(event);
      if (digit !== null && digit >= 1 && digit <= groups.length && cursor < items.length) {
        assign(cursor, groups[digit - 1]);
        setCursor((value) => Math.min(items.length, value + 1));
        return true;
      }
      if (isConfirm(event)) {
        if (!event.repeat) {
          if (cursor >= items.length) commit();
          else {
            const current = placed[items[cursor].id];
            const next = groups[wrapIndex((current ? groups.indexOf(current) : -1) + 1, groups.length)];
            assign(cursor, next);
          }
        }
        return true;
      }
      return false;
    },
    { enabled: active },
  );

  return (
    <div className="play">
      <div className="sorter">
        <div className="sorter-head">
          <span>← {groups[0]}</span>
          <span>{groups[groups.length - 1]} →</span>
        </div>
        {items.map((item, index) => {
          const group = placed[item.id];
          const side = group ? (groups.indexOf(group) === 0 ? "left" : "right") : "middle";
          return (
            <div
              key={item.id}
              className={`sorter-row ${cursor === index ? "on" : ""}`}
              onMouseEnter={() => setCursor(index)}
            >
              <button
                type="button"
                tabIndex={-1}
                disabled={!active}
                className="chip ghost"
                onClick={() => assign(index, groups[0])}
                aria-label={`Move to ${groups[0]}`}
              >
                ◀
              </button>
              <span className={`sorter-item ${side}`}>{item.label}</span>
              <button
                type="button"
                tabIndex={-1}
                disabled={!active}
                className="chip ghost"
                onClick={() => assign(index, groups[groups.length - 1])}
                aria-label={`Move to ${groups[groups.length - 1]}`}
              >
                ▶
              </button>
            </div>
          );
        })}
      </div>
      <button
        type="button"
        tabIndex={-1}
        className={`commit-row ${cursor === items.length ? "on" : ""}`}
        disabled={!ready || !active}
        onMouseEnter={() => setCursor(items.length)}
        onClick={commit}
      >
        {challenge.label
          ? ready
            ? "Commit the sort"
            : "Sort every item first"
          : ready
            ? "Commit the contexts"
            : "Sort every noun first"}
      </button>
      <Legend
        keys={[
          ["↑↓", "noun"],
          ["←→", "side"],
          ["Z", "commit on the last row"],
        ]}
      />
    </div>
  );
}
