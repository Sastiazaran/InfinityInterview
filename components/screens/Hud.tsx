"use client";

import { useEffect, useRef, useState } from "react";
import { EGG_IDS } from "@/game/contracts";
import { chapterOf, guardianAt, placeAt } from "@/game/climb";
import type { Save } from "@/game/types";
import { Hearts, Icon } from "@/components/ui/Sprites";

/** Counts toward a number so a purse visibly fills when gold lands. */
export function useCountUp(target: number) {
  const [shown, setShown] = useState(target);
  const current = useRef(target);
  useEffect(() => {
    const from = current.current;
    if (from === target) return;
    const start = performance.now();
    const duration = Math.min(1100, 260 + Math.abs(target - from) * 30);
    let frame = 0;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const value = Math.round(from + (target - from) * (1 - (1 - t) * (1 - t)));
      current.current = value;
      setShown(value);
      if (t < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target]);
  return shown;
}

export type GoldPop = { id: number; amount: number };

export function Hud({
  save,
  pops,
  onPopDone,
  onMenu,
}: {
  save: Save;
  pops: GoldPop[];
  onPopDone: (id: number) => void;
  onMenu: () => void;
}) {
  const gold = useCountUp(save.gold);
  const run = save.run;
  if (!run) return null;
  const chapter = chapterOf(run);
  const foe = guardianAt(run, run.nodeIndex).story;

  return (
    <header className="hud">
      <div className="hud-block hud-life">
        <Hearts current={run.hearts} max={run.maxHearts} />
        <span className="hud-purse">
          <Icon id="coin" />
          <b>{gold}</b>
          {pops.map((pop) => (
            <span key={pop.id} className="gold-pop" onAnimationEnd={() => onPopDone(pop.id)}>
              +{pop.amount}
            </span>
          ))}
        </span>
      </div>
      <div className="hud-block hud-chapter">
        <b>{chapter.name}</b>
        <span>{chapter.title}</span>
      </div>
      <div className="hud-block hud-tools">
        <span title="Hint charges">
          <kbd>H</kbd>
          {run.lifelines.hint}
        </span>
        <span title="Extra time charges">
          <kbd>T</kbd>
          {run.lifelines.time}
        </span>
        <span title="Ask a senior charges">
          <kbd>S</kbd>
          {run.lifelines.senior}
        </span>
        <span title="Secrets found">
          <Icon id="star" scale={1} />
          {save.secrets.length}/{EGG_IDS.length}
        </span>
        <button type="button" tabIndex={-1} className="chip ghost hud-menu" onClick={onMenu}>
          <kbd>Esc</kbd> Menu
        </button>
      </div>
      <p className="hud-goal">
        Next: <b>{placeAt(run, run.nodeIndex)}</b> · {foe.name}
      </p>
    </header>
  );
}
