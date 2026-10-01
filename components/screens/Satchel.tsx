"use client";

import { useState } from "react";
import { ITEM_EFFECTS } from "@/game/contracts";
import { STORY } from "@/game/story";
import { GEAR_MAX, SATCHEL_MAX } from "@/game/balance";
import { consumeItem, type UseResult } from "@/game/engine";
import { CONSUMABLE_IDS, GEAR_IDS, type ConsumableId, type Save } from "@/game/types";
import { useStore, type Store } from "@/components/store";
import { Menu } from "@/components/ui/Menu";
import { Icon } from "@/components/ui/Sprites";
import { KeyHint, Panel } from "./Panel";

const RESULT: Record<UseResult, (name: string) => string> = {
  used: (name) => `${name}: used.`,
  none: (name) => `No ${name} left. ${STORY.npcs.merchant.name} sells more.`,
  "full-hearts": () => "Your hearts are already full.",
  "no-climb": () => "Satchel items work during a climb.",
};

const EFFECT: Record<ConsumableId, string> = {
  potion: "One heart restored.",
  scroll: "One more Hint this climb.",
  sand: "One more Extra time this climb.",
  note: "One more Ask a senior this climb.",
};

export function Satchel({ store, onClose }: { store: Store<Save>; onClose: () => void }) {
  const save = useStore(store);
  const [message, setMessage] = useState<{ text: string; good: boolean; id: number } | null>(null);
  const run = save.run;

  function spend(item: ConsumableId) {
    const result = consumeItem(store.get(), item);
    store.set(result.save);
    const name = STORY.items[item].name;
    setMessage((previous) => ({
      text: result.result === "used" ? `${RESULT.used(name)} ${EFFECT[item]}` : RESULT[result.result](name),
      good: result.result === "used",
      id: (previous?.id ?? 0) + 1,
    }));
  }

  return (
    <Panel
      title="Satchel"
      className="satchel"
      footer={
        <KeyHint
          keys={[
            ["↑↓", "choose"],
            ["Z", "use"],
            ["X", "close"],
          ]}
        />
      }
    >
      {run && (
        <p className="pause-sub">
          <Icon id="heart" scale={1} /> {run.hearts}/{run.maxHearts} · Hint {run.lifelines.hint} · Extra time{" "}
          {run.lifelines.time} · Ask a senior {run.lifelines.senior}
        </p>
      )}
      <Menu
        label="Satchel items"
        onBack={onClose}
        items={CONSUMABLE_IDS.map((item) => ({
          id: item,
          label: STORY.items[item].name,
          icon: <Icon id={item} scale={2} />,
          detail: ITEM_EFFECTS[item],
          aside: (
            <b className="count">
              ×{save.satchel[item]}
              <small>/{SATCHEL_MAX}</small>
            </b>
          ),
          onSelect: () => spend(item),
        }))}
      />
      {message && (
        <p className={`notice ${message.good ? "good" : "warn"}`} key={message.id}>
          {message.text}
        </p>
      )}
      <h3 className="panel-sub">Gear</h3>
      <ul className="gear-list">
        {GEAR_IDS.map((gear) => (
          <li key={gear} className={save.gear[gear] ? "" : "missing"}>
            <Icon id={gear} scale={1} />
            <span>{STORY.items[gear].name}</span>
            <b>
              {GEAR_MAX[gear] > 1 ? `${save.gear[gear]}/${GEAR_MAX[gear]}` : save.gear[gear] ? "Owned" : "—"}
            </b>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
