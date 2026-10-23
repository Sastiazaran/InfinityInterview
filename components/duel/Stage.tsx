"use client";

import { ART } from "@/game/art";
import { backdropAt, type EnemyId, type NodeId } from "@/game/contracts";
import { SpriteCanvas } from "@/components/art/SpriteCanvas";
import { Coin, Hearts, Icon } from "@/components/ui/Sprites";

export type DuelFx = { kind: "hit" | "miss" | "block" | "slain" | "fallen"; id: number };

export function Stage({
  node,
  look,
  age,
  badge,
  heir,
  name,
  title,
  enemyHearts,
  enemyMax,
  hearts,
  maxHearts,
  shield,
  gold,
  fx,
  live,
  blink,
  pop,
}: {
  node: NodeId;
  /** The painted guardian and the palette age it wears. */
  look: EnemyId;
  age: number;
  /** Beside the guardian's name: the Bloodline numeral or the level. */
  badge: string;
  /** Under "Heir" on the player's plate. */
  heir: string;
  name: string;
  title: string;
  enemyHearts: number;
  enemyMax: number;
  hearts: number;
  maxHearts: number;
  shield: boolean;
  gold: number;
  fx: DuelFx | null;
  /** The effect is still playing. */
  live: boolean;
  blink: boolean;
  pop: { amount: number; id: number } | null;
}) {
  const portrait = ART.enemyPortraitAt(look, age);
  const slain = fx?.kind === "slain";
  const fallen = fx?.kind === "fallen";
  const hit = live && fx?.kind === "hit";
  const struck = live && (fx?.kind === "miss" || fx?.kind === "block");
  const foeFrame = slain ? "defeated" : hit ? "hurt" : blink ? "blink" : "idle";
  const heroFrame = fallen || (live && fx?.kind === "miss") ? "hurt" : hit ? "attack" : "idle";
  const shake = live && fx?.kind === "miss" ? "shake" : "";

  return (
    <div className={`stage ${shake}`} key={shake ? fx?.id : "calm"}>
      <SpriteCanvas sprite={ART.backdrops[backdropAt(node)]} className="stage-bg" label="" />
      <div className={`foe ${hit ? "is-hit" : ""} ${struck ? "is-lunging" : ""} ${slain ? "is-slain" : ""}`}>
        <SpriteCanvas
          sprite={portrait}
          frame={portrait.frames.includes(foeFrame) ? foeFrame : portrait.frames[0]}
          className="foe-sprite"
          label={name}
        />
      </div>
      <div className={`hero ${hit ? "is-attacking" : ""} ${live && fx?.kind === "miss" ? "is-hurt" : ""} ${fallen ? "is-fallen" : ""}`}>
        <SpriteCanvas
          sprite={ART.playerBattle}
          frame={ART.playerBattle.frames.includes(heroFrame) ? heroFrame : ART.playerBattle.frames[0]}
          className="hero-sprite"
          label="You"
        />
      </div>
      {hit && <i className="slash" key={`slash-${fx?.id}`} aria-hidden />}
      {live && fx?.kind === "block" && (
        <span className="block-flash" key={`block-${fx.id}`} aria-hidden>
          <Icon id="shield" scale={3} />
        </span>
      )}
      {pop && (
        <span className="gold-pop on-stage" key={`pop-${pop.id}`}>
          +{pop.amount} gold
        </span>
      )}
      <div className="plate foe-plate">
        <p className="plate-name">
          {name} <small>{badge}</small>
        </p>
        <p className="plate-title">{title}</p>
        <Hearts current={enemyHearts} max={enemyMax} className="plate-hearts" />
      </div>
      <div className="plate hero-plate">
        <p className="plate-name">
          Heir <small>{heir}</small>
        </p>
        <Hearts current={hearts} max={maxHearts} className="plate-hearts" />
        <p className="plate-meta">
          {shield && (
            <span className="shield-ready" title="Shield ready">
              <Icon id="shield" scale={1} /> ready
            </span>
          )}
          <Coin amount={gold} />
        </p>
      </div>
    </div>
  );
}
