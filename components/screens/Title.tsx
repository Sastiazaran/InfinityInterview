"use client";

import { useState } from "react";
import { ART } from "@/game/art";
import { EGG_IDS, fillLine, toRoman } from "@/game/contracts";
import { STORY } from "@/game/story";
import { bloodlineFacts } from "@/game/balance";
import { enemyOf, nodeAt } from "@/game/route";
import type { Save } from "@/game/types";
import { SpriteCanvas } from "@/components/art/SpriteCanvas";
import { arrowOf, isBack, isConfirm, LAYER, useKeyLayer } from "@/components/keys";
import { Menu, type MenuItem } from "@/components/ui/Menu";
import { Coin } from "@/components/ui/Sprites";
import { KeyHint } from "./Panel";

export function Title({
  save,
  enabled,
  onContinue,
  onStart,
  onCodex,
  onSecrets,
  onControls,
  onStartOver,
}: {
  save: Save;
  enabled: boolean;
  onContinue: () => void;
  onStart: (bloodline: number) => void;
  onCodex: () => void;
  onSecrets: () => void;
  onControls: () => void;
  onStartOver: () => void;
}) {
  const [mode, setMode] = useState<"menu" | "select">("menu");
  const [pick, setPick] = useState(Math.min(save.unlocked, Math.max(1, save.lastBloodline)));
  const chosen = Math.min(pick, save.unlocked);
  const chapter = STORY.chapter(chosen);
  const run = save.run;

  useKeyLayer(
    LAYER.SCREEN,
    (event) => {
      const arrow = arrowOf(event);
      if (arrow === "left" || arrow === "down") {
        setPick(Math.max(1, chosen - 1));
        return true;
      }
      if (arrow === "right" || arrow === "up") {
        setPick(Math.min(save.unlocked, chosen + 1));
        return true;
      }
      if (isConfirm(event)) {
        if (!event.repeat) onStart(chosen);
        return true;
      }
      if (isBack(event) || event.key === "Escape") {
        setMode("menu");
        return true;
      }
      return false;
    },
    { enabled: enabled && mode === "select", modal: true },
  );

  const items: MenuItem[] = [];
  if (run) {
    const node = nodeAt(run.nodeIndex);
    items.push({
      id: "continue",
      label: "Continue",
      detail: `Bloodline ${toRoman(run.bloodline)} · ${node.place} · ${STORY.enemies[enemyOf(run.nodeIndex, run.bloodline)].name}${
        run.duel ? " (mid-duel)" : ""
      }`,
      onSelect: onContinue,
    });
  }
  items.push(
    {
      id: "new",
      label: "New climb",
      detail: `Choose a Bloodline, I to ${toRoman(save.unlocked)}`,
      onSelect: () => {
        setPick(Math.min(save.unlocked, Math.max(1, save.lastBloodline)));
        setMode("select");
      },
    },
    { id: "codex", label: "Codex", detail: `${save.codex.length} lessons from past misses`, onSelect: onCodex },
    { id: "secrets", label: "Secrets", detail: `${save.secrets.length}/${EGG_IDS.length} found`, onSelect: onSecrets },
    { id: "controls", label: "Controls", onSelect: onControls },
    { id: "wipe", label: "Start over", detail: "Erase this save", onSelect: onStartOver },
  );

  return (
    <section className="title-screen">
      <SpriteCanvas sprite={ART.backdrops.throne} className="title-bg" label="" />
      <div className="title-veil" />
      <div className="title-card">
        <p className="title-kicker">An interview castle</p>
        <h1 className="title-name">{STORY.title}</h1>
        <p className="title-tagline">{fillLine(STORY.tagline, { bloodline: chosen, gold: save.gold })}</p>
        <div className="title-purse">
          <Coin amount={save.gold} />
          <span>
            Highest Bloodline <b>{toRoman(save.unlocked)}</b>
          </span>
        </div>

        {mode === "menu" ? (
          <Menu items={items} priority={LAYER.SCREEN} enabled={enabled} label="Title menu" className="title-menu" />
        ) : (
          <div className="selector" aria-live="polite">
            <div className="selector-row">
              <button
                type="button"
                tabIndex={-1}
                className="chip ghost"
                disabled={chosen <= 1}
                onClick={() => setPick(Math.max(1, chosen - 1))}
                aria-label="Previous Bloodline"
              >
                ◀
              </button>
              <div className="selector-numeral">
                <span>Bloodline</span>
                <b>{chapter.numeral}</b>
              </div>
              <button
                type="button"
                tabIndex={-1}
                className="chip ghost"
                disabled={chosen >= save.unlocked}
                onClick={() => setPick(Math.min(save.unlocked, chosen + 1))}
                aria-label="Next Bloodline"
              >
                ▶
              </button>
            </div>
            <p className="selector-title">{chapter.title}</p>
            <p className="selector-epigraph">{fillLine(chapter.epigraph, { bloodline: chosen, gold: save.gold })}</p>
            <ul className="selector-facts">
              {bloodlineFacts(chosen).map((fact) => (
                <li key={fact}>{fact}</li>
              ))}
            </ul>
            <p className="muted small">
              Finish a climb of Bloodline {toRoman(save.unlocked)}, win or lose, to unlock Bloodline{" "}
              {toRoman(save.unlocked + 1)}.
            </p>
            <button type="button" tabIndex={-1} className="btn gold" onClick={() => onStart(chosen)}>
              Climb Bloodline {chapter.numeral}
            </button>
            <KeyHint
              keys={[
                ["← →", "choose"],
                ["Z", "climb"],
                ["X", "back"],
              ]}
            />
          </div>
        )}
      </div>
    </section>
  );
}
