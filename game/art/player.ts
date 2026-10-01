import type { Sprite } from "@/game/contracts";
import { INK, SKIN, SKIN_HI, SKIN_LO, WHITE } from "./palette";
import { fillEllipse, hline, mirrorRows, outline, paint, pix, rect, robe, shadedBox, vline, head } from "./pixel";
import type { Ctx } from "./pixel";
import { makeSprite } from "./sprite";

const PAL: Record<string, string> = {
  k: INK,
  h: "#e8eef4",
  m: "#b4bcc6",
  n: "#5c6670",
  s: SKIN_HI,
  a: SKIN,
  z: SKIN_LO,
  e: INK,
  w: WHITE,
  t: "#7ec8c0",
  u: "#2f8f88",
  d: "#1b4e4a",
  c: "#143834",
  g: "#e2c07a",
  G: "#f0d9a0",
  r: "#c44949",
  o: "#3a2a22",
  p: "#6b4e3a",
  b: "#d5dbe3",
};

const DOWN0 = [
  "................",
  "....kmmmmk......",
  "...kmhhhhmk.....",
  "...kmsaaasmk....",
  "...kmawewamk....",
  "...kmasaaamk....",
  "....kmaaaak.....",
  "...kkuuuuuk.....",
  "..kkcuuuuuckk...",
  "..kcuuuuuuuuck..",
  "..kcuuuguuuurk..",
  "..kcuuuuuuuuck..",
  "..kkuuuuuuuukk..",
  "...kuuuuuuuuk...",
  "...kuuk..kuuk...",
  "...kuu....uuk...",
  "...koo....ook...",
  "...koo....ook...",
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
];

const DOWN1 = [
  "................",
  "....kmmmmk......",
  "...kmhhhhmk.....",
  "...kmsaaasmk....",
  "...kmawewamk....",
  "...kmasaaamk....",
  "....kmaaaak.....",
  "...kkuuuuuk.....",
  "..kkcuuuuuckk...",
  "..kcuuuuuuuuck..",
  "..kcuuuguuuurk..",
  "..kcuuuuuuuuck..",
  "..kkuuuuuuuukk..",
  "...kuuk..uuuk...",
  "...koo....uuk...",
  "...ko...........",
  "...ko...........",
  "..........ook...",
  "..........ook...",
  "................",
  "................",
  "................",
  "................",
  "................",
];

const DOWN2 = [
  "................",
  "....kmmmmk......",
  "...kmhhhhmk.....",
  "...kmsaaasmk....",
  "...kmawewamk....",
  "...kmasaaamk....",
  "....kmaaaak.....",
  "...kkuuuuuk.....",
  "..kkcuuuuuckk...",
  "..kcuuuuuuuuck..",
  "..kcuuuguuuurk..",
  "..kcuuuuuuuuck..",
  "..kkuuuuuuuukk..",
  "...kuuu..kuuk...",
  "...kuu....ook...",
  "..........ok....",
  "..........ok....",
  "...koo..........",
  "...koo..........",
  "................",
  "................",
  "................",
  "................",
  "................",
];

const UP0 = [
  "................",
  "....kmmmmk......",
  "...kmhhhhmk.....",
  "...kmmmmmmmk....",
  "...kmmgggmmk....",
  "...kmmmmmmmk....",
  "....kmmmmk......",
  "...kkccccckk....",
  "..kkcccccccckk..",
  "..kcccccccccck..",
  "..kcccbubcccck..",
  "..kcccccccucck..",
  "..kkccuuuuccck..",
  "...kcuuuuuuck...",
  "...kuuk..kuuk...",
  "...kuu....uuk...",
  "...koo....ook...",
  "...koo....ook...",
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
];

const UP1 = [
  "................",
  "....kmmmmk......",
  "...kmhhhhmk.....",
  "...kmmmmmmmk....",
  "...kmmgggmmk....",
  "...kmmmmmmmk....",
  "....kmmmmk......",
  "...kkccccckk....",
  "..kkcccccccckk..",
  "..kcccccccccck..",
  "..kcccbubcccck..",
  "..kcccccccucck..",
  "..kkccuuuuccck..",
  "...kcuk..uuuk...",
  "...koo....uuk...",
  "...ko...........",
  "...ko...........",
  "..........ook...",
  "..........ook...",
  "................",
  "................",
  "................",
  "................",
  "................",
];

const UP2 = [
  "................",
  "....kmmmmk......",
  "...kmhhhhmk.....",
  "...kmmmmmmmk....",
  "...kmmgggmmk....",
  "...kmmmmmmmk....",
  "....kmmmmk......",
  "...kkccccckk....",
  "..kkcccccccckk..",
  "..kcccccccccck..",
  "..kcccbubcccck..",
  "..kcccccccucck..",
  "..kkccuuuuccck..",
  "...kcuu..kuck...",
  "...kuu....ook...",
  "..........ok....",
  "..........ok....",
  "...koo..........",
  "...koo..........",
  "................",
  "................",
  "................",
  "................",
  "................",
];

