"use client";

import { useState } from "react";
import type { BracketChallenge } from "@/game/types";
import { bracketTop, CLOSER, CLOSERS } from "@/game/content/minigames";
import { digitOf, isBack, isConfirm, LAYER, useKeyLayer } from "@/components/keys";
import { Legend, Notice, type ChallengeProps } from "./shared";

/** Indices of openers that already have a partner inside the tokens. */
function matchedOpeners(tokens: string[]): Set<number> {
  const stack: number[] = [];
  const matched = new Set<number>();
  tokens.forEach((token, index) => {
    if (CLOSER[token]) stack.push(index);
    else {
      const opener = stack.pop();
      if (opener !== undefined) {
        matched.add(opener);
        matched.add(index);
      }
    }
  });
  return matched;
}

export function BracketForge({ challenge, active, senior, onAnswer }: ChallengeProps<BracketChallenge>) {
  const { tokens, answer } = challenge;
  const [typed, setTyped] = useState<string[]>([]);
  const [warning, setWarning] = useState<{ text: string; id: number } | null>(null);
  const need = answer.length;
  const matched = senior ? matchedOpeners(tokens) : new Set<number>();
  const next = senior && typed.length < need ? bracketTop(tokens, typed.length) : -1;

  function add(closer: string) {
    setWarning(null);
    setTyped((previous) => (previous.length >= need ? previous : [...previous, closer]));
  }

  function commit() {
    if (typed.length < need) {
      setWarning({ text: `${need - typed.length} still open. Close them all, then strike.`, id: typed.length });
      return;
    }
    onAnswer(typed.every((closer, index) => closer === answer[index]));
  }

  useKeyLayer(
    LAYER.CHALLENGE,
    (event) => {
      if ((CLOSERS as readonly string[]).includes(event.key)) {
        add(event.key);
        return true;
      }
      const digit = digitOf(event);
      if (digit !== null && digit >= 1 && digit <= CLOSERS.length) {
        add(CLOSERS[digit - 1]);
        return true;
      }
      if (isBack(event)) {
        setTyped((previous) => previous.slice(0, -1));
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
      <div className="forge" aria-label="Brackets">
        {tokens.map((token, index) => (
          <span
            key={index}
            className={`glyph ${CLOSER[token] ? "opener" : "closer"} ${matched.has(index) ? "dim" : ""} ${
              index === next ? "next" : ""
            }`}
          >
            {token}
          </span>
        ))}
        {typed.map((closer, index) => (
          <span key={`t-${index}`} className="glyph typed">
            {closer}
          </span>
        ))}
        {typed.length < need && <span className="glyph caret">_</span>}
      </div>
      <p className="tally">
        {typed.length} of {need} closed
      </p>
      {warning && (
        <Notice tone="warn" key={warning.id}>
          {warning.text}
        </Notice>
      )}
      <div className="keypad">
        {CLOSERS.map((closer, index) => (
          <button key={closer} type="button" tabIndex={-1} className="chip mono" disabled={!active} onClick={() => add(closer)}>
            <kbd>{index + 1}</kbd> {closer}
          </button>
        ))}
        <button
          type="button"
          tabIndex={-1}
          className="chip ghost"
          disabled={!active}
          onClick={() => setTyped((previous) => previous.slice(0, -1))}
        >
          ⌫
        </button>
        <button type="button" tabIndex={-1} className="chip gold" disabled={!active} onClick={commit}>
          Strike
        </button>
      </div>
      <Legend
        keys={[
          [") ] } >", "close"],
          ["1–4", "same"],
          ["⌫", "undo"],
          ["Z", "strike"],
        ]}
      />
    </div>
  );
}
