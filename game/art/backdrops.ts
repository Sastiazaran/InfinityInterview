import type { BackdropId, Sprite } from "@/game/contracts";
import { dither, fillEllipse, hash, hline, pix, rect, vline } from "./pixel";
import type { Ctx } from "./pixel";
import { makeSprite } from "./sprite";

function sky(ctx: Ctx, height: number) {
  const bands = ["#0c1526", "#101c30", "#142033", "#1a2c46", "#243650"];
  const step = Math.max(1, Math.floor(height / bands.length));
  for (let i = 0; i < bands.length; i++) {
    const y = i * step;
    const h = i === bands.length - 1 ? height - y : step;
    rect(ctx, 0, y, 240, h, bands[i]);
    if (i < bands.length - 1) dither(ctx, 0, y + h - 1, 240, 2, bands[i], bands[i + 1]);
  }
}

function stars(ctx: Ctx, seed: number, limit: number) {
  for (let i = 0; i < 26; i++) {
    const x = (hash(i, seed) % 220) + 8;
    const y = (hash(seed, i) % limit) + 3;
    const bright = i % 5 === 0;
    pix(ctx, x, y, bright ? "#f4e7cf" : "#c5d2e4");
    if (i % 6 === 0) {
      pix(ctx, x - 1, y, "#9eb0c8");
      pix(ctx, x + 1, y, "#9eb0c8");
      pix(ctx, x, y - 1, "#9eb0c8");
      pix(ctx, x, y + 1, "#9eb0c8");
    }
  }
}

function moon(ctx: Ctx, x: number, y: number) {
  fillEllipse(ctx, x, y, 11, 11, "#f4e7cf");
  fillEllipse(ctx, x - 3, y - 3, 8, 8, "#e7d3ae");
  fillEllipse(ctx, x + 4, y + 2, 2.2, 2.2, "#cbb892");
  fillEllipse(ctx, x - 4, y + 3, 1.5, 1.5, "#cbb892");
  pix(ctx, x - 1, y - 5, "#fff8ea");
}

function platform(
  ctx: Ctx,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  top: string,
  mid: string,
  front: string,
) {
  fillEllipse(ctx, cx + 4, cy + 8, rx, ry * 0.9, "#120e0c");
  fillEllipse(ctx, cx, cy + 7, rx, ry, front);
  fillEllipse(ctx, cx, cy, rx, ry, mid);
  fillEllipse(ctx, cx - rx * 0.12, cy - 2, rx * 0.82, ry * 0.68, top);
}

function seaBand(ctx: Ctx, y: number, h: number) {
  const colors = ["#142033", "#18344c", "#1c3c5c", "#163048"];
  for (let row = 0; row < h; row++) {
    rect(ctx, 0, y + row, 240, 1, colors[Math.floor(row / 2) % 4]);
  }
  for (let i = 0; i < 18; i++) {
    const x = (hash(i, y) % 200) + 10;
    const yy = y + (hash(y, i) % Math.max(1, h - 2));
    hline(ctx, x, yy, 4 + (i % 3), "#3a6898");
  }
}

function brickWall(ctx: Ctx, x: number, y: number, w: number, h: number) {
  rect(ctx, x, y, w, h, "#3e3a34");
  for (let by = 0; by < h; by += 6) {
    const offset = Math.floor(by / 6) % 2 === 0 ? 0 : -5;
    for (let bx = offset; bx < w; bx += 10) {
      const left = Math.max(x, x + bx);
      const right = Math.min(x + w, x + bx + 9);
      if (right - left <= 0) continue;
      rect(ctx, left, y + by, right - left, Math.min(5, h - by), "#8e8880");
      hline(ctx, left, y + by, right - left, "#b2aca2");
    }
  }
}

function torch(ctx: Ctx, x: number, y: number) {
  rect(ctx, x, y + 6, 3, 8, "#5c3a22");
  pix(ctx, x + 1, y, "#fff2c0");
  pix(ctx, x, y + 1, "#f0a030");
  pix(ctx, x + 1, y + 1, "#ffe08a");
  pix(ctx, x + 2, y + 1, "#c44920");
  pix(ctx, x + 1, y + 2, "#e07020");
  pix(ctx, x, y + 3, "#a03018");
  pix(ctx, x + 1, y + 3, "#f0a030");
  dither(ctx, x - 2, y + 1, 7, 6, "#f0a030", "rgba(0,0,0,0)");
}