const LEFT0 = [
  "................",
  ".....kmmmk......",
  "....kmhhhmk.....",
  "...kkmsaamk.....",
  "..kkmweaamkk....",
  "...kmasaamk.....",
  "....kmaaak......",
  "....kkuuuk......",
  "...ckuuuuuk.....",
  "...ckuuuuuk.g...",
  "...ckuuuuuk.r...",
  "...ckuuuuuk.b...",
  "...kkuuuukk.b...",
  "....kuu.uuk.b...",
  "....ku...uk.....",
  "....ko...ok.....",
  "....ko...ok.....",
  ".....k...k......",
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
];

const LEFT1 = [
  "................",
  ".....kmmmk......",
  "....kmhhhmk.....",
  "...kkmsaamk.....",
  "..kkmweaamkk....",
  "...kmasaamk.....",
  "....kmaaak......",
  "....kkuuuk......",
  "...ckuuuuuk.....",
  "...ckuuuuuk.g...",
  "...ckuuuuuk.r...",
  "...ckuuuuuk.b...",
  "...kkuuuukk.b...",
  "....kuu..uk.b...",
  "....ko....k.....",
  "....ko..........",
  ".........ok.....",
  ".........ok.....",
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
];

const LEFT2 = [
  "................",
  ".....kmmmk......",
  "....kmhhhmk.....",
  "...kkmsaamk.....",
  "..kkmweaamkk....",
  "...kmasaamk.....",
  "....kmaaak......",
  "....kkuuuk......",
  "...ckuuuuuk.....",
  "...ckuuuuuk.g...",
  "...ckuuuuuk.r...",
  "...ckuuuuuk.b...",
  "...kkuuuukk.b...",
  "....ku...uk.b...",
  "....ku....ok....",
  ".........ok.....",
  "....ko..........",
  "....ko..........",
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
];

const FRAMES: Record<string, readonly string[]> = {
  down0: DOWN0,
  down1: DOWN1,
  down2: DOWN2,
  up0: UP0,
  up1: UP1,
  up2: UP2,
  left0: LEFT0,
  left1: LEFT1,
  left2: LEFT2,
};

function blade(ctx: Ctx, x0: number, y0: number, x1: number, y1: number) {
  const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = Math.round(x0 + (x1 - x0) * t);
    const y = Math.round(y0 + (y1 - y0) * t);
    pix(ctx, x, y, "#f4f7fb");
    pix(ctx, x + 1, y, "#b4bcc6");
    pix(ctx, x + 2, y, "#6e7884");
  }
}

function drawBattle(ctx: Ctx, frame: string) {
  const attack = frame === "attack";
  const hurt = frame === "hurt";
  ctx.save();
  if (hurt) ctx.translate(-3, 3);
  const lean = attack ? -4 : 0;
  robe(ctx, 32 + lean, 34, 18, attack ? 46 : 36, 24, "#3d9a94", "#1e5854", "#102e2c");
  hline(ctx, 18 + lean, 56, 28, "#e2c07a");
  shadedBox(ctx, 22, 58, 8, 5, "#6b4e3a", "#3a2a22", "#241810");
  shadedBox(ctx, 34, 58, 8, 5, "#6b4e3a", "#3a2a22", "#241810");
  if (attack) {
    rect(ctx, 40, 16, 6, 18, "#2f8f88");
    vline(ctx, 40, 16, 18, "#7ec8c0");
    fillEllipse(ctx, 46, 16, 3, 2.4, SKIN);
    blade(ctx, 48, 14, 58, 2);
    rect(ctx, 44, 14, 4, 3, "#e2c07a");
    pix(ctx, 45, 15, "#c44949");
  } else {
    rect(ctx, 14, 36, 6, 14, "#2f8f88");
    rect(ctx, 44, 36, 6, 14, "#3d9a94");
    blade(ctx, 40, 16, 36, 40);
    rect(ctx, 38, 14, 4, 4, "#e2c07a");
    pix(ctx, 39, 15, "#c44949");
  }
  const hy = hurt ? 24 : 18;
  head(ctx, 32, hy, 11, 12, "#e8eef4", "#b4bcc6", "#5c6670");
  hline(ctx, 24, hy + 2, 16, "#e2c07a");
  hline(ctx, 26, hy + 3, 12, "#a67c3d");
  fillEllipse(ctx, 32, hy - 8, 3, 5, "#2f8f88");
  fillEllipse(ctx, 32, hy - 10, 2, 3, "#7ec8c0");
  pix(ctx, 32, hy + 6, "#e2c07a");
  pix(ctx, 31, hy + 7, "#f0d9a0");
  pix(ctx, 33, hy + 7, "#a67c3d");
  if (hurt) {
    hline(ctx, 26, hy + 8, 4, "#241c16");
    hline(ctx, 34, hy + 9, 3, "#241c16");
  }
  ctx.restore();
  outline(ctx, 64, 64, INK);
}

export const playerOverworld: Sprite = makeSprite(
  "player:overworld",
  16,
  24,
  ["down0", "down1", "down2", "up0", "up1", "up2", "left0", "left1", "left2", "right0", "right1", "right2"],
  (ctx, frame) => {
    const side = frame.startsWith("right") ? frame.replace("right", "left") : frame;
    const rows = FRAMES[side] ?? DOWN0;
    const painted = frame.startsWith("right") ? mirrorRows(rows) : rows;
    paint(ctx, painted, PAL, 0, 0);
  },
);

export const playerBattle: Sprite = makeSprite("player:battle", 64, 64, ["idle", "attack", "hurt"], drawBattle);
