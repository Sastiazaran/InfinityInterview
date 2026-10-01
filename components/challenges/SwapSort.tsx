"use client";

import { useState } from "react";
import type { SwapChallenge } from "@/game/types";
import { arrowOf, isConfirm, LAYER, useKeyLayer } from "@/components/keys";
import { Legend, type ChallengeProps } from "./shared";

function sorted(values: number[]): boolean {
  return values.every((value, index) => index === 0 || values[index - 1] <= value);
}

export function SwapSort({ challenge, active, senior, onAnswer }: ChallengeProps<SwapChallenge>) {
  const [values, setValues] = useState(challenge.values);
  const [cursor, setCursor] = useState(0);
  const [used, setUsed] = useState(0);
  const [last, setLast] = useState<{ at: number; id: number } | null>(null);
  const top = Math.max(...values);
  const pairs = values.length - 1;

  function swap(at: number) {
    if (at < 0 || at >= pairs) return;
    const next = [...values];
    [next[at], next[at + 1]] = [next[at + 1], next[at]];
    const count = used + 1;
    setValues(next);
    setUsed(count);
    setLast({ at, id: count });
    if (sorted(next)) onAnswer(true);
    else if (count >= challenge.budget) onAnswer(false);
  }

  useKeyLayer(
    LAYER.CHALLENGE,
    (event) => {
      const arrow = arrowOf(event);
      if (arrow === "left" || arrow === "right") {
        setCursor((value) => Math.min(pairs - 1, Math.max(0, value + (arrow === "left" ? -1 : 1))));
        return true;
      }
      if (arrow) return true;
      if (isConfirm(event)) {
        if (!event.repeat) swap(cursor);
        return true;
      }
      return false;
    },
    { enabled: active },
  );

  return (
    <div className="play">
      <div className="bars" style={{ gridTemplateColumns: `repeat(${values.length}, minmax(0, 1fr))` }}>
        {values.map((value, index) => {
          const inverted = senior && index < pairs && values[index] > values[index + 1];
          const picked = index === cursor || index === cursor + 1;
          const moved = last && (index === last.at || index === last.at + 1);
          return (
            <button
              key={`${index}-${value}-${last?.id ?? 0}`}
              type="button"
              tabIndex={-1}
              disabled={!active}
              className={`bar ${picked ? "picked" : ""} ${inverted ? "inverted" : ""} ${moved ? "moved" : ""}`}
              onClick={() => {
                const at = Math.min(pairs - 1, index);
                setCursor(at);
                swap(at);
              }}
            >
              <span className="bar-fill" style={{ height: `${18 + (value / top) * 82}%` }} />
              <span className="bar-value">{value}</span>
            </button>
          );
        })}
      </div>
      <div className="swap-cursor" style={{ gridTemplateColumns: `repeat(${values.length}, minmax(0, 1fr))` }} aria-hidden>
        <span style={{ gridColumn: `${cursor + 1} / span 2` }}>⇄</span>
      </div>
      <p className="tally">
        Swaps {used} / {challenge.budget}
      </p>
      <Legend
        keys={[
          ["←→", "pick a pair"],
          ["Z", "swap"],
        ]}
      />
    </div>
  );
}
