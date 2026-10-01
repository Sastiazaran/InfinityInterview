"use client";

import { useState } from "react";
import { ART } from "@/game/art";
import { fillLine, ITEM_EFFECTS, ITEM_IDS, type ItemId } from "@/game/contracts";
import { STORY } from "@/game/story";
import { GEAR_MAX, isGear, SATCHEL_MAX } from "@/game/balance";
import { buy, canStillBuy, priceOf } from "@/game/engine";
import { lineFrom } from "@/game/rng";
import type { Save } from "@/game/types";
import { SpriteCanvas } from "@/components/art/SpriteCanvas";
import { useStore, type Store } from "@/components/store";
import { useTypewriter } from "@/components/ui/Dialog";
import { Menu, type MenuItem } from "@/components/ui/Menu";
import { Coin, Icon } from "@/components/ui/Sprites";
import { KeyHint, Panel } from "./Panel";

function ownedLabel(save: Save, item: ItemId): string {
  if (isGear(item)) {
    const tier = save.gear[item];
    return GEAR_MAX[item] > 1 ? `Tier ${tier}/${GEAR_MAX[item]}` : tier ? "Owned" : "Not owned";
  }
  return `In satchel ${save.satchel[item]}/${SATCHEL_MAX}`;
}

export function Shop({ store, onClose }: { store: Store<Save>; onClose: (farewell: string) => void }) {
  const save = useStore(store);
  const bloodline = save.run?.bloodline ?? save.lastBloodline;
  const [focus, setFocus] = useState<ItemId>(ITEM_IDS[0]);
  const [sales, setSales] = useState(0);
  const [line, setLine] = useState(() =>
    fillLine(lineFrom(STORY.merchant.greet, `${save.stats.earned}:${save.gold}:${bloodline}`) ?? "", {
      bloodline,
      gold: save.gold,
    }),
  );
  const typer = useTypewriter(line, sales);
  const story = STORY.npcs.merchant;
  const talking = !typer.done && Math.floor(typer.count / 3) % 2 === 1;

  function purchase(item: ItemId) {
    const current = store.get();
    const result = buy(current, item);
    store.set(result.save);
    const pool =
      result.result === "bought"
        ? STORY.merchant.bought
        : result.result === "broke"
          ? STORY.merchant.broke
          : STORY.merchant.owned;
    const spoken =
      result.result === "full"
        ? `Your satchel already holds ${SATCHEL_MAX} of those.`
        : fillLine(lineFrom(pool, `${item}:${sales}:${current.gold}`) ?? "", { bloodline, gold: result.save.gold });
    setSales((value) => value + 1);
    setLine(spoken);
  }

  function leave() {
    onClose(fillLine(lineFrom(STORY.merchant.farewell, `${sales}:${save.gold}`) ?? "", { bloodline, gold: save.gold }));
  }

  const items: MenuItem[] = ITEM_IDS.map((item) => {
    const available = canStillBuy(save, item);
    const price = priceOf(save, item);
    return {
      id: item,
      label: STORY.items[item].name,
      icon: <Icon id={item} scale={2} />,
      detail: ownedLabel(save, item),
      aside: available ? (
        <span className={`price ${save.gold < price ? "short" : ""}`}>
          <Icon id="coin" scale={1} /> {price}
        </span>
      ) : (
        <span className="price max">{isGear(item) ? "Max" : "Full"}</span>
      ),
      onSelect: () => purchase(item),
    };
  });

  return (
    <Panel
      title={STORY.signs.shop[0] ?? "Shop"}
      className="shop"
      footer={
        <KeyHint
          keys={[
            ["↑↓", "browse"],
            ["Z", "buy"],
            ["X", "leave"],
          ]}
        />
      }
    >
      <div className="shop-top">
        <div className="shop-keeper">
          <SpriteCanvas
            sprite={ART.npcPortrait.merchant}
            frame={talking ? "talk" : "idle"}
            scale={2}
            label={story.name}
          />
        </div>
        <div className="shop-speech">
          <p className="dialog-speaker">{story.name}</p>
          <p className="dialog-text">{typer.shown}</p>
        </div>
        <Coin amount={save.gold} className="shop-purse" />
      </div>
      <div className="shop-grid">
        <Menu
          items={items}
          label="Wares"
          onBack={leave}
          onCursor={(item) => setFocus(item.id as ItemId)}
          className="shop-list"
        />
        <aside className="shop-detail">
          <Icon id={focus} scale={3} />
          <h3>{STORY.items[focus].name}</h3>
          <p>{fillLine(STORY.items[focus].flavor, { bloodline, gold: save.gold })}</p>
          <p className="rule">{ITEM_EFFECTS[focus]}</p>
          <p className="muted small">
            {isGear(focus)
              ? "Gear stays with your bloodline across every climb. It works from the moment you buy it."
              : "Satchel items are used up. Press I on the map or in a duel to use one."}
          </p>
        </aside>
      </div>
    </Panel>
  );
}
