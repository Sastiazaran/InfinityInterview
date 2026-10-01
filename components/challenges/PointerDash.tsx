"use client";

import { useState } from "react";
import type { PointerChallenge } from "@/game/types";
import { arrowOf, isBack, isConfirm, LAYER, useKeyLayer } from "@/components/keys";
import { Legend, Notice, type ChallengeProps } from "./shared";

type Flash = { text: string; id: number };

export function PointerDash({ challenge, active, senior, onAnswer }: ChallengeProps<PointerChallenge>) {
  const { values, target } = challenge;
  const [history, setHistory] = useState<[number, number][]>([[0, values.length - 1]]);
  const [stumbles, setStumbles] = useState(0);
  const [flash, setFlash] = useState<Flash | null>(null);
  const [left, right] = history[history.length - 1];
  const sum = values[left] + values[right];
  const forgiven = challenge.stumbles;
  const verdict = sum === target ? "=" : sum < target ? "<" : ">";
  const best = verdict === "<" ? "left" : verdict === ">" ? "right" : "lock";

  function stumble(text: string) {
    const count = stumbles + 1;
    setStumbles(count);
    setFlash({ text, id: count });
    if (count > forgiven) onAnswer(false);
  }

  function move(side: "left" | "right") {
    const nextLeft = side === "left" ? left + 1 : left;
    const nextRight = side === "right" ? right - 1 : right;
    if (nextLeft >= nextRight) {
      onAnswer(false);
      return;
    }
    setHistory([...history, [nextLeft, nextRight]]);
    if (verdict === "=") stumble("The sum already matched. That was the moment to lock it in.");
    else if (side === "left" && verdict === ">") stumble("The sum was too big. Moving the left pointer only grows it.");
    else if (side === "right" && verdict === "<") stumble("The sum was too small. Moving the right pointer only shrinks it.");
  }

  function lock() {
    if (verdict === "=") onAnswer(true);
    else stumble(`${sum} is not ${target} yet.`);
  }

  useKeyLayer(
    LAYER.CHALLENGE,
    (event) => {
      const arrow = arrowOf(event);
      if (arrow === "right") {
        move("left");
        return true;
      }
      if (arrow === "left") {
        move("right");
        return true;
      }
      if (arrow) return true;
      if (isConfirm(event)) {
        if (!event.repeat) lock();
        return true;
      }
      if (isBack(event)) {
        setHistory((previous) => (previous.length > 1 ? previous.slice(0, -1) : previous));
        return true;
      }
      return false;
    },
    { enabled: active },
  );

  return (
    <div className="play">
      <div className="pointer-row" style={{ gridTemplateColumns: `repeat(${values.length}, minmax(0, 1fr))` }}>
        {values.map((value, index) => (
          <div
            key={index}
            className={`pointer-cell ${index === left ? "is-left" : ""} ${index === right ? "is-right" : ""} ${
              index < left || index > right ? "out" : ""
            }`}
          >
            <span className="pointer-value">{value}</span>
            <span className="pointer-tag">{index === left ? "L" : index === right ? "R" : ""}</span>
          </div>
        ))}
      </div>
      <div className="pointer-sum">
        <span>
          {values[left]} + {values[right]} = <b>{sum}</b>
        </span>
        <span className={`verdict v-${best}`}>{verdict}</span>
        <span>
          target <b>{target}</b>
        </span>
      </div>
      <div className="pointer-controls">
        <button
          type="button"
          tabIndex={-1}
          disabled={!active}
          className={`chip ${senior && best === "right" ? "assist" : ""}`}
          onClick={() => move("right")}
        >
          ← move R
        </button>
        <button
          type="button"
          tabIndex={-1}
          disabled={!active}
          className={`chip gold ${senior && best === "lock" ? "assist" : ""}`}
          onClick={lock}
        >
          Lock in
        </button>
        <button
          type="button"
          tabIndex={-1}
          disabled={!active}
          className={`chip ${senior && best === "left" ? "assist" : ""}`}
          onClick={() => move("left")}
        >
          move L →
        </button>
      </div>
      <p className="tally">
        Moves {history.length - 1} · Stumbles {stumbles}/{forgiven}
      </p>
      {flash && (
        <Notice tone="warn" key={flash.id}>
          {flash.text}
        </Notice>
      )}
      <Legend
        keys={[
          ["→", "left pointer in"],
          ["←", "right pointer in"],
          ["Z", "lock in"],
          ["⌫", "undo"],
        ]}
      />
    </div>
  );
}