function banner(ctx: Ctx, x: number, y: number, rose = true) {
  rect(ctx, x, y, 2, 28, "#5c3a22");
  for (let i = 0; i < 16; i++) {
    hline(ctx, x + 2, y + 2 + i, 8, rose ? (i < 6 ? "#e07070" : "#8a3030") : i < 6 ? "#e2c07a" : "#a67c3d");
  }
  pix(ctx, x + 5, y + 6, "#f4e7cf");
}

function shore(ctx: Ctx) {
  sky(ctx, 52);
  stars(ctx, 3, 36);
  moon(ctx, 40, 18);
  seaBand(ctx, 50, 70);
  fillEllipse(ctx, 150, 58, 40, 10, "#4e3422");
  fillEllipse(ctx, 150, 54, 36, 8, "#7a5434");
  fillEllipse(ctx, 140, 50, 18, 5, "#4f7a3c");
  fillEllipse(ctx, 200, 64, 22, 6, "#3a2818");
  platform(ctx, 70, 96, 56, 14, "#f3e4c2", "#e4d0a4", "#a89060");
  platform(ctx, 176, 64, 48, 12, "#6ea24f", "#4f7a3c", "#3c5e2e");
  for (const x of [18, 30, 108]) {
    vline(ctx, x, 100, 8, "#2a4520");
    pix(ctx, x - 1, 99, "#4f7a3c");
    pix(ctx, x + 1, 100, "#6ea24f");
  }
  pix(ctx, 160, 58, "#e2c07a");
  pix(ctx, 190, 60, "#f4e7cf");
}

function gate(ctx: Ctx) {
  sky(ctx, 28);
  stars(ctx, 8, 18);
  moon(ctx, 200, 14);
  brickWall(ctx, 0, 24, 240, 96);
  fillEllipse(ctx, 168, 78, 28, 36, "#100e0c");
  rect(ctx, 140, 24, 56, 22, "#7a756c");
  hline(ctx, 146, 40, 44, "#d0cac0");
  for (let x = 150; x < 190; x += 6) vline(ctx, x, 56, 40, "#3a424c");
  hline(ctx, 146, 58, 44, "#6e7884");
  rect(ctx, 0, 18, 240, 8, "#5c584e");
  for (let x = 6; x < 240; x += 16) {
    rect(ctx, x, 12, 8, 8, "#b2aca2");
    pix(ctx, x + 3, 14, "#e2c07a");
  }
  torch(ctx, 120, 40);
  torch(ctx, 204, 44);
  platform(ctx, 68, 98, 54, 13, "#c8c2b4", "#8e8880", "#5c584e");
  platform(ctx, 176, 66, 46, 11, "#b2aca2", "#7a756c", "#4a453e");
}

function yard(ctx: Ctx) {
  sky(ctx, 36);
  stars(ctx, 5, 22);
  moon(ctx, 36, 16);
  brickWall(ctx, 0, 30, 240, 40);
  rect(ctx, 0, 70, 240, 50, "#3a3630");
  for (let y = 72; y < 120; y += 8) {
    for (let x = (y % 16 === 0 ? 0 : 6); x < 240; x += 12) {
      rect(ctx, x, y, 10, 6, "#6a645c");
      hline(ctx, x, y, 10, "#8e8880");
    }
  }
  banner(ctx, 16, 34, true);
  banner(ctx, 210, 34, false);
  fillEllipse(ctx, 120, 58, 6, 10, "#9a9488");
  rect(ctx, 114, 66, 12, 6, "#6e6860");
  platform(ctx, 70, 100, 52, 13, "#b2aca2", "#7a756c", "#4e4a44");
  platform(ctx, 174, 68, 46, 11, "#8e8880", "#6a645c", "#3e3a34");
  torch(ctx, 130, 48);
}

function stair(ctx: Ctx) {
  sky(ctx, 24);
  stars(ctx, 11, 16);
  rect(ctx, 0, 20, 240, 100, "#2e2a26");
  for (let i = 0; i < 8; i++) {
    const y = 24 + i * 10;
    const x = 20 + i * 18;
    rect(ctx, x, y, 70, 8, i % 2 ? "#8e8880" : "#7a756c");
    hline(ctx, x, y, 70, "#c8c2b4");
    hline(ctx, x, y + 7, 70, "#3e3a34");
    vline(ctx, x, y, 8, "#d0cac0");
  }
  torch(ctx, 48, 40);
  torch(ctx, 150, 28);
  platform(ctx, 66, 100, 50, 12, "#c8c2b4", "#8e8880", "#5c584e");
  platform(ctx, 180, 64, 44, 11, "#b2aca2", "#7a756c", "#4a453e");
}

