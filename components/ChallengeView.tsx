"use client";

import { useMemo, useState } from "react";
import type {
  Bucket,
  Challenge,
  StackChallenge,
} from "@/game/types";

const BUCKETS: Bucket[] = ["O(1)", "O(n)", "O(n²)"];

export function ChallengeView({
  challenge,
  eliminated,
  onAnswer,
}: {
  challenge: Challenge;
  eliminated: number[];
  onAnswer: (correct: boolean) => void;
}) {
  if (challenge.kind === "mcq" || challenge.kind === "model") {
    const options = challenge.options;
    const answer = challenge.answer;
    return (
      <div className="options">
        {options.map((option, index) => {
          const gone = eliminated.includes(index);
          return (
            <button
              key={option}
              className="option"
              disabled={gone}
              onClick={() => onAnswer(index === answer)}
            >
              <span className="opt-key">{index + 1}</span>
              {gone ? "A senior crossed this out." : option}
            </button>
          );
        })}
      </div>
    );
  }
  if (challenge.kind === "stack") return <StackPlay challenge={challenge} onAnswer={onAnswer} />;
  if (challenge.kind === "flood") return <FloodPlay challenge={challenge} onAnswer={onAnswer} />;
  if (challenge.kind === "complexity")
    return <ComplexityPlay challenge={challenge} onAnswer={onAnswer} />;
  if (challenge.kind === "box") return <BoxPlay challenge={challenge} onAnswer={onAnswer} />;
  if (challenge.kind === "latency") return <LatencyPlay challenge={challenge} onAnswer={onAnswer} />;
  if (challenge.kind === "pipeline")
    return <PipelinePlay challenge={challenge} onAnswer={onAnswer} />;
  return <ContextPlay challenge={challenge} onAnswer={onAnswer} />;
}

function StackPlay({
  challenge,
  onAnswer,
}: {
  challenge: StackChallenge;
  onAnswer: (correct: boolean) => void;
}) {
  const [built, setBuilt] = useState<number[]>([]);
  const bank = useMemo(() => {
    const values = challenge.ops.flatMap((op) => (op.value ? [op.value] : []));
    return Array.from(new Set(values));
  }, [challenge]);
  const script = challenge.ops
    .map((op) =>
      op.op === "push"
        ? `${challenge.structure === "stack" ? "PUSH" : "ENQUEUE"} ${op.value}`
        : challenge.structure === "stack"
          ? "POP"
          : "DEQUEUE",
    )
    .join("  ·  ");

  return (
    <div className="play">
      <p className="script">{script}</p>
      <div className="stack-col" aria-label="Your answer">
        {(challenge.structure === "stack" ? [...built].reverse() : built).map((value, index) => (
          <span key={`${value}-${index}`} className="stone">
            {value}
          </span>
        ))}
        {built.length === 0 && <span className="muted">Empty</span>}
      </div>
      <div className="row">
        {bank.map((value) => (
          <button key={value} className="chip" onClick={() => setBuilt((prev) => [...prev, value])}>
            {value}
          </button>
        ))}
        <button className="chip ghost" onClick={() => setBuilt((prev) => prev.slice(0, -1))}>
          Undo
        </button>
      </div>
      <button
        className="btn gold"
        onClick={() =>
          onAnswer(
            built.length === challenge.answer.length &&
              built.every((value, index) => value === challenge.answer[index]),
          )
        }
      >
        Commit the {challenge.structure}
      </button>
    </div>
  );
}

function FloodPlay({
  challenge,
  onAnswer,
}: {
  challenge: Extract<Challenge, { kind: "flood" }>;
  onAnswer: (correct: boolean) => void;
}) {
  const [clicks, setClicks] = useState<number[]>([]);
  const walls = new Set(challenge.walls);
  function tap(cell: number) {
    if (walls.has(cell)) return;
    setClicks((prev) => {
      if (prev.includes(cell)) return prev;
      return [...prev, cell];
    });
  }
  return (
    <div className="play">
      <div
        className="grid"
        style={{ gridTemplateColumns: `repeat(${challenge.cols}, 2.75rem)` }}
      >
        {Array.from({ length: challenge.cols * challenge.rows }, (_, cell) => {
          const order = clicks.indexOf(cell);
          const wall = walls.has(cell);
          return (
            <button
              key={cell}
              className={`cell ${wall ? "wall" : ""} ${cell === challenge.start ? "start" : ""}`}
              disabled={wall}
              onClick={() => tap(cell)}
            >
              {wall ? "" : order >= 0 ? order + 1 : cell === challenge.start ? "S" : ""}
            </button>
          );
        })}
      </div>
      <div className="row">
        <button className="chip ghost" onClick={() => setClicks((prev) => prev.slice(0, -1))}>
          Undo
        </button>
        <button
          className="btn gold"
          onClick={() =>
            onAnswer(
              clicks.length === challenge.order.length &&
                clicks.every((cell, index) => cell === challenge.order[index]),
            )
          }
        >
          Commit the flood
        </button>
      </div>
    </div>
  );
}

