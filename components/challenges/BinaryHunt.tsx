"use client";

import { useState } from "react";
import type { BinaryChallenge } from "@/game/types";
import { arrowOf, digitOf, isBack, isConfirm, LAYER, useKeyLayer } from "@/components/keys";
import { Legend, Notice, type ChallengeProps } from "./shared";

type Probe = { value: number; verdict: "higher" | "lower" | "found" };

const PAD = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];

export function BinaryHunt({ challenge, active, senior, onAnswer }: ChallengeProps<BinaryChallenge>) {
  const { max, secret, guesses } = challenge;
  const [entry, setEntry] = useState("");
  const [probes, setProbes] = useState<Probe[]>([]);
  const [warning, setWarning] = useState<{ text: string; id: number } | null>(null);
  const low = probes.reduce((value, probe) => (probe.verdict === "higher" ? Math.max(value, probe.value + 1) : value), 1);
  const high = probes.reduce(
    (value, probe) => (probe.verdict === "lower" ? Math.min(value, probe.value - 1) : value),
    max,
  );
  const left = guesses - probes.length;
  const middle = Math.floor((low + high) / 2);
  const width = String(max).length;

  function type(digit: number) {
    setEntry((value) => (value.length >= width ? value : value === "0" ? String(digit) : value + String(digit)));
  }

  function nudge(step: number) {
    setEntry((value) => {
      const current = value ? Number(value) : step > 0 ? low - 1 : high + 1;
      return String(Math.min(max, Math.max(1, current + step)));
    });
  }

  function probe() {
    const value = Number(entry);
    if (!entry || !Number.isInteger(value) || value < 1 || value > max) {
      setWarning({ text: `Type a number from 1 to ${max}.`, id: probes.length * 10 + entry.length });
      return;
    }
    const verdict: Probe["verdict"] = value === secret ? "found" : value < secret ? "higher" : "lower";
    const next = [...probes, { value, verdict }];
    setProbes(next);
    setEntry("");
    setWarning(null);
    if (verdict === "found") onAnswer(true);
    else if (next.length >= guesses) onAnswer(false);
  }

  useKeyLayer(
    LAYER.CHALLENGE,
    (event) => {
      const digit = digitOf(event);
      if (digit !== null) {
        type(digit);
        return true;
      }
      if (isBack(event)) {
        setEntry((value) => value.slice(0, -1));
        return true;
      }
      const arrow = arrowOf(event);
      if (arrow === "up" || arrow === "right") {
        nudge(1);
        return true;
      }
      if (arrow === "down" || arrow === "left") {
        nudge(-1);
        return true;
      }
      if (isConfirm(event)) {
        if (!event.repeat) probe();
        return true;
      }
      return false;
    },
    { enabled: active },
  );

  const span = Math.max(1, max);
  const pct = (value: number) => `${((value - 1) / span) * 100}%`;

  return (
    <div className="play">
      <div className="numberline" aria-label={`Still possible: ${low} to ${high}`}>
        <div className="numberline-live" style={{ left: pct(low), width: `${((high - low + 1) / span) * 100}%` }} />
        {probes.map((item, index) => (
          <span key={index} className={`numberline-probe ${item.verdict}`} style={{ left: pct(item.value) }}>
            {item.value}
          </span>
        ))}
        <span className="numberline-end start">1</span>
        <span className="numberline-end end">{max}</span>
      </div>
      <div className="hunt">
        <div className="hunt-entry" aria-live="polite">
          <span className="hunt-label">Your guess</span>
          <b>{entry || "—"}</b>
        </div>
        <div className="hunt-range">
          Still possible <b>{low}</b>…<b>{high}</b>
          <span>
            {left} guess{left === 1 ? "" : "es"} left
          </span>
          {senior && <span className="assist-text">Midpoint: ⌊({low} + {high}) / 2⌋ = {middle}</span>}
        </div>
      </div>
      <ol className="hunt-log">
        {probes.map((item, index) => (
          <li key={index} className={item.verdict}>
            {item.value}: {item.verdict === "found" ? "found it" : item.verdict === "higher" ? "go higher" : "go lower"}
          </li>
        ))}
      </ol>
      {warning && (
        <Notice tone="warn" key={warning.id}>
          {warning.text}
        </Notice>
      )}
      <div className="keypad">
        {PAD.map((digit) => (
          <button key={digit} type="button" tabIndex={-1} className="chip" disabled={!active} onClick={() => type(digit)}>
            {digit}
          </button>
        ))}
        <button
          type="button"
          tabIndex={-1}
          className="chip ghost"
          disabled={!active}
          onClick={() => setEntry((value) => value.slice(0, -1))}
        >
          ⌫
        </button>
        <button type="button" tabIndex={-1} className="chip gold" disabled={!active} onClick={probe}>
          Probe
        </button>
      </div>
      <Legend
        keys={[
          ["0–9", "type"],
          ["↑↓", "nudge"],
          ["⌫", "delete"],
          ["Z", "probe"],
        ]}
      />
    </div>
  );
}
