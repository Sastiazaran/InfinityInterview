import type { NpcId, Sprite } from "@/game/contracts";
import { blush, brow, eye, hand, mouth, nose, sweat } from "./faces";
import type { Expression } from "./faces";
import {
  GOLD,
  HAIR_DARK,
  HAIR_GREY,
  HAIR_GREY_HI,
  HAIR_GREY_LO,
  INK,
  PARCH,
  PARCH_HI,
  PARCH_LO,
  SKIN,
  SKIN_HI,
  SKIN_LO,
  STEEL,
  STEEL_HI,
  STEEL_LO,
  WHITE,
} from "./palette";
import { fillEllipse, head, hline, outline, paint, pix, rect, robe, shadedBox, vline } from "./pixel";
import type { Ctx } from "./pixel";
import { makeSprite } from "./sprite";

const GHOST = "rgba(214, 230, 244, 0.84)";
const GHOST_HI = "rgba(248, 252, 255, 0.94)";
const GHOST_LO = "rgba(120, 156, 188, 0.72)";
const DUCK = "#f0cc3e";
const DUCK_HI = "#ffe98a";
const DUCK_LO = "#c89820";
const BEAK = "#e88820";
const BEAK_LO = "#b85c10";

function lantern(ctx: Ctx, x: number, y: number, glow: boolean) {
  hline(ctx, x + 2, y, 6, STEEL_HI);
  vline(ctx, x + 4, y, 3, STEEL);
  shadedBox(ctx, x, y + 3, 10, 3, STEEL_HI, STEEL, STEEL_LO);
  rect(ctx, x + 1, y + 6, 8, 10, glow ? "#ffe28a" : "#e0c060");
  rect(ctx, x + 3, y + 8, 4, 6, "#fff6c8");
  pix(ctx, x + 4, y + 9, WHITE);
  shadedBox(ctx, x, y + 16, 10, 3, STEEL_HI, STEEL, STEEL_LO);
  if (glow) {
    pix(ctx, x - 1, y + 10, "#f4d878");
    pix(ctx, x + 10, y + 11, "#f4d878");
    pix(ctx, x + 4, y + 5, "#fff6c8");
  }
}

function elderBeard(ctx: Ctx, cx: number, y: number, open: boolean) {
  fillEllipse(ctx, cx, y + 8, 11, 8, HAIR_GREY);
  fillEllipse(ctx, cx - 1, y + 6, 7, 5, HAIR_GREY_HI);
  if (!open) {
    hline(ctx, cx - 6, y, 13, HAIR_GREY);
    hline(ctx, cx - 5, y + 1, 11, HAIR_GREY_LO);
  } else {
    hline(ctx, cx - 7, y, 4, HAIR_GREY);
    hline(ctx, cx + 3, y, 4, HAIR_GREY);
  }
  pix(ctx, cx - 9, y + 6, HAIR_GREY_LO);
  pix(ctx, cx + 9, y + 6, HAIR_GREY_LO);
}

function drawMentor(ctx: Ctx, frame: Expression) {
  const talk = frame === "talk";
  robe(ctx, 24, 28, 16, 28, 18, "#d5d8cc", "#8ea58a", "#5c6e58");
  hline(ctx, 14, 40, 20, GOLD);
  lantern(ctx, 34, 22, true);
  hand(ctx, 38, 40);
  head(ctx, 22, 18, 11, 12, SKIN_HI, SKIN, SKIN_LO);
  fillEllipse(ctx, 14, 12, 5, 4, HAIR_GREY);
  fillEllipse(ctx, 30, 12, 5, 4, HAIR_GREY_LO);
  fillEllipse(ctx, 22, 10, 8, 4, HAIR_GREY_HI);
  brow(ctx, 14, 14, "L", "soft", HAIR_GREY_LO);
  brow(ctx, 26, 14, "R", "soft", HAIR_GREY_LO);
  eye(ctx, 14, 16, "idle", "#4a4038");
  eye(ctx, 26, 16, "idle", "#4a4038");
  hline(ctx, 13, 15, 2, SKIN_LO);
  hline(ctx, 32, 15, 2, SKIN_LO);
  nose(ctx, 22, 23);
  mouth(ctx, 22, 28, talk ? "open" : "smile");
  elderBeard(ctx, 22, 29, talk);
  blush(ctx, 12, 24);
  blush(ctx, 30, 24);
}