function ComplexityPlay({
  challenge,
  onAnswer,
}: {
  challenge: Extract<Challenge, { kind: "complexity" }>;
  onAnswer: (correct: boolean) => void;
}) {
  const [picked, setPicked] = useState<string | null>(challenge.snippets[0]?.id ?? null);
  const [placed, setPlaced] = useState<Record<string, Bucket>>({});
  const ready = challenge.snippets.every((snippet) => placed[snippet.id]);
  return (
    <div className="play">
      <div className="snippets">
        {challenge.snippets.map((snippet) => (
          <button
            key={snippet.id}
            className={`snippet ${picked === snippet.id ? "on" : ""}`}
            onClick={() => setPicked(snippet.id)}
          >
            <pre>{snippet.code}</pre>
            {placed[snippet.id] && <em>{placed[snippet.id]}</em>}
          </button>
        ))}
      </div>
      <div className="row">
        {BUCKETS.map((bucket) => (
          <button
            key={bucket}
            className="chip"
            onClick={() => {
              if (!picked) return;
              setPlaced((prev) => ({ ...prev, [picked]: bucket }));
            }}
          >
            {bucket}
          </button>
        ))}
      </div>
      <button
        className="btn gold"
        disabled={!ready}
        onClick={() =>
          onAnswer(challenge.snippets.every((snippet) => placed[snippet.id] === snippet.bucket))
        }
      >
        Commit the costs
      </button>
    </div>
  );
}

function BoxPlay({
  challenge,
  onAnswer,
}: {
  challenge: Extract<Challenge, { kind: "box" }>;
  onAnswer: (correct: boolean) => void;
}) {
  const [card, setCard] = useState<string | null>(null);
  return (
    <div className="play">
      <div className="cards">
        {challenge.cards.map((item) => (
          <button
            key={item.id}
            className={`card ${card === item.id ? "on" : ""}`}
            onClick={() => setCard(item.id)}
          >
            <strong>{item.label}</strong>
            <span>{item.detail}</span>
          </button>
        ))}
      </div>
      <button className="btn gold" disabled={!card} onClick={() => onAnswer(card === challenge.answer)}>
        Place it in the box
      </button>
    </div>
  );
}

function LatencyPlay({
  challenge,
  onAnswer,
}: {
  challenge: Extract<Challenge, { kind: "latency" }>;
  onAnswer: (correct: boolean) => void;
}) {
  const [onPath, setOnPath] = useState<string[]>([]);
  function toggle(id: string) {
    setOnPath((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  }
  return (
    <div className="play">
      {challenge.items.map((item) => (
        <button
          key={item.id}
          className={`option ${onPath.includes(item.id) ? "on" : ""}`}
          onClick={() => toggle(item.id)}
        >
          {onPath.includes(item.id) ? "On the path" : "Can wait"} — {item.label}
        </button>
      ))}
      <button
        className="btn gold"
        onClick={() => {
          const wanted = challenge.items.filter((item) => item.onPath).map((item) => item.id);
          onAnswer(
            wanted.length === onPath.length && wanted.every((id) => onPath.includes(id)),
          );
        }}
      >
        Commit the path
      </button>
    </div>
  );
}

function PipelinePlay({
  challenge,
  onAnswer,
}: {
  challenge: Extract<Challenge, { kind: "pipeline" }>;
  onAnswer: (correct: boolean) => void;
}) {
  const shuffled = useMemo(() => {
    const copy = [...challenge.stages];
    copy.sort((a, b) => a.localeCompare(b));
    return copy;
  }, [challenge]);
  const [order, setOrder] = useState<string[]>([]);
  const remaining = shuffled.filter((stage) => !order.includes(stage));
  return (
    <div className="play">
      <ol className="order">
        {order.length === 0 && <li className="muted">Nothing queued yet.</li>}
        {order.map((stage, index) => (
          <li key={stage}>
            {index + 1}. {stage}
          </li>
        ))}
      </ol>
      <div className="row">
        {remaining.map((stage) => (
          <button key={stage} className="chip" onClick={() => setOrder((prev) => [...prev, stage])}>
            {stage}
          </button>
        ))}
        <button className="chip ghost" onClick={() => setOrder((prev) => prev.slice(0, -1))}>
          Undo
        </button>
      </div>
      <button
        className="btn gold"
        disabled={order.length !== challenge.stages.length}
        onClick={() => onAnswer(order.every((stage, index) => stage === challenge.stages[index]))}
      >
        Commit the pipeline
      </button>
    </div>
  );
}

function ContextPlay({
  challenge,
  onAnswer,
}: {
  challenge: Extract<Challenge, { kind: "context" }>;
  onAnswer: (correct: boolean) => void;
}) {
  const [picked, setPicked] = useState(challenge.items[0]?.id ?? "");
  const [groups, setGroups] = useState<Record<string, string>>({});
  const ready = challenge.items.every((item) => groups[item.id]);
  return (
    <div className="play">
      <div className="row">
        {challenge.items.map((item) => (
          <button
            key={item.id}
            className={`chip ${picked === item.id ? "on" : ""}`}
            onClick={() => setPicked(item.id)}
          >
            {item.label}
            {groups[item.id] ? ` · ${groups[item.id]}` : ""}
          </button>
        ))}
      </div>
      <div className="row">
        {challenge.groups.map((group) => (
          <button
            key={group}
            className="chip"
            onClick={() => setGroups((prev) => ({ ...prev, [picked]: group }))}
          >
            Place in {group}
          </button>
        ))}
      </div>
      <button
        className="btn gold"
        disabled={!ready}
        onClick={() =>
          onAnswer(challenge.items.every((item) => groups[item.id] === item.group))
        }
      >
        Commit the contexts
      </button>
    </div>
  );
}
