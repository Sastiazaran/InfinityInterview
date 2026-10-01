"use client";

import { ART } from "@/game/art";
import { fillLine, toRoman } from "@/game/contracts";
import { STORY } from "@/game/story";
import { ROUTE_LENGTH } from "@/game/route";
import type { Run, Save } from "@/game/types";
import { SpriteCanvas } from "@/components/art/SpriteCanvas";
import { useTypewriter } from "@/components/ui/Dialog";
import { Menu, type MenuItem } from "@/components/ui/Menu";
import { Coin } from "@/components/ui/Sprites";

export type Ending = {
  finished: Run;
  victory: boolean;
  line: string;
  unlockedBefore: number;
  unlockedAfter: number;
};

export function Rebirth({
  save,
  ending,
  enabled,
  onClimb,
  onTitle,
}: {
  save: Save;
  ending: Ending;
  enabled: boolean;
  onClimb: (bloodline: number) => void;
  onTitle: () => void;
}) {
  const run = ending.finished;
  const n = run.bloodline;
  const line = fillLine(ending.line, { bloodline: n + 1, gold: save.gold });
  const typer = useTypewriter(line, run.id);
  const felled = ending.victory ? ROUTE_LENGTH : run.nodeIndex;
  const fresh = ending.unlockedAfter > ending.unlockedBefore;
  const next = Math.min(save.unlocked, n + 1);

  const items: MenuItem[] = [];
  if (next > n) {
    const chapter = STORY.chapter(next);
    items.push({
      id: "next",
      label: `Climb Bloodline ${chapter.numeral}`,
      detail: chapter.title,
      onSelect: () => onClimb(next),
    });
  }
  items.push(
    { id: "again", label: `Climb Bloodline ${toRoman(n)} again`, detail: STORY.chapter(n).title, onSelect: () => onClimb(n) },
    { id: "title", label: "Return to title", onSelect: onTitle },
  );

  return (
    <section className={`rebirth ${ending.victory ? "victory" : "defeat"}`}>
      <SpriteCanvas sprite={ART.backdrops[ending.victory ? "throne" : "shore"]} className="title-bg" label="" />
      <div className="title-veil" />
      <div className="title-card rebirth-card">
        <p className="title-kicker">Bloodline {toRoman(n)}</p>
        <h1 className="rebirth-head">{ending.victory ? "The crown is won" : "The climb ends"}</h1>
        <p className="rebirth-line">{typer.shown}</p>
        <ul className="rebirth-stats">
          <li>
            <b>{felled}</b>/{ROUTE_LENGTH} guardians felled
          </li>
          <li>
            <b>{run.correct}</b>/{run.answers} answers right
          </li>
          <li>
            <Coin amount={run.gold} /> earned this climb
          </li>
        </ul>
        {fresh && (
          <p className="unlock-banner">
            Bloodline {toRoman(ending.unlockedAfter)} unlocked: {STORY.chapter(ending.unlockedAfter).title}
          </p>
        )}
        <Menu items={items} enabled={enabled} label="What next" />
      </div>
    </section>
  );
}
