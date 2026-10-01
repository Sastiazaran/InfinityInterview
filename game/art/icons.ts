import type { IconId, Sprite } from "@/game/contracts";
import { ICON_IDS } from "@/game/contracts";
import { INK } from "./palette";
import { fillEllipse, hline, outline, pix, rect, ring, shadedBox, vline } from "./pixel";
import type { Ctx } from "./pixel";
import { makeSprite } from "./sprite";

function done(ctx: Ctx) {
  outline(ctx, 16, 16, INK);
}

function heart(ctx: Ctx, filled: boolean) {
  const top = filled ? "#e07070" : "transparent";
  const mid = filled ? "#c44949" : "transparent";
  const lo = filled ? "#8a3030" : "transparent";
  if (filled) {
    fillEllipse(ctx, 5.2, 6, 3.1, 3, top);
    fillEllipse(ctx, 10.6, 6, 3.1, 3, mid);
    for (let i = 0; i < 6; i++) hline(ctx, 3 + i, 8 + i, 10 - i * 2, i < 3 ? mid : lo);
    pix(ctx, 4, 5, "#f4c0c0");
  } else {
    ring(ctx, 5.2, 6.2, 2.6, "#c44949");
    ring(ctx, 10.4, 6.2, 2.6, "#c44949");
    pix(ctx, 3, 8, "#c44949");
    pix(ctx, 4, 9, "#c44949");
    pix(ctx, 5, 10, "#c44949");
    pix(ctx, 6, 11, "#c44949");
    pix(ctx, 7, 12, "#c44949");
    pix(ctx, 8, 13, "#8a3030");
    pix(ctx, 9, 12, "#c44949");
    pix(ctx, 10, 11, "#c44949");
    pix(ctx, 11, 10, "#c44949");
    pix(ctx, 12, 9, "#c44949");
    pix(ctx, 13, 8, "#c44949");
  }
  done(ctx);
}

function coin(ctx: Ctx) {
  fillEllipse(ctx, 8, 8, 6, 6, "#a67c3d");
  fillEllipse(ctx, 8, 8, 5, 5, "#e2c07a");
  fillEllipse(ctx, 6.5, 6.5, 2.4, 2, "#f0d9a0");
  vline(ctx, 8, 5, 6, "#a67c3d");
  hline(ctx, 6, 8, 4, "#a67c3d");
  done(ctx);
}

function star(ctx: Ctx) {
  const pts: ReadonlyArray<readonly [number, number]> = [
    [8, 1],
    [7, 2],
    [8, 2],
    [9, 2],
    [3, 5],
    [4, 5],
    [5, 5],
    [6, 5],
    [7, 5],
    [8, 5],
    [9, 5],
    [10, 5],
    [11, 5],
    [12, 5],
    [6, 6],
    [7, 6],
    [8, 6],
    [9, 6],
    [10, 6],
    [5, 7],
    [6, 7],
    [7, 7],
    [8, 7],
    [9, 7],
    [10, 7],
    [11, 7],
    [4, 8],
    [5, 8],
    [6, 8],
    [7, 9],
    [8, 9],
    [9, 9],
    [10, 8],
    [11, 8],
    [12, 8],
    [3, 10],
    [4, 10],
    [5, 11],
    [6, 12],
    [7, 13],
    [8, 14],
    [9, 13],
    [10, 12],
    [11, 11],
    [12, 10],
    [13, 10],
  ];
  for (const [x, y] of pts) pix(ctx, x, y, "#e2c07a");
  pix(ctx, 8, 3, "#f0d9a0");
  pix(ctx, 6, 6, "#f0d9a0");
  pix(ctx, 12, 8, "#a67c3d");
  done(ctx);
}

function key(ctx: Ctx) {
  ring(ctx, 5, 5, 3, "#e2c07a");
  ring(ctx, 5, 5, 1.6, "#a67c3d");
  rect(ctx, 7, 5, 7, 2, "#e2c07a");
  rect(ctx, 12, 7, 2, 2, "#c49a52");
  rect(ctx, 10, 7, 2, 3, "#a67c3d");
  pix(ctx, 4, 4, "#f0d9a0");
  done(ctx);
}

function duck(ctx: Ctx) {
  fillEllipse(ctx, 7, 10, 5, 3.4, "#c89820");
  fillEllipse(ctx, 6, 9, 4.5, 3, "#f0cc3e");
  fillEllipse(ctx, 10, 7, 3.2, 2.8, "#ffe98a");
  fillEllipse(ctx, 9, 6, 1.1, 1.2, INK);
  pix(ctx, 8, 5, "#fff");
  fillEllipse(ctx, 13, 7, 2.4, 1.4, "#e88820");
  done(ctx);
}

function armor(ctx: Ctx) {
  shadedBox(ctx, 4, 3, 8, 6, "#e4e8ee", "#b4bcc6", "#6e7884");
  hline(ctx, 5, 4, 6, "#f4f7fb");
  rect(ctx, 3, 8, 10, 6, "#8e98a4");
  vline(ctx, 3, 8, 6, "#e4e8ee");
  vline(ctx, 12, 8, 6, "#5c6670");
  hline(ctx, 5, 10, 6, "#e2c07a");
  pix(ctx, 8, 5, "#e2c07a");
  done(ctx);
}

