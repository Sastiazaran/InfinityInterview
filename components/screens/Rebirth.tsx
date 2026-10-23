"use client";

import { ART } from "@/game/art";
import { fillLine } from "@/game/contracts";
import { chapterOf, climbName, stepName } from "@/game/climb";
import { PATHS } from "@/game/paths";
import { openLevel, pathMastered } from "@/game/paths/progress";
import { ROUTE_LENGTH } from "@/game/route";
import type { PathId, Run, Save } from "@/game/types";
import { SpriteCanvas } from "@/components/art/SpriteCanvas";
import { useTypewriter } from "@/components/ui/Dialog";
import { Menu, type MenuItem } from "@/components/ui/Menu";
import { Coin } from "@/components/ui/Sprites";

export type Ending = {
  finished: Run;
  victory: boolean;
  line: string;
  /** The highest Bloodline, or on a path the highest open level, before and after the climb. */
  unlockedBefore: number;
  unlockedAfter: number;
};

export function Rebirth({
  save,
  ending,
  enabled,
  onClimb,
  onPaths,
  onTracks,
  onTitle,
}: {
  save: Save;
  ending: Ending;
  enabled: boolean;
  onClimb: (step: number, path: PathId | null, track?: string | null) => void;
  /** Opens the topic picker. */
  onPaths: () => void;
  /** Opens the subtopic picker on a path that has tracks. */
  onTracks?: () => void;
  onTitle: () => void;
}) {
  const run = ending.finished;
  const path = run.path;
  const track = run.track;
  const n = run.bloodline;
  const line = fillLine(ending.line, { bloodline: path ? n : n + 1, gold: save.gold });
  const typer = useTypewriter(line, run.id);
  const felled = ending.victory ? ROUTE_LENGTH : run.nodeIndex;
  const fresh = ending.unlockedAfter > ending.unlockedBefore;
  const open = path ? openLevel(save, path, track) : save.unlocked;
  const next = Math.min(open, n + 1);
  const mastered = path !== null && ending.victory && pathMastered(save, path, track);
  const pickTracks = Boolean(path && PATHS[path].pickTracks);

  const items: MenuItem[] = [];
  if (next > n) {
    const chapter = chapterOf({ path, bloodline: next, track });
    items.push({
      id: "next",
      label: `Climb ${stepName(path, next)}`,
      detail: chapter.title,
      onSelect: () => onClimb(next, path, track),
    });
  }
  items.push({
    id: "again",
    label: `Climb ${stepName(path, n)} again`,
    detail: chapterOf(run).title,
    onSelect: () => onClimb(n, path, track),
  });
  if (pickTracks && onTracks) {
    items.push({ id: "tracks", label: "Choose another topic", onSelect: onTracks });
  }
  if (path) items.push({ id: "paths", label: pickTracks ? "Choose another path" : "Choose another topic", onSelect: onPaths });
  items.push({ id: "title", label: "Return to title", onSelect: onTitle });

  const head = ending.victory ? (path ? `${PATHS[path].name} level ${n} cleared` : "The crown is won") : "The climb ends";

  return (
    <section className={`rebirth ${ending.victory ? "victory" : "defeat"}`}>
      <SpriteCanvas sprite={ART.backdrops[ending.victory ? "throne" : "shore"]} className="title-bg" label="" />
      <div className="title-veil" />
      <div className="title-card rebirth-card">
        <p className="title-kicker">{climbName(run)}</p>
        <h1 className="rebirth-head">{head}</h1>
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
        {mastered && (
          <p className="unlock-banner">
            Every level of {climbName({ path, bloodline: n, track }).replace(/ · Level \d+$/, "")} is cleared.
          </p>
        )}
        {fresh && (
          <p className="unlock-banner">
            {stepName(path, ending.unlockedAfter)} unlocked: {chapterOf({ path, bloodline: ending.unlockedAfter }).title}
          </p>
        )}
        {path && !ending.victory && (
          <p className="muted small">Clear the throne of {stepName(path, n)} to unlock the next level.</p>
        )}
        <Menu items={items} enabled={enabled} label="What next" />
      </div>
    </section>
  );
}