function tower(ctx: Ctx) {
  rect(ctx, 0, 0, 240, 120, "#1a1816");
  brickWall(ctx, 0, 0, 240, 120);
  rect(ctx, 96, 8, 48, 70, "#0c1526");
  for (let y = 10; y < 76; y++) rect(ctx, 98, y, 44, 1, y % 6 < 3 ? "#142033" : "#1c3050");
  moon(ctx, 120, 36);
  rect(ctx, 94, 8, 4, 72, "#5c584e");
  rect(ctx, 142, 8, 4, 72, "#3e3a34");
  hline(ctx, 94, 8, 52, "#8e8880");
  banner(ctx, 16, 20, true);
  banner(ctx, 210, 24, false);
  torch(ctx, 70, 30);
  torch(ctx, 180, 34);
  platform(ctx, 68, 100, 52, 13, "#6b4428", "#5c3a22", "#3a2416");
  platform(ctx, 176, 66, 46, 11, "#8b5a32", "#6b4428", "#3a2416");
  for (let x = 40; x < 100; x += 8) pix(ctx, x, 108, "#c49464");
}

function throne(ctx: Ctx) {
  rect(ctx, 0, 0, 240, 120, "#16141c");
  rect(ctx, 16, 8, 16, 100, "#3e3a44");
  rect(ctx, 208, 8, 16, 100, "#2e2a34");
  vline(ctx, 16, 8, 100, "#6e6878");
  vline(ctx, 223, 8, 100, "#2a2430");
  for (let y = 16; y < 100; y += 18) {
    pix(ctx, 22, y, "#e2c07a");
    pix(ctx, 214, y, "#e2c07a");
  }
  rect(ctx, 40, 18, 160, 70, "#241e2a");
  shadedBoxGold(ctx, 150, 16, 36, 40);
  rect(ctx, 156, 28, 24, 16, "#8a3030");
  rect(ctx, 160, 32, 16, 8, "#c44949");
  pix(ctx, 168, 20, "#f0d9a0");
  pix(ctx, 167, 22, "#e2c07a");
  pix(ctx, 169, 22, "#a67c3d");
  rect(ctx, 100, 70, 40, 50, "#6e2424");
  for (let y = 72; y < 120; y += 4) hline(ctx, 108, y, 24, "#e2c07a");
  for (let i = 0; i < 5; i++) {
    const x = 70 + i * 28;
    pix(ctx, x, 14, "#fff2c0");
    pix(ctx, x, 15, "#f0a030");
    pix(ctx, x - 1, 16, "#c44920");
    pix(ctx, x + 1, 16, "#e07020");
  }
  platform(ctx, 68, 102, 52, 12, "#4a4458", "#2a2434", "#1a1622");
  platform(ctx, 176, 64, 44, 11, "#3a3444", "#2a2434", "#16141c");
  hline(ctx, 48, 100, 40, "#e2c07a");
}

function shadedBoxGold(ctx: Ctx, x: number, y: number, w: number, h: number) {
  rect(ctx, x, y, w, h, "#6e4e24");
  hline(ctx, x, y, w, "#f0d9a0");
  vline(ctx, x, y, h, "#e2c07a");
  vline(ctx, x + w - 1, y, h, "#4a3014");
  hline(ctx, x, y + h - 1, w, "#4a3014");
}

const DRAW: Record<BackdropId, (ctx: Ctx) => void> = {
  shore,
  gate,
  yard,
  stair,
  tower,
  throne,
};

export const backdrops: Record<BackdropId, Sprite> = {
  shore: makeSprite("backdrop:shore", 240, 120, ["base"], (ctx) => DRAW.shore(ctx)),
  gate: makeSprite("backdrop:gate", 240, 120, ["base"], (ctx) => DRAW.gate(ctx)),
  yard: makeSprite("backdrop:yard", 240, 120, ["base"], (ctx) => DRAW.yard(ctx)),
  stair: makeSprite("backdrop:stair", 240, 120, ["base"], (ctx) => DRAW.stair(ctx)),
  tower: makeSprite("backdrop:tower", 240, 120, ["base"], (ctx) => DRAW.tower(ctx)),
  throne: makeSprite("backdrop:throne", 240, 120, ["base"], (ctx) => DRAW.throne(ctx)),
};
