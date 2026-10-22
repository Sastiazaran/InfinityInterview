"use client";

import { EGG_IDS } from "@/game/contracts";
import { chapterOf, climbName } from "@/game/climb";
import { STORY } from "@/game/story";
import type { Save } from "@/game/types";
import { isMenu, LAYER, useKeyLayer } from "@/components/keys";
import { Menu } from "@/components/ui/Menu";
import { Icon } from "@/components/ui/Sprites";
import { KeyHint, Panel } from "./Panel";

export function Pause({
  save,
  inDuel,
  cursor = 0,
  onCursor,
  onResume,
  onSatchel,
  onShop,
  onCodex,
  onSecrets,
  onControls,
  onRestart,
  onTitle,
  onStartOver,
}: {
  save: Save;
  inDuel: boolean;
  /** Where the cursor rests when the menu reopens after a sub-panel closes. */
  cursor?: number;
  onCursor?: (index: number) => void;
  onResume: () => void;
  onSatchel: () => void;
  onShop: () => void;
  onCodex: () => void;
  onSecrets: () => void;
  onControls: () => void;
  onRestart: () => void;
  onTitle: () => void;
  onStartOver: () => void;
}) {
  const run = save.run;
  const chapter = run ? chapterOf(run) : null;

  useKeyLayer(
    LAYER.PANEL + 1,
    (event) => {
      if (isMenu(event)) {
        if (!event.repeat) onResume();
        return true;
      }
      return false;
    },
  );

  return (
    <Panel
      title="Paused"
      className="pause"
      footer={
        <KeyHint
          keys={[
            ["↑↓", "choose"],
            ["Z", "select"],
            ["Esc", "resume"],
          ]}
        />
      }
    >
      {chapter && run && (
        <p className="pause-sub">
          {chapter.name}: {chapter.title} · {run.hearts}/{run.maxHearts} hearts · {save.gold} gold
        </p>
      )}
      <Menu
        label="Pause menu"
        onBack={onResume}
        initial={cursor}
        onCursor={(_, index) => onCursor?.(index)}
        items={[
          { id: "resume", label: "Resume", onSelect: onResume },
          { id: "satchel", label: "Satchel", icon: <Icon id="potion" scale={1} />, onSelect: onSatchel },
          {
            id: "shop",
            label: "Shop",
            icon: <Icon id="coin" scale={1} />,
            detail: inDuel ? "Not during a duel" : `${STORY.npcs.merchant.name} also trades on the map`,
            disabled: inDuel,
            onSelect: onShop,
          },
          { id: "codex", label: "Codex", icon: <Icon id="scroll" scale={1} />, onSelect: onCodex },
          {
            id: "secrets",
            label: `Secrets ${save.secrets.length}/${EGG_IDS.length}`,
            icon: <Icon id="star" scale={1} />,
            onSelect: onSecrets,
          },
          { id: "controls", label: "Controls", icon: <Icon id="key" scale={1} />, onSelect: onControls },
          {
            id: "restart",
            label: run?.path ? "Restart this level" : "Restart this Bloodline",
            detail: run ? `A fresh climb of ${climbName(run)}` : undefined,
            disabled: !run,
            onSelect: onRestart,
          },
          { id: "title", label: "Return to title", detail: "Your climb waits under Continue", onSelect: onTitle },
          { id: "wipe", label: "Start over", detail: "Erase the whole save", onSelect: onStartOver },
        ]}
      />
    </Panel>
  );
}