function shield(ctx: Ctx) {
  fillEllipse(ctx, 8, 6, 5, 4, "#6e7884");
  for (let i = 0; i < 6; i++) hline(ctx, 4 + i, 8 + i, 8 - i * 2, i < 3 ? "#b4bcc6" : "#5c6670");
  hline(ctx, 6, 5, 4, "#e2c07a");
  vline(ctx, 8, 4, 6, "#e2c07a");
  pix(ctx, 5, 5, "#e4e8ee");
  done(ctx);
}

function lens(ctx: Ctx) {
  ring(ctx, 6, 6, 4, "#b4bcc6");
  ring(ctx, 6, 6, 2.6, "#d5e6ee");
  pix(ctx, 5, 5, "#fff");
  rect(ctx, 9, 9, 5, 2, "#8b5a32");
  pix(ctx, 13, 11, "#5c3a22");
  done(ctx);
}

function hourglass(ctx: Ctx) {
  shadedBox(ctx, 4, 2, 8, 2, "#c49464", "#8b5a32", "#5c3a22");
  shadedBox(ctx, 4, 12, 8, 2, "#c49464", "#8b5a32", "#5c3a22");
  fillEllipse(ctx, 8, 6, 3, 2, "#d7e8f0");
  fillEllipse(ctx, 8, 10, 3, 2, "#c5dae6");
  fillEllipse(ctx, 8, 6, 1.6, 1, "#e2c07a");
  pix(ctx, 8, 8, "#e2c07a");
  done(ctx);
}

function seal(ctx: Ctx) {
  fillEllipse(ctx, 8, 8, 5.5, 5.5, "#8a3030");
  fillEllipse(ctx, 8, 8, 4.2, 4.2, "#c44949");
  fillEllipse(ctx, 6.5, 6.5, 1.6, 1.4, "#e07070");
  pix(ctx, 8, 6, "#f4e7cf");
  pix(ctx, 7, 8, "#f4e7cf");
  pix(ctx, 9, 8, "#f4e7cf");
  pix(ctx, 8, 10, "#f4e7cf");
  rect(ctx, 3, 12, 4, 2, "#e7d3ae");
  done(ctx);
}

function potion(ctx: Ctx) {
  rect(ctx, 6, 2, 4, 3, "#d0cac0");
  hline(ctx, 5, 4, 6, "#8a8478");
  fillEllipse(ctx, 8, 10, 4.5, 4, "#e07070");
  fillEllipse(ctx, 8, 10, 3.2, 3, "#c44949");
  rect(ctx, 6, 6, 4, 3, "#f4c0c0");
  pix(ctx, 6, 9, "#fff");
  done(ctx);
}

function scroll(ctx: Ctx) {
  shadedBox(ctx, 3, 3, 10, 11, "#f4e7cf", "#e7d3ae", "#c4ae82");
  rect(ctx, 2, 3, 2, 11, "#c49464");
  rect(ctx, 12, 3, 2, 11, "#8b5a32");
  hline(ctx, 5, 6, 6, "#8a6848");
  hline(ctx, 5, 8, 5, "#8a6848");
  hline(ctx, 5, 10, 6, "#8a6848");
  done(ctx);
}

function sand(ctx: Ctx) {
  fillEllipse(ctx, 8, 11, 5, 3, "#c8b07a");
  fillEllipse(ctx, 7, 10, 4, 2.4, "#e4d0a4");
  fillEllipse(ctx, 6, 9, 2, 1.4, "#f3e4c2");
  pix(ctx, 10, 8, "#e2c07a");
  pix(ctx, 11, 10, "#f3e4c2");
  pix(ctx, 5, 11, "#c8b07a");
  done(ctx);
}

function note(ctx: Ctx) {
  shadedBox(ctx, 3, 2, 10, 12, "#f4e7cf", "#e7d3ae", "#c4ae82");
  hline(ctx, 10, 2, 3, "#c4ae82");
  pix(ctx, 12, 3, "#c4ae82");
  pix(ctx, 11, 4, "#a08060");
  hline(ctx, 5, 6, 6, "#6b5840");
  hline(ctx, 5, 8, 5, "#6b5840");
  hline(ctx, 5, 10, 6, "#8a3030");
  done(ctx);
}

const DRAW: Record<IconId, (ctx: Ctx) => void> = {
  heart: (ctx) => heart(ctx, true),
  heartEmpty: (ctx) => heart(ctx, false),
  coin,
  star,
  key,
  duck,
  armor,
  shield,
  lens,
  hourglass,
  seal,
  potion,
  scroll,
  sand,
  note,
};

export const icons: Record<IconId, Sprite> = Object.fromEntries(
  ICON_IDS.map((id) => [id, makeSprite(`icon:${id}`, 16, 16, ["base"], (ctx) => DRAW[id](ctx))]),
) as Record<IconId, Sprite>;
