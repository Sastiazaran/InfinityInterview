"use client";

import { useState } from "react";
import type { BoxChallenge, Mcq, ModelChallenge } from "@/game/types";
import { arrowOf, digitOf, isConfirm, LAYER, useKeyLayer, wrapIndex } from "@/components/keys";
import { Legend, type ChallengeProps } from "./shared";

const CROSSED = "A senior crossed this out.";

export function ChoiceView({ challenge, active, eliminated, onAnswer }: ChallengeProps<Mcq | ModelChallenge>) {
  const [cursor, setCursor] = useState(0);
  const options = challenge.options;

  function pick(index: number) {
    if (eliminated.includes(index) || index < 0 || index >= options.length) return;
    onAnswer(index === challenge.answer);
  }

  useKeyLayer(
    LAYER.CHALLENGE,
    (event) => {
      const digit = digitOf(event);
      if (digit !== null && digit >= 1 && digit <= options.length) {
        if (!event.repeat) pick(digit - 1);
        return true;
      }
      const arrow = arrowOf(event);
      if (arrow) {
        const step = arrow === "up" || arrow === "left" ? -1 : 1;
        setCursor((value) => wrapIndex(value + step, options.length));
        return true;
      }
      if (isConfirm(event)) {
        if (!event.repeat) pick(cursor);
        return true;
      }
      return false;
    },
    { enabled: active },
  );

  return (
    <div className="play">
      <div className="choices" role="listbox" aria-label="Answers">
        {options.map((option, index) => {
          const gone = eliminated.includes(index);
          return (
            <button
              key={`${index}-${option}`}
              type="button"
              tabIndex={-1}
              role="option"
              aria-selected={cursor === index}
              className={`choice ${cursor === index ? "on" : ""} ${gone ? "gone" : ""}`}
              disabled={gone || !active}
              onMouseEnter={() => setCursor(index)}
              onClick={() => pick(index)}
            >
              <kbd>{index + 1}</kbd>
              <span>{gone ? CROSSED : option}</span>
            </button>
          );
        })}
      </div>
      <Legend
        keys={[
          [`1–${options.length}`, "answer"],
          ["↑↓", "choose"],
          ["Z", "confirm"],
        ]}
      />
    </div>
  );
}

export function BoxView({ challenge, active, eliminated, onAnswer }: ChallengeProps<BoxChallenge>) {
  const [cursor, setCursor] = useState(0);
  const cards = challenge.cards;

  function pick(index: number) {
    if (eliminated.includes(index) || !cards[index]) return;
    onAnswer(cards[index].id === challenge.answer);
  }

  useKeyLayer(
    LAYER.CHALLENGE,
    (event) => {
      const digit = digitOf(event);
      if (digit !== null && digit >= 1 && digit <= cards.length) {
        if (!event.repeat) pick(digit - 1);
        return true;
      }
      const arrow = arrowOf(event);
      if (arrow) {
        const step = arrow === "left" ? -1 : arrow === "right" ? 1 : arrow === "up" ? -2 : 2;
        setCursor((value) => wrapIndex(value + step, cards.length));
        return true;
      }
      if (isConfirm(event)) {
        if (!event.repeat) pick(cursor);
        return true;
      }
      return false;
    },
    { enabled: active },
  );

  return (
    <div className="play">
      <div className="box-frame" aria-hidden>
        <span>The box</span>
      </div>
      <div className="cards">
        {cards.map((card, index) => {
          const gone = eliminated.includes(index);
          return (
            <button
              key={card.id}
              type="button"
              tabIndex={-1}
              className={`card ${cursor === index ? "on" : ""} ${gone ? "gone" : ""}`}
              disabled={gone || !active}
              onMouseEnter={() => setCursor(index)}
              onClick={() => pick(index)}
            >
              <kbd>{index + 1}</kbd>
              <strong>{gone ? CROSSED : card.label}</strong>
              {!gone && <span>{card.detail}</span>}
            </button>
          );
        })}
      </div>
      <Legend
        keys={[
          [`1–${cards.length}`, "place a card"],
          ["←↑↓→", "choose"],
          ["Z", "confirm"],
        ]}
      />
    </div>
  );
}
