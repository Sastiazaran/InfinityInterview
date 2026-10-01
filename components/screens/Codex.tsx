"use client";

import { useState } from "react";
import { toRoman } from "@/game/contracts";
import type { Save } from "@/game/types";
import { arrowOf, isBack, isMenu, LAYER, useKeyLayer, wrapIndex } from "@/components/keys";
import { KeyHint, Panel } from "./Panel";

const TOPIC: Record<string, string> = {
  algo: "Algorithms",
  system: "Systems",
  craft: "Craft",
  specialist: "Specialist",
  boss: "Throne",
};

export function Codex({ save, onClose }: { save: Save; onClose: () => void }) {
  const entries = save.codex;
  const [cursor, setCursor] = useState(0);
  const at = Math.min(cursor, Math.max(0, entries.length - 1));
  const entry = entries[at];

  useKeyLayer(
    LAYER.PANEL,
    (event) => {
      const arrow = arrowOf(event);
      if (arrow === "up" || arrow === "left") {
        setCursor(wrapIndex(at - 1, entries.length));
        return true;
      }
      if (arrow === "down" || arrow === "right") {
        setCursor(wrapIndex(at + 1, entries.length));
        return true;
      }
      if (isBack(event) || isMenu(event) || event.key === "z" || event.key === "Z" || event.key === "Enter") {
        if (!event.repeat) onClose();
        return true;
      }
      return false;
    },
    { modal: true },
  );

  return (
    <Panel
      title="Codex"
      className="codex"
      footer={
        <KeyHint
          keys={[
            ["↑↓", "browse"],
            ["X", "close"],
          ]}
        />
      }
    >
      {entries.length === 0 ? (
        <p className="empty">No misses yet. Every miss is written here with the principle behind it.</p>
      ) : (
        <div className="codex-grid">
          <ol className="codex-list">
            {entries.map((item, index) => (
              <li key={item.id}>
                <button
                  type="button"
                  tabIndex={-1}
                  className={index === at ? "on" : ""}
                  onClick={() => setCursor(index)}
                >
                  <small>
                    {TOPIC[item.topic] ?? item.topic} · {toRoman(item.bloodline)}
                  </small>
                  {item.principle}
                </button>
              </li>
            ))}
          </ol>
          {entry && (
            <article className="codex-entry">
              <p className="duel-kind">
                {TOPIC[entry.topic] ?? entry.topic} · Bloodline {toRoman(entry.bloodline)} · {at + 1}/{entries.length}
              </p>
              <h3>{entry.principle}</h3>
              <p className="codex-prompt">{entry.prompt}</p>
              <dl className="lesson">
                <dt>Answer</dt>
                <dd>{entry.reveal}</dd>
                <dt>Why it matters</dt>
                <dd>{entry.why}</dd>
              </dl>
            </article>
          )}
        </div>
      )}
    </Panel>
  );
}
