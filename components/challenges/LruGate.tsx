"use client";

import { useState } from "react";
import type { LruChallenge } from "@/game/types";
import { lruTimeline } from "@/game/content/minigames";
import { digitOf, isConfirm, LAYER, useKeyLayer } from "@/components/keys";
import { Legend, Notice, type ChallengeProps } from "./shared";

export function LruGate({ challenge, active, senior, onAnswer }: ChallengeProps<LruChallenge>) {
  const { capacity, requests } = challenge;
  const timeline = lruTimeline(capacity, requests);
  const [at, setAt] = useState(0);
  const [stumbles, setStumbles] = useState(0);
  const [warning, setWarning] = useState<{ text: string; id: number } | null>(null);
  const step = timeline[Math.min(at, timeline.length - 1)];
  const slots = at < timeline.length ? step.before : step.after;
  const forgiven = challenge.stumbles;

  function lastUse(key: string): number {
    for (let index = at - 1; index >= 0; index--) if (requests[index] === key) return at - index;
    return -1;
  }

  function wrong(text: string) {
    const count = stumbles + 1;
    setStumbles(count);
    setWarning({ text, id: count });
    if (count > forgiven) onAnswer(false);
  }

  function advance() {
    setWarning(null);
    const next = at + 1;
    setAt(next);
    if (next >= requests.length) onAnswer(true);
  }

  function serve() {
    if (at >= requests.length) return;
    if (step.evict !== null) wrong(`The cache is full and ${step.key} is not in it. Someone has to leave.`);
    else advance();
  }

  function evict(slot: number) {
    if (at >= requests.length || slot < 0 || slot >= capacity) return;
    if (step.evict === null) {
      wrong(step.hit ? `${step.key} is already cached. That is a hit: just serve it.` : "There is still a free slot.");
      return;
    }
    if (slot !== step.evict) {
      wrong(`${slots[slot]} was touched more recently than another key.`);
      return;
    }
    advance();
  }

  useKeyLayer(
    LAYER.CHALLENGE,
    (event) => {
      const digit = digitOf(event);
      if (digit !== null && digit >= 1 && digit <= capacity) {
        if (!event.repeat) evict(digit - 1);
        return true;
      }
      if (isConfirm(event)) {
        if (!event.repeat) serve();
        return true;
      }
      return false;
    },
    { enabled: active },
  );

  return (
    <div className="play">
      <div className="lru-requests" aria-label="Requests">
        {requests.map((key, index) => (
          <span
            key={index}
            className={`req ${index < at ? "done" : index === at ? "now" : ""} ${
              index < at ? (timeline[index].hit ? "hit" : "miss") : ""
            }`}
          >
            {key}
          </span>
        ))}
      </div>
      <p className="lru-ask">
        {at < requests.length ? (
          <>
            Request <b>{step.key}</b>
          </>
        ) : (
          "Every request served."
        )}
      </p>
      <div className="lru-slots" style={{ gridTemplateColumns: `repeat(${capacity}, minmax(0, 1fr))` }}>
        {slots.map((key, index) => {
          const age = key ? lastUse(key) : -1;
          return (
            <button
              key={index}
              type="button"
              tabIndex={-1}
              disabled={!active}
              className={`slot ${key ? "" : "empty"} ${key && key === step.key && at < requests.length ? "match" : ""}`}
              onClick={() => evict(index)}
            >
              <kbd>{index + 1}</kbd>
              <b>{key || "free"}</b>
              {senior && key && <span className="slot-age">used {age} ago</span>}
            </button>
          );
        })}
      </div>
      <div className="keypad">
        <button type="button" tabIndex={-1} className="chip gold wide" disabled={!active} onClick={serve}>
          Serve (hit or free slot)
        </button>
      </div>
      <p className="tally">
        Served {Math.min(at, requests.length)} / {requests.length} · Stumbles {stumbles}/{forgiven}
      </p>
      {warning && (
        <Notice tone="warn" key={warning.id}>
          {warning.text}
        </Notice>
      )}
      <Legend
        keys={[
          ["Z", "serve"],
          [`1–${capacity}`, "evict that slot"],
        ]}
      />
    </div>
  );
}
