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
  const rows = [
    "..kk...kk..",
    ".krrk.krrk.",
    "krrrrrrrrrk",
    "krrrrrrrrrk",
    ".krrrrrrrk.",
    "..krrrrrk..",
    "...krrrk...",
    "....krk....",
    ".....k.....",
  ];
  const pal = filled
    ? { k: "#8a3030", r: "#c44949" }
    : { k: "#c44949", r: "" };
  paintHeart(ctx, rows, pal);
  if (filled) {
    pix(ctx, 4, 3, "#f4c0c0");
    pix(ctx, 5, 4, "#e07070");
  }
  done(ctx);
}

function paintHeart(ctx: Ctx, rows: string[], pal: Record<string, string>) {
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const color = pal[row[x]];
      if (color) pix(ctx, 3 + x, 3 + y, color);
    }
  });
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
  const rows = [
    "....k....",
    "...kGk...",
    "..kGGGk..",
    ".kGGGGGk.",
    "kGGkkkGGk",
    ".kkGGGkk.",
    "..kGGGk..",
    "..kG.Gk..",
    ".kG...Gk.",
    "kG.....Gk",
  ];
  const pal: Record<string, string> = { k: "#a67c3d", G: "#e2c07a" };
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const color = pal[row[x]];
      if (color) pix(ctx, 3 + x, 2 + y, color);
    }
  });
  pix(ctx, 8, 4, "#f0d9a0");
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
  rect(ctx, 2, 11, 3, 3, "#e7d3ae");
  rect(ctx, 11, 11, 3, 3, "#c4ae82");
  hline(ctx, 4, 12, 8, "#f4e7cf");
  fillEllipse(ctx, 8, 7, 5, 5, "#8a3030");
  fillEllipse(ctx, 8, 7, 4, 4, "#c44949");
  fillEllipse(ctx, 6.5, 5.5, 1.5, 1.3, "#e07070");
  pix(ctx, 8, 5, "#f4e7cf");
  pix(ctx, 7, 7, "#f4e7cf");
  pix(ctx, 9, 7, "#f4e7cf");
  pix(ctx, 8, 8, "#f0d9a0");
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
  shadedBox(ctx, 4, 3, 8, 7, "#c4a36e", "#a88858", "#6e5430");
  hline(ctx, 6, 3, 4, "#e4d0a4");
  vline(ctx, 7, 1, 2, "#8b5a32");
  hline(ctx, 5, 1, 5, "#c49464");
  fillEllipse(ctx, 5, 12, 3, 2, "#e4d0a4");
  fillEllipse(ctx, 10, 13, 3.2, 1.8, "#c8b07a");
  pix(ctx, 3, 11, "#f3e4c2");
  pix(ctx, 12, 10, "#f3e4c2");
  pix(ctx, 8, 14, "#a88858");
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