function drawMerchant(ctx: Ctx, frame: Expression) {
  const talk = frame === "talk";
  shadedBox(ctx, 28, 8, 16, 22, "#6a4a30", "#4a3422", "#2c1e14");
  rect(ctx, 30, 12, 12, 4, "#c44949");
  rect(ctx, 36, 6, 5, 8, "#8eb8d0");
  rect(ctx, 38, 8, 2, 4, "#d0e8f4");
  shadedBox(ctx, 26, 28, 18, 14, "#8a6244", "#5c4030", "#3a2818");
  robe(ctx, 20, 30, 14, 22, 16, "#6a5040", "#3e2c22", "#261810");
  fillEllipse(ctx, 20, 14, 14, 10, "#2a2018");
  head(ctx, 18, 22, 10, 11, SKIN_HI, SKIN, SKIN_LO);
  fillEllipse(ctx, 18, 12, 11, 6, "#241c16");
  rect(ctx, 8, 16, 4, 10, "#1a1410");
  rect(ctx, 24, 16, 5, 12, "#241c16");
  brow(ctx, 10, 18, "L", talk ? "raised" : "soft", HAIR_DARK);
  brow(ctx, 20, 18, "R", talk ? "raised" : "soft", HAIR_DARK);
  eye(ctx, 10, 20, "idle", "#3a2a20");
  eye(ctx, 20, 20, "idle", "#3a2a20");
  nose(ctx, 17, 27);
  mouth(ctx, 17, 32, talk ? "open" : "smile");
  blush(ctx, 9, 28);
  if (talk) sweat(ctx, 28, 14);
  hand(ctx, 8, 40);
}

function drawDuck(ctx: Ctx, frame: Expression) {
  const talk = frame === "talk";
  fillEllipse(ctx, 24, 30, 16, 12, DUCK_LO);
  fillEllipse(ctx, 22, 28, 15, 11, DUCK);
  fillEllipse(ctx, 16, 24, 8, 6, DUCK_HI);
  fillEllipse(ctx, 30, 18, 10, 9, DUCK_LO);
  fillEllipse(ctx, 28, 16, 9, 8, DUCK);
  fillEllipse(ctx, 24, 14, 5, 4, DUCK_HI);
  fillEllipse(ctx, 24, 16, 2.2, 2.4, INK);
  fillEllipse(ctx, 23, 15, 1, 1, WHITE);
  if (!talk) {
    fillEllipse(ctx, 36, 18, 6, 3.2, BEAK);
    fillEllipse(ctx, 38, 17, 3, 1.6, "#ffb050");
    hline(ctx, 32, 18, 8, BEAK_LO);
  } else {
    hline(ctx, 32, 15, 10, BEAK);
    hline(ctx, 34, 16, 8, "#ffb050");
    rect(ctx, 34, 17, 8, 4, "#5a2808");
    hline(ctx, 33, 21, 10, BEAK);
    hline(ctx, 35, 22, 7, BEAK_LO);
  }
  fillEllipse(ctx, 12, 32, 5, 3, DUCK_HI);
  pix(ctx, 20, 40, BEAK);
  pix(ctx, 28, 40, BEAK);
}

function commitLog(ctx: Ctx, x: number, y: number) {
  shadedBox(ctx, x, y, 14, 28, PARCH_HI, PARCH, PARCH_LO);
  const lines = [10, 8, 11, 7, 9, 6, 10, 8];
  for (let i = 0; i < lines.length; i++) {
    const ink = i % 3 === 0 ? "#8a3030" : "#5c5040";
    hline(ctx, x + 2, y + 3 + i * 3, lines[i], ink);
  }
}

function drawGhost(ctx: Ctx, frame: Expression) {
  const talk = frame === "talk";
  commitLog(ctx, 32, 12);
  fillEllipse(ctx, 20, 22, 14, 16, GHOST_LO);
  fillEllipse(ctx, 18, 20, 13, 14, GHOST);
  fillEllipse(ctx, 14, 16, 7, 6, GHOST_HI);
  for (let i = 0; i < 5; i++) {
    fillEllipse(ctx, 8 + i * 6, 36, 3.2, 4, i % 2 ? GHOST : GHOST_LO);
  }
  fillEllipse(ctx, 14, 18, 2.6, 3.2, "#1c3048");
  fillEllipse(ctx, 24, 18, 2.6, 3.2, "#1c3048");
  fillEllipse(ctx, 13, 17, 1, 1.1, WHITE);
  fillEllipse(ctx, 23, 17, 1, 1.1, WHITE);
  if (talk) {
    fillEllipse(ctx, 19, 26, 3, 2.4, "#3a5878");
    hline(ctx, 17, 25, 4, "#f7fbff");
  } else {
    pix(ctx, 16, 26, "#3a5878");
    hline(ctx, 17, 27, 5, "#3a5878");
    pix(ctx, 22, 26, "#3a5878");
  }
  blush(ctx, 10, 23);
  blush(ctx, 26, 23);
  outline(ctx, 48, 48, "#b7c8d8");
}

