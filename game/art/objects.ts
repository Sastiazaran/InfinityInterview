import type { ObjectId, Sprite } from "@/game/contracts";
import { INK } from "./palette";
import { fillEllipse, hline, outline, pix, rect, shadedBox, vline, head } from "./pixel";
import type { Ctx } from "./pixel";
import { makeSprite } from "./sprite";

const LEAF_HI = "#8ec85a";
const LEAF = "#4f8a38";
const LEAF_LO = "#2f5c24";
const LEAF_DEEP = "#1e3c18";
const WOOD = "#8b5a32";
const WOOD_HI = "#c49464";
const WOOD_LO = "#5c3a22";
const STONE_HI = "#d0cac0";
const STONE = "#9a9488";
const STONE_LO = "#6a645c";
const STONE_DEEP = "#3e3a34";

function finish(ctx: Ctx, w: number, h: number) {
  outline(ctx, w, h, INK);
}

function tree(ctx: Ctx) {
  rect(ctx, 6, 20, 4, 11, WOOD);
  vline(ctx, 6, 20, 11, WOOD_HI);
  vline(ctx, 9, 20, 11, WOOD_LO);
  fillEllipse(ctx, 8, 13, 7, 9, LEAF_DEEP);
  fillEllipse(ctx, 7, 12, 6.2, 8, LEAF);
  fillEllipse(ctx, 5, 9, 3.5, 4, LEAF_HI);
  pix(ctx, 3, 8, LEAF_HI);
  pix(ctx, 11, 16, LEAF_LO);
  pix(ctx, 6, 18, LEAF_DEEP);
  finish(ctx, 16, 32);
}

function pine(ctx: Ctx) {
  rect(ctx, 7, 24, 3, 7, WOOD_LO);
  vline(ctx, 7, 24, 7, WOOD);
  for (const [y, half] of [
    [20, 6],
    [14, 5],
    [8, 4],
    [3, 2],
  ] as const) {
    for (let row = 0; row < 7; row++) {
      const w = Math.max(1, half * 2 - row);
      const x = 8 - Math.floor(w / 2);
      hline(ctx, x, y + row, w, row < 2 ? LEAF_HI : row < 5 ? LEAF : LEAF_LO);
    }
  }
  pix(ctx, 8, 2, LEAF_HI);
  finish(ctx, 16, 32);
}

function bush(ctx: Ctx) {
  fillEllipse(ctx, 8, 10, 6.5, 5, LEAF_DEEP);
  fillEllipse(ctx, 7, 9, 5.5, 4.2, LEAF);
  fillEllipse(ctx, 5, 8, 3, 2.4, LEAF_HI);
  pix(ctx, 11, 11, LEAF_LO);
  finish(ctx, 16, 16);
}

function rock(ctx: Ctx) {
  fillEllipse(ctx, 9, 11, 6, 4.5, STONE_DEEP);
  fillEllipse(ctx, 8, 9, 5.5, 4, STONE);
  fillEllipse(ctx, 6, 8, 3, 2.2, STONE_HI);
  pix(ctx, 11, 11, STONE_LO);
  pix(ctx, 5, 12, STONE_LO);
  finish(ctx, 16, 16);
}

function fence(ctx: Ctx) {
  rect(ctx, 0, 2, 3, 13, WOOD);
  vline(ctx, 0, 2, 13, WOOD_HI);
  vline(ctx, 2, 2, 13, WOOD_LO);
  pix(ctx, 1, 1, WOOD_HI);
  rect(ctx, 2, 4, 14, 2, WOOD_HI);
  hline(ctx, 2, 5, 14, WOOD_LO);
  rect(ctx, 2, 10, 14, 2, WOOD);
  hline(ctx, 2, 11, 14, WOOD_LO);
}

function sign(ctx: Ctx) {
  rect(ctx, 7, 8, 2, 7, WOOD_LO);
  shadedBox(ctx, 2, 2, 12, 8, "#e7d3ae", "#c4a878", "#8a6840");
  hline(ctx, 4, 4, 8, "#6b4428");
  hline(ctx, 4, 6, 6, "#6b4428");
  finish(ctx, 16, 16);
}

