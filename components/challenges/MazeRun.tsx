"use client";

import { useState } from "react";
import type { MazeChallenge } from "@/game/types";
import { puzzleScale } from "@/game/balance";
import { mazeDistances, neighbors } from "@/game/content/minigames";
import { arrowOf, LAYER, useKeyLayer } from "@/components/keys";
import { Icon } from "@/components/ui/Sprites";
import { Legend, Notice, type ChallengeProps } from "./shared";

/** Cells on one shortest route from `from` to the exit. */
function routeFrom(challenge: MazeChallenge, walls: Set<number>, from: number): Set<number> {
  const dist = mazeDistances(challenge.cols, challenge.rows, walls, challenge.exit);
  const route = new Set<number>();
  let cell = from;
  while (dist[cell] > 0) {
    const next = neighbors(challenge.cols, challenge.rows, cell).find(
      (candidate) => !walls.has(candidate) && dist[candidate] === dist[cell] - 1,
    );
    if (next === undefined) break;
    route.add(next);
    cell = next;
  }
  return route;
}

export function MazeRun({ challenge, active, senior, onAnswer }: ChallengeProps<MazeChallenge>) {
  const { cols, rows, start, exit, shortest } = challenge;
  const walls = new Set(challenge.walls);
  const slack = puzzleScale(challenge.bloodline).stumbles;
  const limit = shortest + slack;
  const [trail, setTrail] = useState<number[]>([start]);
  const [bump, setBump] = useState(0);
  const position = trail[trail.length - 1];
  const steps = trail.length - 1;
  const route = senior ? routeFrom(challenge, walls, position) : new Set<number>();

  function step(dx: number, dy: number) {
    const x = (position % cols) + dx;
    const y = Math.floor(position / cols) + dy;
    const cell = y * cols + x;
    if (x < 0 || y < 0 || x >= cols || y >= rows || walls.has(cell)) {
      setBump((value) => value + 1);
      return;
    }
    const next = [...trail, cell];
    setTrail(next);
    if (cell === exit) onAnswer(next.length - 1 <= limit);
    else if (next.length - 1 >= limit) onAnswer(false);
  }

  useKeyLayer(
    LAYER.CHALLENGE,
    (event) => {
      const arrow = arrowOf(event);
      if (!arrow) return false;
      if (arrow === "up") step(0, -1);
      if (arrow === "down") step(0, 1);
      if (arrow === "left") step(-1, 0);
      if (arrow === "right") step(1, 0);
      return true;
    },
    { enabled: active },
  );

  const visited = new Set(trail);

  return (
    <div className="play">
      <div
        className={`grid maze ${bump ? "bumped" : ""}`}
        key={bump}
        style={{ gridTemplateColumns: `repeat(${cols}, var(--maze-cell))`, ["--cols" as string]: cols }}
        aria-label={`Maze ${cols} by ${rows}`}
      >
        {Array.from({ length: cols * rows }, (_, cell) => {
          const wall = walls.has(cell);
          return (
            <span
              key={cell}
              className={`mcell ${wall ? "wall" : "open"} ${visited.has(cell) ? "trail" : ""} ${
                route.has(cell) ? "route" : ""
              } ${cell === start ? "start" : ""}`}
            >
              {cell === exit && <Icon id="key" scale={1} className="maze-exit" label="Exit" />}
              {cell === position && <i className="runner" aria-label="You" />}
            </span>
          );
        })}
      </div>
      <p className="tally">
        Steps {steps} / {shortest}
        {slack > 0 ? ` (+${slack} spare)` : ""}
      </p>
      {steps > shortest && steps <= limit && <Notice tone="warn">Past the shortest route. Spare steps are running out.</Notice>}
      <Legend
        keys={[
          ["←↑↓→", "walk one step"],
          ["", "walking back costs steps too"],
        ]}
      />
    </div>
  );
}
