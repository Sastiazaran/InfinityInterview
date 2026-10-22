"use client";

import { useState } from "react";
import { stepName } from "@/game/climb";
import { toRoman } from "@/game/contracts";
import { isPathId, PATHS } from "@/game/paths";
import type { CodexEntry, Save } from "@/game/types";
import { arrowOf, isBack, isMenu, LAYER, useKeyLayer, wrapIndex } from "@/components/keys";
import { inlineCode, PromptText } from "@/components/ui/PromptText";
import { KeyHint, Panel } from "./Panel";

const TOPIC: Record<string, string> = {
  algo: "Algorithms",
  system: "Systems",
  craft: "Craft",
  specialist: "Specialist",
  boss: "Throne",
};

function filedUnder(entry: CodexEntry): string {
  return isPathId(entry.topic) ? PATHS[entry.topic].name : (TOPIC[entry.topic] ?? entry.topic);
}

function shortStep(entry: CodexEntry): string {
  return isPathId(entry.topic) ? `Lv ${entry.bloodline}` : toRoman(entry.bloodline);
}

function stepOf(entry: CodexEntry): string {
  return stepName(isPathId(entry.topic) ? entry.topic : null, entry.bloodline);
}

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
                    {filedUnder(item)} · {shortStep(item)}
                  </small>
                  {item.principle}
                </button>
              </li>
            ))}
          </ol>
          {entry && (
            <article className="codex-entry">
              <p className="duel-kind">
                {filedUnder(entry)} · {stepOf(entry)} · {at + 1}/{entries.length}
              </p>
              <h3>{entry.principle}</h3>
              <PromptText className="codex-prompt" text={entry.prompt} />
              <dl className="lesson">
                <dt>Answer</dt>
                <dd>{inlineCode(entry.reveal)}</dd>
                <dt>Why it matters</dt>
                <dd>{inlineCode(entry.why)}</dd>
              </dl>
            </article>
          )}
        </div>
      )}
    </Panel>
  );
}
