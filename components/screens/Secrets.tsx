"use client";

import { EGG_IDS, EGGS, fillLine } from "@/game/contracts";
import { STORY } from "@/game/story";
import type { Save } from "@/game/types";
import { isBack, isConfirm, isMenu, LAYER, useKeyLayer } from "@/components/keys";
import { Icon } from "@/components/ui/Sprites";
import { KeyHint, Panel } from "./Panel";

export function Secrets({ save, onClose }: { save: Save; onClose: () => void }) {
  useKeyLayer(
    LAYER.PANEL,
    (event) => {
      if (isBack(event) || isMenu(event) || isConfirm(event)) {
        if (!event.repeat) onClose();
        return true;
      }
      return false;
    },
    { modal: true },
  );

  const bloodline = save.run?.bloodline ?? save.lastBloodline;

  return (
    <Panel
      title={`Secrets ${save.secrets.length}/${EGG_IDS.length}`}
      className="secrets"
      footer={<KeyHint keys={[["X", "close"]]} />}
    >
      <p className="muted">Some secrets are walked into, some are read, some are typed. One only needs patience.</p>
      <ul className="secret-grid">
        {EGG_IDS.map((id) => {
          const found = save.secrets.includes(id);
          const egg = EGGS[id];
          return (
            <li key={id} className={found ? "found" : "hidden"}>
              <Icon id={found ? "star" : "key"} scale={2} />
              <div>
                <b>{found ? STORY.eggs[id].title : "???"}</b>
                {found ? (
                  <>
                    <span>{egg.trigger}</span>
                    <small>
                      {egg.gold ? `+${egg.gold} gold` : ""}
                      {egg.gold && egg.perk ? " · " : ""}
                      {egg.perk}
                    </small>
                    <em>{fillLine(STORY.eggs[id].lines[0] ?? "", { bloodline, gold: save.gold })}</em>
                  </>
                ) : (
                  <span>Still hidden.</span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}