function portrait(id: NpcId, draw: (ctx: Ctx, frame: Expression) => void, outlined = true): Sprite {
  return makeSprite(`npc:${id}:portrait`, 48, 48, ["idle", "talk"], (ctx, frame) => {
    const expression: Expression = frame === "talk" ? "talk" : "idle";
    draw(ctx, expression);
    if (outlined) outline(ctx, 48, 48, INK);
  });
}

const MENTOR_OW = [
  "................",
  "...kkffkk.......",
  "..kffaaaaffk....",
  "..kfaweewafk....",
  "..kfasaaaafk....",
  "...kfazzfk......",
  "..kkffffffk.....",
  ".ktttttttttk..y.",
  ".ktttttttttk.kmk",
  ".ktggttttttk.kmk",
  ".ktttttttttk.kyk",
  ".ktttttttttk..k.",
  "..ktttttttk.....",
  "..ktt....tk.....",
  "..kt......tk....",
  "..kb......bk....",
  "..kb......bk....",
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
];

const MERCHANT_OW = [
  "................",
  "..ku.kkkkkk.....",
  ".kuukktttttk....",
  ".kukktsaaastk...",
  ".kkkktaweeatk...",
  ".kttktasaaastk..",
  ".kttktazaaaztk..",
  ".kyykttttttttk..",
  "kttttttttttttk..",
  "kddddddddddddk..",
  "kddddddddddddk..",
  "kdddktttttkddk..",
  ".kkkktttttkkk...",
  "..kttt..tttk....",
  "..ktt....ttk....",
  "..kb......bk....",
  "..kb......bk....",
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
];

const DUCK_OW = [
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
  ".....kkkk.......",
  "....kyyyyk......",
  "...kyyyyyyk.....",
  "...kyweeyyk.....",
  "...kyyyyyyk.o...",
  "....kyyykkko....",
  ".....kkkooo.....",
  "......kko.......",
  "................",
  "................",
  "................",
];

const GHOST_OW = [
  "................",
  "....kkkkkk......",
  "...kwwwwwwk.....",
  "..kwweeeewwk....",
  "..kwwewewewk....",
  "..kwwwwwwwwk....",
  "..kwwwwwwwwk.p..",
  "...kwwkwwk..pk..",
  "..kwwwwwwk.kpk..",
  ".kwwwwwwwk.kpk..",
  ".kwwwwwwwk.kpk..",
  "..kkkkkkk..kpk..",
  ".k.k.k.k...kk...",
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
];

const OW: Record<NpcId, readonly string[]> = {
  mentor: MENTOR_OW,
  merchant: MERCHANT_OW,
  duck: DUCK_OW,
  ghost: GHOST_OW,
};

const OW_PAL: Record<string, string> = {
  k: INK,
  s: SKIN_HI,
  a: SKIN,
  z: SKIN_LO,
  e: INK,
  w: WHITE,
  f: HAIR_GREY,
  t: "#8ea58a",
  d: "#4a3428",
  g: GOLD,
  u: "#c44949",
  y: "#ffe28a",
  m: STEEL,
  o: BEAK,
  p: PARCH_HI,
  b: "#3a2a22",
};

function drawOw(rows: readonly string[], ctx: Ctx, frame: string) {
  const bob = frame === "down1" ? -1 : 0;
  paint(ctx, rows, OW_PAL, 0, bob);
}

export const npcOverworld: Record<NpcId, Sprite> = {
  mentor: makeSprite("npc:mentor:overworld", 16, 24, ["down0", "down1"], (ctx, frame) => drawOw(OW.mentor, ctx, frame)),
  merchant: makeSprite("npc:merchant:overworld", 16, 24, ["down0", "down1"], (ctx, frame) =>
    drawOw(OW.merchant, ctx, frame),
  ),
  duck: makeSprite("npc:duck:overworld", 16, 24, ["down0", "down1"], (ctx, frame) => drawOw(OW.duck, ctx, frame)),
  ghost: makeSprite("npc:ghost:overworld", 16, 24, ["down0", "down1"], (ctx, frame) => {
    drawOw(OW.ghost, ctx, frame);
  }),
};

export const npcPortrait: Record<NpcId, Sprite> = {
  mentor: portrait("mentor", drawMentor),
  merchant: portrait("merchant", drawMerchant),
  duck: portrait("duck", drawDuck),
  ghost: portrait("ghost", drawGhost, false),
};