function chest(ctx: Ctx, open: boolean) {
  if (open) {
    shadedBox(ctx, 2, 8, 12, 7, "#d8b070", "#a87840", "#6b4428");
    rect(ctx, 4, 10, 8, 3, "#2a1c10");
    pix(ctx, 7, 11, "#e2c07a");
    pix(ctx, 8, 11, "#f0d9a0");
    shadedBox(ctx, 2, 2, 12, 5, "#f0d8a0", "#d8b070", "#a87840");
    hline(ctx, 2, 6, 12, "#6b4428");
    pix(ctx, 3, 3, "#f4e7cf");
  } else {
    shadedBox(ctx, 2, 6, 12, 8, "#d8b070", "#a87840", "#6b4428");
    hline(ctx, 2, 6, 12, "#f0d8a0");
    hline(ctx, 3, 10, 10, "#6b4428");
    shadedBox(ctx, 6, 8, 4, 4, "#f0d9a0", "#e2c07a", "#a67c3d");
    pix(ctx, 7, 9, "#6e4e24");
  }
  finish(ctx, 16, 16);
}

function flame(ctx: Ctx, x: number, y: number, tall: boolean) {
  const h = tall ? 6 : 5;
  pix(ctx, x, y + 1, "#fff2c0");
  pix(ctx, x, y + 2, "#ffe08a");
  pix(ctx, x - 1, y + 2, "#f0a030");
  pix(ctx, x + 1, y + 2, "#e07020");
  pix(ctx, x, y + 3, "#f0a030");
  pix(ctx, x - 1, y + 3, "#c44920");
  pix(ctx, x, y + 4, "#c44920");
  if (h > 5) pix(ctx, x, y, "#fff6d0");
  pix(ctx, x + (tall ? -1 : 1), y + 4, "#a03018");
}

function torch(ctx: Ctx, frame: string) {
  shadedBox(ctx, 2, 7, 4, 3, STONE_HI, STONE, STONE_LO);
  rect(ctx, 6, 8, 5, 2, WOOD);
  vline(ctx, 6, 8, 2, WOOD_HI);
  flame(ctx, 12, 3, frame === "a");
  finish(ctx, 16, 16);
}

function campfire(ctx: Ctx, frame: string) {
  fillEllipse(ctx, 4, 12, 2, 1.5, STONE_LO);
  fillEllipse(ctx, 12, 12, 2, 1.5, STONE);
  fillEllipse(ctx, 8, 13, 2.2, 1.6, STONE_HI);
  rect(ctx, 3, 10, 8, 2, WOOD_LO);
  rect(ctx, 6, 8, 7, 2, WOOD);
  vline(ctx, 6, 8, 2, WOOD_HI);
  flame(ctx, 8, 3, frame === "a");
  if (frame === "b") {
    pix(ctx, 6, 5, "#f0a030");
    pix(ctx, 10, 6, "#ffe08a");
  }
  finish(ctx, 16, 16);
}

function banner(ctx: Ctx, frame: string) {
  const wave = frame === "b" ? 1 : 0;
  rect(ctx, 2, 1, 2, 30, WOOD_LO);
  vline(ctx, 2, 1, 30, WOOD_HI);
  pix(ctx, 2, 0, "#e2c07a");
  for (let y = 3; y < 22; y++) {
    const shift = wave === 1 ? (y % 4 < 2 ? 1 : 0) : y % 4 >= 2 ? 1 : 0;
    const color = y < 8 ? "#e07070" : y < 14 ? "#c44949" : "#8a3030";
    hline(ctx, 4 + shift, y, 8, color);
    pix(ctx, 4 + shift, y, "#f0d9a0");
  }
  pix(ctx, 7, 8, "#f0d9a0");
  pix(ctx, 8, 9, "#f4e7cf");
  pix(ctx, 7, 10, "#a67c3d");
  finish(ctx, 16, 32);
}

function statue(ctx: Ctx) {
  shadedBox(ctx, 3, 24, 10, 7, STONE_HI, STONE, STONE_LO);
  hline(ctx, 4, 26, 8, STONE_DEEP);
  rect(ctx, 6, 16, 4, 8, STONE);
  vline(ctx, 6, 16, 8, STONE_HI);
  head(ctx, 8, 12, 3.2, 3.4, STONE_HI, STONE, STONE_LO);
  pix(ctx, 7, 11, STONE_DEEP);
  pix(ctx, 9, 11, STONE_DEEP);
  rect(ctx, 2, 18, 3, 2, STONE_LO);
  rect(ctx, 11, 17, 3, 2, STONE);
  pix(ctx, 13, 16, "#e2c07a");
  finish(ctx, 16, 32);
}

function throne(ctx: Ctx) {
  shadedBox(ctx, 4, 6, 24, 22, "#6e6860", "#4a453e", "#2e2a26");
  shadedBox(ctx, 8, 2, 16, 8, "#8a8478", "#6e6860", "#4a453e");
  pix(ctx, 16, 3, "#e2c07a");
  pix(ctx, 15, 4, "#f0d9a0");
  pix(ctx, 17, 4, "#a67c3d");
  for (let y = 8; y < 24; y += 4) {
    pix(ctx, 10, y, "#e2c07a");
    pix(ctx, 21, y, "#e2c07a");
  }
  shadedBox(ctx, 2, 16, 6, 8, "#8a8478", "#6e6860", "#4a453e");
  shadedBox(ctx, 24, 16, 6, 8, "#8a8478", "#5c584e", "#3a3630");
  rect(ctx, 8, 16, 16, 10, "#a84848");
  rect(ctx, 10, 18, 12, 6, "#c44949");
  hline(ctx, 12, 20, 8, "#e07070");
  pix(ctx, 16, 21, "#e2c07a");
  shadedBox(ctx, 6, 26, 20, 5, "#8a8478", "#6e6860", "#3e3a34");
  hline(ctx, 8, 27, 16, "#e2c07a");
  finish(ctx, 32, 32);
}

function castleGate(ctx: Ctx) {
  rect(ctx, 0, 0, 48, 10, "#6e6860");
  for (let x = 2; x < 46; x += 8) {
    rect(ctx, x, 1, 5, 7, "#b2aca2");
    hline(ctx, x, 1, 5, "#d0cac0");
    pix(ctx, x + 2, 2, "#e2c07a");
  }
  shadedBox(ctx, 2, 8, 12, 38, "#c8c2b4", "#8e8880", "#5c584e");
  shadedBox(ctx, 34, 8, 12, 38, "#b2aca2", "#7a756c", "#4a453e");
  for (let y = 12; y < 44; y += 8) {
    hline(ctx, 3, y, 10, "#6a645c");
    hline(ctx, 35, y, 10, "#5c584e");
    pix(ctx, 4, y + 2, "#d0cac0");
    pix(ctx, 42, y + 3, "#6a645c");
  }
  fillEllipse(ctx, 24, 40, 13, 18, "#100e0c");
  rect(ctx, 14, 8, 20, 12, "#9a9488");
  hline(ctx, 14, 8, 20, "#d0cac0");
  for (let x = 16; x < 33; x += 4) vline(ctx, x, 28, 20, "#3a424c");
  hline(ctx, 14, 30, 20, "#6e7884");
  pix(ctx, 8, 20, "#e2c07a");
  pix(ctx, 39, 20, "#e2c07a");
  fillEllipse(ctx, 8, 24, 1.4, 1.4, "#ffe08a");
  fillEllipse(ctx, 39, 24, 1.4, 1.4, "#f0a030");
  hline(ctx, 16, 22, 16, "#d0cac0");
  finish(ctx, 48, 48);
}

function shopTent(ctx: Ctx) {
  rect(ctx, 6, 30, 4, 17, WOOD_LO);
  rect(ctx, 38, 30, 4, 17, WOOD);
  vline(ctx, 6, 30, 17, WOOD_HI);
  for (let y = 6; y < 28; y++) {
    const inset = Math.floor((y - 6) / 4);
    const stripe = Math.floor((y - 6) / 3) % 2 === 0 ? "#c44949" : "#f4e7cf";
    const shade = Math.floor((y - 6) / 3) % 2 === 0 ? "#8a3030" : "#e7d3ae";
    hline(ctx, 4 + inset, y, 40 - inset * 2, y > 20 ? shade : stripe);
  }
  pix(ctx, 24, 4, "#e2c07a");
  pix(ctx, 23, 5, "#f0d9a0");
  pix(ctx, 25, 5, "#a67c3d");
  shadedBox(ctx, 10, 28, 28, 18, "#f4e7cf", "#e7d3ae", "#c4ae82");
  rect(ctx, 18, 32, 12, 16, "#2a2018");
  vline(ctx, 18, 32, 16, "#6b4428");
  vline(ctx, 29, 32, 16, "#6b4428");
  hline(ctx, 18, 32, 12, "#6b4428");
  rect(ctx, 20, 40, 8, 3, "#8a5a32");
  pix(ctx, 23, 36, "#e2c07a");
  pix(ctx, 10, 18, "#f0d9a0");
  finish(ctx, 48, 48);
}

function tower(ctx: Ctx) {
  shadedBox(ctx, 4, 14, 24, 50, "#c8c2b4", "#8e8880", "#5c584e");
  for (let y = 20; y < 60; y += 8) {
    hline(ctx, 5, y, 22, "#6a645c");
    pix(ctx, 6, y + 3, "#d0cac0");
    pix(ctx, 24, y + 4, "#4a453e");
  }
  rect(ctx, 2, 8, 28, 8, "#6e6860");
  for (let x = 3; x < 28; x += 6) {
    rect(ctx, x, 2, 4, 8, "#b2aca2");
    hline(ctx, x, 2, 4, "#d0cac0");
  }
  rect(ctx, 14, 0, 2, 6, WOOD_LO);
  for (let y = 1; y < 5; y++) hline(ctx, 16, y, 6, y % 2 ? "#c44949" : "#e2c07a");
  const windows: ReadonlyArray<readonly [number, number]> = [
    [8, 24],
    [18, 24],
    [13, 36],
    [8, 48],
    [18, 48],
  ];
  for (const [x, y] of windows) {
    shadedBox(ctx, x, y, 5, 7, "#6e5840", "#2a241c", "#1a140e");
    rect(ctx, x + 1, y + 1, 3, 4, "#ffe08a");
    pix(ctx, x + 2, y + 2, "#fff6c8");
  }
  shadedBox(ctx, 12, 54, 8, 10, "#5c584e", "#3e3a34", "#2a241c");
  pix(ctx, 15, 58, "#e2c07a");
  hline(ctx, 6, 62, 20, "#e2c07a");
  finish(ctx, 32, 64);
}

const DRAW: Record<ObjectId, (ctx: Ctx, frame: string) => void> = {
  tree: (ctx) => tree(ctx),
  pine: (ctx) => pine(ctx),
  bush: (ctx) => bush(ctx),
  rock: (ctx) => rock(ctx),
  fence: (ctx) => fence(ctx),
  sign: (ctx) => sign(ctx),
  chest: (ctx, frame) => chest(ctx, frame === "open"),
  torch: (ctx, frame) => torch(ctx, frame),
  campfire: (ctx, frame) => campfire(ctx, frame),
  banner: (ctx, frame) => banner(ctx, frame),
  statue: (ctx) => statue(ctx),
  throne: (ctx) => throne(ctx),
  castleGate: (ctx) => castleGate(ctx),
  shopTent: (ctx) => shopTent(ctx),
  tower: (ctx) => tower(ctx),
};

export const objects: Record<ObjectId, Sprite> = {
  tree: makeSprite("object:tree", 16, 32, ["base"], (ctx) => DRAW.tree(ctx, "base")),
  pine: makeSprite("object:pine", 16, 32, ["base"], (ctx) => DRAW.pine(ctx, "base")),
  bush: makeSprite("object:bush", 16, 16, ["base"], (ctx) => DRAW.bush(ctx, "base")),
  rock: makeSprite("object:rock", 16, 16, ["base"], (ctx) => DRAW.rock(ctx, "base")),
  fence: makeSprite("object:fence", 16, 16, ["base"], (ctx) => DRAW.fence(ctx, "base")),
  sign: makeSprite("object:sign", 16, 16, ["base"], (ctx) => DRAW.sign(ctx, "base")),
  chest: makeSprite("object:chest", 16, 16, ["closed", "open"], (ctx, frame) => DRAW.chest(ctx, frame)),
  torch: makeSprite("object:torch", 16, 16, ["a", "b"], (ctx, frame) => DRAW.torch(ctx, frame)),
  campfire: makeSprite("object:campfire", 16, 16, ["a", "b"], (ctx, frame) => DRAW.campfire(ctx, frame)),
  banner: makeSprite("object:banner", 16, 32, ["a", "b"], (ctx, frame) => DRAW.banner(ctx, frame)),
  statue: makeSprite("object:statue", 16, 32, ["base"], (ctx) => DRAW.statue(ctx, "base")),
  throne: makeSprite("object:throne", 32, 32, ["base"], (ctx) => DRAW.throne(ctx, "base")),
  castleGate: makeSprite("object:castleGate", 48, 48, ["base"], (ctx) => DRAW.castleGate(ctx, "base")),
  shopTent: makeSprite("object:shopTent", 48, 48, ["base"], (ctx) => DRAW.shopTent(ctx, "base")),
  tower: makeSprite("object:tower", 32, 64, ["base"], (ctx) => DRAW.tower(ctx, "base")),
};
