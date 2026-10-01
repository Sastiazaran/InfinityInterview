import type { EnemyId } from "@/game/contracts";
import type { Expression, MouthStyle, BrowStyle } from "./faces";
import { blush, brow, ear, eye, hand, lashes, mouth, nose, sweat, xEye } from "./faces";
import {
  GOLD,
  GOLD_DEEP,
  GOLD_HI,
  GOLD_LO,
  HAIR_BROWN,
  HAIR_BROWN_HI,
  HAIR_BROWN_LO,
  HAIR_DARK,
  HAIR_DARK_HI,
  HAIR_DARK_LO,
  HAIR_GREY,
  HAIR_GREY_HI,
  HAIR_GREY_LO,
  INK,
  PARCH,
  PARCH_DEEP,
  PARCH_HI,
  PARCH_LO,
  ROSE,
  ROSE_DEEP,
  ROSE_HI,
  ROSE_LO,
  SKIN,
  SKIN_HI,
  SKIN_LO,
  SKIN_MID,
  STEEL,
  STEEL_DEEP,
  STEEL_HI,
  STEEL_LO,
  WHITE,
  WOOD,
  WOOD_DEEP,
  WOOD_HI,
  WOOD_LO,
  look,
  paletteAge,
  type Quad,
} from "./palette";
import {
  desaturate,
  digit,
  fillEllipse,
  hline,
  outline,
  paint,
  pix,
  rect,
  ring,
  robe,
  shadedBox,
  vline,
  head,
} from "./pixel";
import type { Ctx } from "./pixel";
import { makeSprite } from "./sprite";
import type { Sprite } from "@/game/contracts";

type Mood = { eye: Expression; mouth: MouthStyle; brow: BrowStyle };

function humanMood(frame: Expression, idleMouth: MouthStyle, idleBrow: BrowStyle): Mood {
  if (frame === "hurt") return { eye: "hurt", mouth: "wince", brow: "worry" };
  if (frame === "defeated") return { eye: "defeated", mouth: "slack", brow: "worry" };
  if (frame === "blink") return { eye: "blink", mouth: idleMouth, brow: idleBrow };
  return { eye: "idle", mouth: idleMouth, brow: idleBrow };
}

function gemOf(age: number): Quad {
  return look(age, [GOLD_HI, GOLD, GOLD_LO, GOLD_DEEP], "gem");
}

function spear(ctx: Ctx, x: number, metal: Quad) {
  pix(ctx, x + 2, 2, metal[0]);
  pix(ctx, x + 1, 3, metal[0]);
  pix(ctx, x + 2, 3, metal[1]);
  pix(ctx, x + 3, 3, metal[0]);
  hline(ctx, x + 1, 4, 3, metal[0]);
  hline(ctx, x, 5, 5, metal[1]);
  hline(ctx, x, 6, 5, metal[2]);
  hline(ctx, x, 7, 5, GOLD);
  rect(ctx, x, 8, 5, 52, WOOD);
  vline(ctx, x, 8, 52, WOOD_HI);
  vline(ctx, x + 4, 8, 52, WOOD_LO);
  for (let i = 0; i < 4; i++) {
    const y = 12 + i * 12;
    rect(ctx, x, y - 1, 5, 7, WOOD_DEEP);
    digit(ctx, x + 1, y, String(i), PARCH_HI);
  }
}

function crate(ctx: Ctx, x: number, y: number, s: number) {
  shadedBox(ctx, x, y, s, s, "#e0c498", "#c49858", "#7a5828");
  const mid = Math.floor(s / 2);
  hline(ctx, x + 2, y + mid, s - 4, WOOD_LO);
  vline(ctx, x + mid, y + 2, s - 4, WOOD_LO);
}

function keyRing(ctx: Ctx, x: number, y: number, metal: Quad) {
  ring(ctx, x + 4, y + 4, 4, metal[1]);
  ring(ctx, x + 4, y + 4, 2.1, metal[0]);
  for (let i = 0; i < 3; i++) {
    const kx = x + 1 + i * 3;
    vline(ctx, kx, y + 8, 9, metal[1]);
    pix(ctx, kx, y + 8, metal[0]);
    hline(ctx, kx, y + 16, 2, metal[2]);
  }
}

function blueprint(ctx: Ctx, x: number, y: number) {
  shadedBox(ctx, x, y, 16, 22, PARCH_HI, PARCH, PARCH_LO);
  rect(ctx, x - 1, y - 1, 3, 24, WOOD);
  rect(ctx, x + 14, y - 1, 3, 24, WOOD_LO);
  const ink = "#2a5080";
  rect(ctx, x + 3, y + 3, 4, 4, ink);
  rect(ctx, x + 9, y + 3, 4, 4, ink);
  hline(ctx, x + 7, y + 5, 2, ink);
  vline(ctx, x + 5, y + 7, 3, ink);
  vline(ctx, x + 11, y + 7, 3, ink);
  rect(ctx, x + 4, y + 10, 8, 5, ink);
  hline(ctx, x + 6, y + 16, 4, ink);
  pix(ctx, x + 8, y + 17, ink);
}

function draftingCompass(ctx: Ctx, x: number, y: number, metal: Quad) {
  fillEllipse(ctx, x, y, 2.2, 2.2, metal[0]);
  fillEllipse(ctx, x, y, 1, 1, metal[2]);
  for (let i = 0; i < 14; i++) {
    pix(ctx, x - 1 - Math.floor(i / 3), y + 2 + i, metal[1]);
    pix(ctx, x + 1 + Math.floor(i / 3), y + 2 + i, metal[0]);
  }
  pix(ctx, x - 5, y + 16, INK);
  pix(ctx, x + 6, y + 16, metal[0]);
}

function hammer(ctx: Ctx, x: number, y: number, metal: Quad) {
  shadedBox(ctx, x, y, 13, 6, metal[0], metal[1], metal[2]);
  rect(ctx, x + 1, y + 1, 4, 2, metal[0]);
  rect(ctx, x + 5, y + 6, 3, 16, WOOD);
  vline(ctx, x + 5, y + 6, 16, WOOD_HI);
  vline(ctx, x + 7, y + 6, 16, WOOD_LO);
}

function chisel(ctx: Ctx, x: number, y: number, metal: Quad) {
  rect(ctx, x, y, 3, 7, WOOD_HI);
  vline(ctx, x + 2, y, 7, WOOD_LO);
  shadedBox(ctx, x, y + 7, 3, 6, metal[0], metal[1], metal[2]);
  pix(ctx, x + 1, y + 13, metal[0]);
}

function gear(ctx: Ctx, cx: number, cy: number, r: number, color: string, hole: string) {
  fillEllipse(ctx, cx, cy, r, r, color);
  for (let i = 0; i < 8; i++) {
    const a = (Math.PI * 2 * i) / 8;
    const tx = Math.round(cx + Math.cos(a) * (r + 1.1));
    const ty = Math.round(cy + Math.sin(a) * (r + 1.1));
    rect(ctx, tx, ty, i % 2 === 0 ? 2 : 1, i % 2 === 0 ? 1 : 2, color);
  }
  fillEllipse(ctx, cx, cy, Math.max(1.1, r * 0.38), Math.max(1.1, r * 0.38), hole);
}

function puzzleCube(ctx: Ctx, x: number, y: number) {
  rect(ctx, x, y, 16, 16, INK);
  const colors = ["#c44949", "#e2c07a", "#3d9a94", "#f4e7cf", "#7a68b0", "#8a5a32", "#e07070", "#8ea58a", "#6e7884"];
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      rect(ctx, x + 1 + col * 5, y + 1 + row * 5, 4, 4, colors[row * 3 + col]);
    }
  }
}

function bolt(ctx: Ctx, x: number, y: number, color: string) {
  const pts: ReadonlyArray<readonly [number, number]> = [
    [2, 0],
    [1, 1],
    [2, 1],
    [1, 2],
    [2, 2],
    [3, 2],
    [1, 3],
    [0, 4],
    [1, 4],
    [0, 5],
  ];
  for (const [dx, dy] of pts) pix(ctx, x + dx, y + dy, color);
}

function hourglass(ctx: Ctx, x: number, y: number, sandTop: boolean) {
  shadedBox(ctx, x, y, 11, 3, WOOD_HI, WOOD, WOOD_LO);
  shadedBox(ctx, x, y + 16, 11, 3, WOOD_HI, WOOD, WOOD_LO);
  fillEllipse(ctx, x + 5, y + 7, 5, 3.6, "#d7e8f0");
  fillEllipse(ctx, x + 5, y + 14, 5, 3.6, "#c5dae6");
  hline(ctx, x + 4, y + 10, 3, "#eef6fa");
  hline(ctx, x + 3, y + 11, 5, "#b7ceda");
  if (sandTop) {
    fillEllipse(ctx, x + 5, y + 8, 2.6, 1.7, GOLD);
    pix(ctx, x + 5, y + 12, GOLD_LO);
  } else {
    fillEllipse(ctx, x + 5, y + 15, 2.8, 1.8, GOLD);
  }
  rect(ctx, x + 4, y + 19, 3, 28, WOOD_LO);
  vline(ctx, x + 4, y + 19, 28, WOOD);
}

function wheel(ctx: Ctx, cx: number, cy: number) {
  ring(ctx, cx, cy, 9, WOOD_LO);
  ring(ctx, cx, cy, 7.2, WOOD);
  ring(ctx, cx, cy, 6.2, WOOD_HI);
  hline(ctx, cx - 8, cy, 17, WOOD);
  vline(ctx, cx, cy - 8, 17, WOOD_LO);
  for (let i = -6; i <= 6; i++) {
    pix(ctx, cx + i, cy + i, WOOD);
    pix(ctx, cx + i, cy - i, WOOD_HI);
  }
  fillEllipse(ctx, cx, cy, 2.2, 2.2, GOLD);
  pix(ctx, cx - 1, cy - 1, GOLD_HI);
}

function mapSheet(ctx: Ctx, x: number, y: number) {
  shadedBox(ctx, x, y, 20, 16, PARCH_HI, PARCH, PARCH_LO);
  hline(ctx, x + 2, y + 2, 16, INK);
  hline(ctx, x + 2, y + 13, 16, INK);
  vline(ctx, x + 2, y + 2, 12, INK);
  vline(ctx, x + 17, y + 2, 12, INK);
  hline(ctx, x + 4, y + 4, 12, "#8a3030");
  hline(ctx, x + 4, y + 11, 12, "#8a3030");
  vline(ctx, x + 4, y + 4, 8, "#8a3030");
  vline(ctx, x + 15, y + 4, 8, "#8a3030");
  pix(ctx, x + 6, y + 7, "#5d8a48");
  pix(ctx, x + 7, y + 6, "#5d8a48");
  pix(ctx, x + 8, y + 7, "#5d8a48");
  pix(ctx, x + 7, y + 8, "#5d8a48");
  pix(ctx, x + 11, y + 8, "#2a4a72");
  pix(ctx, x + 12, y + 7, "#2a4a72");
  pix(ctx, x + 12, y + 9, "#2a4a72");
}

function quill(ctx: Ctx, x: number, y: number) {
  for (let i = 0; i < 34; i++) {
    const grow = i < 12 ? 2 + Math.floor(i / 2) : Math.max(2, 18 - Math.floor((i - 8) / 1.4));
    const len = Math.min(9, grow);
    const left = i % 2 === 0 ? ROSE_LO : ROSE_DEEP;
    const right = i % 2 === 0 ? ROSE : ROSE_HI;
    hline(ctx, x - len, y + i, len, left);
    hline(ctx, x + 1, y + i, len, right);
  }
  vline(ctx, x, y, 38, PARCH_HI);
  vline(ctx, x + 1, y + 6, 28, PARCH);
  pix(ctx, x, y + 38, GOLD_HI);
  pix(ctx, x - 1, y + 39, GOLD);
  pix(ctx, x + 1, y + 39, GOLD);
  pix(ctx, x, y + 40, GOLD_LO);
}

function crown(ctx: Ctx, cx: number, y: number, metal: Quad, gem: Quad, age: number) {
  const peaks = [-12, -6, 0, 6, 12];
  for (const p of peaks) {
    const px = cx + p;
    const tall = p === 0 ? 0 : 2;
    pix(ctx, px, y + tall, metal[0]);
    hline(ctx, px - 1, y + tall + 1, 3, metal[0]);
    hline(ctx, px - 1, y + tall + 2, 3, metal[1]);
    hline(ctx, px - 2, y + tall + 3, 5, metal[1]);
    hline(ctx, px - 2, y + tall + 4, 5, metal[2]);
    if (p === 0 || age >= 2) pix(ctx, px, y + tall + 3, gem[0]);
  }
  shadedBox(ctx, cx - 16, y + 8, 32, 6, metal[0], metal[1], metal[2]);
  hline(ctx, cx - 14, y + 10, 28, metal[0]);
  for (const gx of [-10, -4, 4, 10]) pix(ctx, cx + gx, y + 11, gem[1]);
  fillEllipse(ctx, cx, y + 11, age >= 1 ? 2 : 1.4, age >= 1 ? 2 : 1.4, gem[0]);
  if (age >= 3) {
    pix(ctx, cx - 14, y + 9, gem[0]);
    pix(ctx, cx + 14, y + 9, gem[0]);
  }
}

function mustache(ctx: Ctx, cx: number, y: number) {
  hline(ctx, cx - 8, y, 16, HAIR_BROWN);
  hline(ctx, cx - 7, y + 1, 14, HAIR_BROWN);
  hline(ctx, cx - 5, y + 2, 10, HAIR_BROWN_HI);
  pix(ctx, cx - 8, y + 1, HAIR_BROWN_LO);
  pix(ctx, cx + 7, y + 1, HAIR_BROWN_LO);
  pix(ctx, cx - 8, y + 2, HAIR_BROWN_LO);
  pix(ctx, cx + 7, y + 2, HAIR_BROWN_LO);
  pix(ctx, cx - 7, y + 3, HAIR_DARK);
  pix(ctx, cx + 6, y + 3, HAIR_DARK);
}

function tidyBeard(ctx: Ctx, cx: number, y: number) {
  fillEllipse(ctx, cx, y + 5, 9, 6, HAIR_BROWN);
  fillEllipse(ctx, cx - 1, y + 3, 6, 4, HAIR_BROWN_HI);
  hline(ctx, cx - 7, y + 2, 4, HAIR_BROWN);
  hline(ctx, cx + 3, y + 2, 4, HAIR_BROWN);
  pix(ctx, cx - 8, y + 4, HAIR_BROWN_LO);
  pix(ctx, cx + 8, y + 4, HAIR_BROWN_LO);
}

function stubble(ctx: Ctx, cx: number, cy: number, rx: number, ry: number) {
  const x0 = Math.floor(cx - rx);
  const x1 = Math.ceil(cx + rx);
  const y0 = Math.floor(cy - ry);
  const y1 = Math.ceil(cy + ry);
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const dx = (x + 0.5 - cx) / rx;
      const dy = (y + 0.5 - cy) / ry;
      if (dx * dx + dy * dy <= 1 && ((x + y) & 1) === 0) pix(ctx, x, y, "#7a5c48");
    }
  }
}

function drawSentinel(ctx: Ctx, frame: Expression, age: number) {
  const metal = look(age, [STEEL_HI, STEEL, STEEL_LO, STEEL_DEEP], "metal");
  const trim = look(age, [GOLD_HI, GOLD, GOLD_LO, GOLD_DEEP], "accent");
  const cloth = look(age, ["#7ec8c0", "#2f6e6a", "#1c4442", "#102826"], "cloth");
  spear(ctx, 3, metal);
  fillEllipse(ctx, 26, 50, 9, 7, metal[2]);
  fillEllipse(ctx, 48, 50, 9, 7, metal[1]);
  shadedBox(ctx, 24, 44, 26, 18, metal[0], metal[1], metal[2]);
  hline(ctx, 28, 50, 18, trim[1]);
  hline(ctx, 28, 51, 18, trim[2]);
  rect(ctx, 32, 40, 10, 6, cloth[1]);
  pix(ctx, 30, 48, trim[0]);
  pix(ctx, 44, 48, trim[0]);
  head(ctx, 37, 26, 14, 13, metal[0], metal[1], metal[2]);
  rect(ctx, 35, 10, 4, 8, trim[1]);
  pix(ctx, 36, 8, trim[0]);
  pix(ctx, 37, 8, trim[0]);
  pix(ctx, 36, 9, trim[2]);
  rect(ctx, 24, 28, 4, 10, metal[2]);
  rect(ctx, 46, 26, 5, 12, metal[1]);
  rect(ctx, 28, 22, 20, 12, "#16110e");
  rect(ctx, 29, 24, 18, 8, SKIN_MID);
  hline(ctx, 29, 24, 18, SKIN_LO);
  hline(ctx, 28, 22, 20, metal[0]);
  hline(ctx, 28, 33, 20, metal[2]);
  vline(ctx, 28, 23, 10, metal[1]);
  vline(ctx, 47, 23, 10, metal[2]);
  if (frame === "defeated") {
    xEye(ctx, 31, 26);
    xEye(ctx, 42, 26);
  } else {
    eye(ctx, 30, 25, frame, "#2a4870");
    eye(ctx, 41, 25, frame, "#2a4870");
  }
  if (frame === "hurt") sweat(ctx, 50, 16);
  pix(ctx, 37, 56, trim[0]);
}

function drawWarden(ctx: Ctx, frame: Expression, age: number) {
  const leather = look(age, ["#d2a878", "#8d5a30", "#5c3a20", "#3a2414"], "cloth");
  const iron = look(age, [STEEL_HI, STEEL, STEEL_LO, STEEL_DEEP], "metal");
  const badge = look(age, [GOLD_HI, GOLD, GOLD_LO, GOLD_DEEP], "accent");
  crate(ctx, 46, 12, 14);
  crate(ctx, 48, 26, 12);
  crate(ctx, 44, 38, 16);
  robe(ctx, 30, 42, 26, 40, 20, leather[0], leather[1], leather[2]);
  hline(ctx, 14, 52, 32, iron[2]);
  shadedBox(ctx, 26, 50, 8, 5, badge[0], badge[1], badge[2]);
  ear(ctx, 16, 32);
  ear(ctx, 44, 32);
  head(ctx, 30, 30, 14, 13, SKIN_HI, SKIN, SKIN_LO);
  fillEllipse(ctx, 30, 18, 13, 8, leather[2]);
  fillEllipse(ctx, 28, 16, 9, 5, leather[0]);
  rect(ctx, 17, 20, 26, 4, leather[1]);
  hline(ctx, 18, 20, 24, leather[0]);
  fillEllipse(ctx, 30, 18, 2, 2, badge[0]);
  pix(ctx, 30, 18, badge[2]);
  const mood = humanMood(frame, "stern", "stern");
  brow(ctx, 20, 26, "L", mood.brow, HAIR_BROWN);
  brow(ctx, 34, 26, "R", mood.brow, HAIR_BROWN);
  eye(ctx, 20, 28, mood.eye, "#4a3428");
  eye(ctx, 34, 28, mood.eye, "#4a3428");
  nose(ctx, 30, 35);
  mustache(ctx, 30, 40);
  if (frame === "hurt") {
    mouth(ctx, 30, 44, "wince");
    sweat(ctx, 46, 24);
  } else if (frame === "defeated") {
    mouth(ctx, 30, 44, "slack");
  }
  keyRing(ctx, 6, 44, iron);
  hand(ctx, 14, 56);
}

function drawArchitect(ctx: Ctx, frame: Expression, age: number) {
  const cloth = look(age, ["#8aa4c8", "#314868", "#24344c", "#16202e"], "cloth");
  const metal = look(age, [GOLD_HI, GOLD, GOLD_LO, GOLD_DEEP], "metal");
  fillEllipse(ctx, 34, 22, 16, 16, cloth[2]);
  robe(ctx, 34, 40, 16, 30, 22, cloth[0], cloth[1], cloth[2]);
  hline(ctx, 24, 58, 20, metal[1]);
  ear(ctx, 22, 30);
  ear(ctx, 46, 30);
  head(ctx, 34, 28, 11, 15, SKIN_HI, SKIN, SKIN_MID);
  fillEllipse(ctx, 34, 14, 12, 7, cloth[1]);
  fillEllipse(ctx, 30, 12, 6, 4, cloth[0]);
  rect(ctx, 22, 18, 5, 14, cloth[2]);
  rect(ctx, 42, 18, 5, 14, cloth[1]);
  fillEllipse(ctx, 24, 20, 4, 6, HAIR_GREY);
  fillEllipse(ctx, 44, 20, 4, 6, HAIR_GREY_LO);
  const mood = humanMood(frame, "neutral", "soft");
  brow(ctx, 26, 24, "L", frame === "idle" || frame === "blink" ? "raised" : mood.brow, HAIR_GREY_LO);
  brow(ctx, 38, 24, "R", frame === "idle" || frame === "blink" ? "raised" : mood.brow, HAIR_GREY_LO);
  eye(ctx, 26, 26, mood.eye, "#3a5878");
  eye(ctx, 37, 26, mood.eye, "#3a5878");
  ring(ctx, 29, 29, 4.6, metal[1]);
  ring(ctx, 40, 29, 4.6, metal[1]);
  hline(ctx, 33, 29, 4, metal[0]);
  pix(ctx, 29, 26, metal[0]);
  nose(ctx, 34, 33);
  mouth(ctx, 34, 40, mood.mouth);
  hline(ctx, 28, 22, 4, SKIN_LO);
  hline(ctx, 37, 22, 3, SKIN_LO);
  if (frame === "hurt") sweat(ctx, 48, 18);
  blueprint(ctx, 4, 34);
  hand(ctx, 14, 54);
  draftingCompass(ctx, 52, 36, metal);
  hand(ctx, 52, 54);
}

function drawRefactorer(ctx: Ctx, frame: Expression, age: number) {
  const cloth = look(age, ["#f4e7cf", "#d7c4a2", "#b09870", "#7a6848"], "cloth");
  const metal = look(age, [STEEL_HI, STEEL, STEEL_LO, STEEL_DEEP], "metal");
  const apron = look(age, ["#c49868", "#8a5a32", "#5c3a22", "#3a2416"], "accent");
  fillEllipse(ctx, 32, 16, 12, 8, HAIR_BROWN);
  fillEllipse(ctx, 28, 14, 6, 4, HAIR_BROWN_HI);
  robe(ctx, 32, 42, 20, 28, 20, "#f0d8c0", "#d8b898", "#b08868");
  shadedBox(ctx, 22, 46, 20, 16, apron[0], apron[1], apron[2]);
  vline(ctx, 31, 46, 14, apron[2]);
  hline(ctx, 24, 52, 16, apron[2]);
  rect(ctx, 18, 44, 6, 8, cloth[1]);
  rect(ctx, 40, 44, 6, 8, cloth[0]);
  ear(ctx, 18, 30);
  ear(ctx, 46, 30);
  head(ctx, 32, 28, 13, 13, SKIN_HI, SKIN, SKIN_LO);
  fillEllipse(ctx, 32, 16, 12, 6, HAIR_BROWN);
  fillEllipse(ctx, 27, 15, 5, 3, HAIR_BROWN_HI);
  const mood = humanMood(frame, "smile", "soft");
  brow(ctx, 22, 24, "L", mood.brow, HAIR_BROWN);
  brow(ctx, 36, 24, "R", mood.brow, HAIR_BROWN);
  eye(ctx, 22, 26, mood.eye, "#4a6830");
  eye(ctx, 36, 26, mood.eye, "#4a6830");
  nose(ctx, 32, 33);
  mouth(ctx, 32, 39, mood.mouth);
  tidyBeard(ctx, 32, 40);
  blush(ctx, 20, 34);
  blush(ctx, 40, 34);
  if (frame === "hurt") sweat(ctx, 48, 18);
  hammer(ctx, 44, 18, metal);
  chisel(ctx, 8, 44, metal);
  hand(ctx, 12, 52);
  hand(ctx, 48, 40);
}

function drawPuzzlewright(ctx: Ctx, frame: Expression, age: number) {
  const cloth = look(age, ["#e07070", "#c44949", "#8a3030", "#4e1c1c"], "cloth");
  const accent = look(age, [GOLD_HI, GOLD, GOLD_LO, GOLD_DEEP], "accent");
  const metal = look(age, ["#f0d8a8", "#c4a060", "#8a6830", "#5c4018"], "metal");
  fillEllipse(ctx, 22, 16, 9, 11, cloth[1]);
  fillEllipse(ctx, 42, 14, 9, 12, accent[1]);
  fillEllipse(ctx, 20, 14, 5, 6, cloth[0]);
  fillEllipse(ctx, 44, 12, 5, 6, accent[0]);
  pix(ctx, 16, 6, cloth[0]);
  pix(ctx, 16, 7, cloth[1]);
  pix(ctx, 48, 4, accent[0]);
  pix(ctx, 47, 5, accent[1]);
  fillEllipse(ctx, 50, 8, 2.4, 2.4, metal[0]);
  pix(ctx, 50, 11, metal[2]);
  gear(ctx, 14, 8, 3, metal[1], cloth[2]);
  rect(ctx, 18, 24, 28, 4, cloth[2]);
  hline(ctx, 20, 25, 24, accent[1]);
  robe(ctx, 32, 44, 18, 30, 18, cloth[0], cloth[1], cloth[2]);
  for (let i = 0; i < 6; i++) pix(ctx, 22 + i * 4, 50, i % 2 ? accent[0] : cloth[0]);
  gear(ctx, 18, 48, 3.2, metal[1], cloth[3]);
  ear(ctx, 18, 36);
  ear(ctx, 46, 36);
  head(ctx, 32, 36, 13, 12, SKIN_HI, SKIN, SKIN_LO);
  const mood = humanMood(frame, "grin", "oneUp");
  brow(ctx, 22, 32, "L", mood.brow, HAIR_BROWN);
  brow(ctx, 36, 32, "R", mood.brow, HAIR_BROWN);
  eye(ctx, 22, 34, mood.eye, "#3a6848");
  eye(ctx, 36, 34, mood.eye, "#3a6848");
  nose(ctx, 32, 41);
  mouth(ctx, 32, 46, mood.mouth);
  blush(ctx, 20, 42);
  blush(ctx, 42, 42);
  if (frame === "hurt") sweat(ctx, 48, 30);
  puzzleCube(ctx, 46, 46);
  hand(ctx, 48, 58);
}

function drawLatency(ctx: Ctx, frame: Expression, age: number) {
  const cloth = look(age, ["#b0a0d8", "#5a4890", "#3c3068", "#241c40"], "cloth");
  const metal = look(age, [STEEL_HI, STEEL, STEEL_LO, STEEL_DEEP], "metal");
  const gem = gemOf(age);
  fillEllipse(ctx, 32, 30, 18, 20, "#2a2044");
  fillEllipse(ctx, 16, 42, 6, 14, "#3a2860");
  fillEllipse(ctx, 48, 44, 7, 16, "#241838");
  robe(ctx, 30, 44, 14, 26, 18, cloth[0], cloth[1], cloth[2]);
  bolt(ctx, 22, 50, gem[1]);
  bolt(ctx, 34, 54, gem[0]);
  hline(ctx, 22, 60, 16, metal[1]);
  ear(ctx, 18, 32);
  head(ctx, 30, 30, 12, 14, SKIN_HI, SKIN, SKIN_MID);
  fillEllipse(ctx, 30, 18, 13, 6, "#3a2860");
  fillEllipse(ctx, 24, 16, 5, 3, "#5a4878");
  fillEllipse(ctx, 14, 36, 4, 10, "#3a2860");
  fillEllipse(ctx, 46, 38, 4, 12, "#2a2044");
  hline(ctx, 20, 22, 20, metal[0]);
  hline(ctx, 22, 23, 16, metal[1]);
  fillEllipse(ctx, 30, 21, 2, 2, gem[0]);
  bolt(ctx, 28, 14, gem[1]);
  const mood = humanMood(frame, "smile", "soft");
  brow(ctx, 20, 26, "L", mood.brow, "#2a2044");
  brow(ctx, 34, 26, "R", mood.brow, "#2a2044");
  eye(ctx, 20, 28, mood.eye, "#304878");
  eye(ctx, 34, 28, mood.eye, "#304878");
  lashes(ctx, 20, 28, "L");
  lashes(ctx, 34, 28, "R");
  nose(ctx, 30, 35);
  mouth(ctx, 30, 41, mood.mouth);
  blush(ctx, 18, 36);
  blush(ctx, 38, 36);
  if (frame === "hurt") sweat(ctx, 46, 24);
  hourglass(ctx, 48, 8, frame !== "defeated");
  hand(ctx, 50, 52);
}

function drawShipwright(ctx: Ctx, frame: Expression, age: number) {
  const cloth = look(age, ["#6a88a8", "#243858", "#1a283c", "#101820"], "cloth");
  const metal = look(age, [GOLD_HI, GOLD, GOLD_LO, GOLD_DEEP], "metal");
  wheel(ctx, 50, 40);
  crate(ctx, 4, 40, 14);
  robe(ctx, 30, 44, 22, 32, 18, cloth[0], cloth[1], cloth[2]);
  rect(ctx, 22, 46, 16, 6, WHITE);
  hline(ctx, 18, 52, 24, "#8a3030");
  shadedBox(ctx, 14, 16, 32, 6, cloth[0], cloth[1], cloth[2]);
  fillEllipse(ctx, 30, 14, 10, 6, cloth[1]);
  fillEllipse(ctx, 28, 12, 6, 4, cloth[0]);
  pix(ctx, 29, 18, metal[0]);
  pix(ctx, 30, 18, metal[1]);
  pix(ctx, 31, 18, metal[0]);
  ear(ctx, 16, 32);
  ear(ctx, 44, 32);
  head(ctx, 30, 32, 13, 13, "#e8bc98", SKIN, SKIN_LO);
  const mood = humanMood(frame, "smile", "stern");
  brow(ctx, 20, 28, "L", frame === "hurt" ? "worry" : "stern", HAIR_DARK);
  brow(ctx, 34, 28, "R", frame === "hurt" ? "worry" : "level", HAIR_DARK);
  eye(ctx, 20, 30, mood.eye, "#3a5070");
  eye(ctx, 34, 30, mood.eye, "#3a5070");
  nose(ctx, 30, 37);
  stubble(ctx, 30, 44, 8, 5);
  mouth(ctx, 30, 43, mood.mouth);
  if (frame === "hurt") sweat(ctx, 46, 26);
  hand(ctx, 16, 56);
}

function drawCartographer(ctx: Ctx, frame: Expression, age: number) {
  const cloth = look(age, ["#c5d4b4", "#5e7a52", "#3c5234", "#24321e"], "cloth");
  const metal = look(age, [GOLD_HI, GOLD, GOLD_LO, GOLD_DEEP], "metal");
  fillEllipse(ctx, 32, 18, 13, 7, "#6b4e32");
  robe(ctx, 30, 42, 18, 28, 20, cloth[0], cloth[1], cloth[2]);
  rect(ctx, 22, 44, 16, 8, PARCH_HI);
  ear(ctx, 18, 32);
  ear(ctx, 44, 32);
  head(ctx, 31, 30, 12, 14, SKIN_HI, SKIN, SKIN_MID);
  fillEllipse(ctx, 31, 18, 12, 6, "#6b4e32");
  fillEllipse(ctx, 26, 16, 5, 3, "#8a6240");
  rect(ctx, 18, 20, 26, 3, "#5c4030");
  hline(ctx, 20, 20, 22, "#8a6240");
  const mood = humanMood(frame, "neutral", "soft");
  brow(ctx, 22, 26, "L", mood.brow, "#5c4030");
  brow(ctx, 36, 26, "R", frame === "idle" || frame === "blink" ? "raised" : mood.brow, "#5c4030");
  eye(ctx, 22, 28, mood.eye, "#4a3828");
  eye(ctx, 36, 28, mood.eye, "#4a3828");
  ring(ctx, 39, 31, 5, metal[1]);
  pix(ctx, 44, 31, metal[0]);
  vline(ctx, 44, 32, 3, metal[2]);
  pix(ctx, 45, 35, metal[1]);
  pix(ctx, 44, 36, metal[2]);
  pix(ctx, 43, 37, metal[2]);
  nose(ctx, 32, 35);
  mouth(ctx, 32, 41, mood.mouth);
  pix(ctx, 26, 36, "#243056");
  pix(ctx, 27, 37, "#1a2848");
  pix(ctx, 25, 37, "#345078");
  if (frame === "hurt") sweat(ctx, 48, 22);
  mapSheet(ctx, 40, 44);
  hand(ctx, 46, 58, true);
  hand(ctx, 16, 56, true);
}

function drawExaminer(ctx: Ctx, frame: Expression, age: number) {
  const cloth = look(age, ["#4a4458", "#2a2434", "#1a1622", "#100e14"], "cloth");
  const metal = look(age, [GOLD_HI, GOLD, GOLD_LO, GOLD_DEEP], "metal");
  const gem = gemOf(age);
  quill(ctx, 14, 6);
  robe(ctx, 38, 40, 22, 36, 22, cloth[0], cloth[1], cloth[2]);
  for (let i = 0; i < 5; i++) {
    pix(ctx, 30, 46 + i * 3, metal[0]);
    pix(ctx, 32, 47 + i * 3, metal[1]);
    pix(ctx, 46, 48 + i * 3, metal[2]);
  }
  hline(ctx, 24, 60, 30, metal[1]);
  hline(ctx, 26, 61, 26, metal[2]);
  ditherFur(ctx, 24, 40, 28, 6);
  ear(ctx, 24, 32);
  ear(ctx, 52, 32);
  head(ctx, 38, 30, 13, 16, "#f6dcc6", "#e8c4a4", "#c49878");
  hline(ctx, 32, 20, 5, "#c49878");
  hline(ctx, 40, 21, 4, "#c49878");
  hline(ctx, 33, 23, 3, "#b88868");
  crown(ctx, 38, 4, metal, gem, age);
  const glow = { hi: age === 0 ? "#fff4d0" : gem[0], mid: age === 0 ? "#e2c07a" : gem[1] };
  brow(ctx, 28, 26, "L", frame === "hurt" ? "worry" : "stern", "#2a2018");
  brow(ctx, 42, 26, "R", frame === "hurt" ? "worry" : "stern", "#2a2018");
  eye(ctx, 28, 28, frame === "blink" ? "blink" : frame, "#e2c07a", glow);
  eye(ctx, 42, 28, frame === "blink" ? "blink" : frame, "#e2c07a", glow);
  if (age >= 1 && frame !== "defeated" && frame !== "blink") {
    pix(ctx, 27, 30, gem[0]);
    pix(ctx, 50, 30, gem[0]);
    pix(ctx, 36, 27, gem[1]);
  }
  vline(ctx, 38, 36, 6, "#b88868");
  pix(ctx, 37, 40, "#a07058");
  pix(ctx, 39, 40, "#a07058");
  hline(ctx, 30, 38, 4, "#c49878");
  hline(ctx, 43, 38, 4, "#c49878");
  pix(ctx, 31, 46, "#b88868");
  pix(ctx, 45, 46, "#b88868");
  mouth(ctx, 38, 44, frame === "hurt" ? "wince" : frame === "defeated" ? "slack" : "stern");
  hline(ctx, 30, 42, 3, "#c49878");
  hline(ctx, 44, 42, 3, "#c49878");
  if (frame === "hurt") sweat(ctx, 54, 20);
  hand(ctx, 20, 50);
  if (age >= 2) {
    fillEllipse(ctx, 26, 46, 1.6, 1.6, gem[0]);
    fillEllipse(ctx, 50, 46, 1.6, 1.6, gem[1]);
  }
}

function ditherFur(ctx: Ctx, x: number, y: number, w: number, h: number) {
  for (let yy = 0; yy < h; yy++) {
    for (let xx = 0; xx < w; xx++) {
      pix(ctx, x + xx, y + yy, ((xx + yy) & 1) === 0 ? "#d8d0c4" : "#8a8478");
    }
  }
}

const PORTRAIT: Record<EnemyId, (ctx: Ctx, frame: Expression, age: number) => void> = {
  sentinel: drawSentinel,
  warden: drawWarden,
  architect: drawArchitect,
  refactorer: drawRefactorer,
  puzzlewright: drawPuzzlewright,
  latency: drawLatency,
  shipwright: drawShipwright,
  cartographer: drawCartographer,
  examiner: drawExaminer,
};

function examinerHalo(ctx: Ctx, age: number, frame: Expression) {
  if (age <= 0 || frame === "defeated") return;
  const gem = gemOf(age);
  ring(ctx, 38, 24, 21, gem[1], "top");
  if (age >= 2) ring(ctx, 38, 22, 24, gem[0], "top");
  if (age >= 3 && frame !== "blink") {
    pix(ctx, 8, 10, gem[0]);
    pix(ctx, 58, 12, gem[0]);
    pix(ctx, 38, 1, gem[0]);
    pix(ctx, 18, 4, gem[1]);
    pix(ctx, 56, 4, gem[1]);
  }
}

const portraitCache = new Map<string, Sprite>();

export function enemyPortrait(id: EnemyId, bloodline: number): Sprite {
  const age = paletteAge(bloodline);
  const key = `${id}:${age}`;
  const cached = portraitCache.get(key);
  if (cached) return cached;
  const sprite = makeSprite(
    `enemy:${id}:portrait:${age}`,
    64,
    64,
    ["idle", "blink", "hurt", "defeated"],
    (ctx, frame) => {
      const expression: Expression =
        frame === "blink" || frame === "hurt" || frame === "defeated" ? frame : "idle";
      const dx = expression === "hurt" ? 2 : 0;
      const dy = expression === "hurt" ? 1 : expression === "defeated" ? 3 : 0;
      ctx.save();
      ctx.translate(dx, dy);
      PORTRAIT[id](ctx, expression, age);
      ctx.restore();
      outline(ctx, 64, 64, expression === "defeated" ? "#3a342c" : INK);
      if (expression === "defeated") desaturate(ctx, 64, 64, 0.88);
      if (id === "examiner") examinerHalo(ctx, age, expression);
    },
  );
  portraitCache.set(key, sprite);
  return sprite;
}

function owPalette(age: number, metalBase: Quad, clothBase: Quad, accentBase: Quad, hair: Quad): Record<string, string> {
  const metal = look(age, metalBase, "metal");
  const cloth = look(age, clothBase, "cloth");
  const accent = look(age, accentBase, "accent");
  return {
    k: INK,
    s: SKIN_HI,
    a: SKIN,
    z: SKIN_LO,
    e: INK,
    w: WHITE,
    h: hair[0],
    r: hair[1],
    q: hair[2],
    m: metal[0],
    n: metal[1],
    o: metal[2],
    c: cloth[0],
    t: cloth[1],
    d: cloth[2],
    g: accent[1],
    G: accent[0],
    u: WOOD,
    U: WOOD_HI,
    p: PARCH,
    P: PARCH_HI,
    b: "#3a2a22",
    y: ROSE,
    f: "#d8d2c6",
  };
}

const SENTINEL_OW = [
  "k...............",
  "hk..............",
  "nmk....kmmmhk...",
  "nmk...kmmmmmmk..",
  "nmk...kmwwwwmk..",
  "gmk...kmweewmk..",
  "nmk...kmwwwwmk..",
  ".mk....kmmmmk...",
  ".mk...kmmmmmmk..",
  ".mk..kmmmmmmmmk.",
  ".mk..kmggggmmmk.",
  ".mk..kmmmmmmmmk.",
  ".mk..kmmmmmmmmk.",
  ".k...kmmmmmmmk..",
  ".....kmmmmmmmk..",
  ".....kmmekmmmk..",
  ".....kmm..mmmk..",
  ".....kmm..mmmk..",
  ".....kbb..bbbk..",
  ".....kbb..bbbk..",
  "................",
  "................",
  "................",
  "................",
];

const WARDEN_OW = [
  "................",
  "..kkkkkkkkkk....",
  ".kttttttttttk...",
  ".kttsaaaasttk...",
  ".ktaweewwaatk...",
  ".ktasaaaaastk...",
  ".ktazzzzzzatk...",
  "..kasaaaaask....",
  ".kkttttttttkk...",
  "kttttttttttttk..",
  "kttggggggttttkk.",
  "kttttttttttttkn.",
  "kttttttttttttko.",
  ".kttttttttttk.k.",
  ".kttt....tttk...",
  ".ktt......ttk...",
  ".kb........bk...",
  ".kb........bk...",
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
];

const ARCHITECT_OW = [
  "....kkkkkkkk....",
  "...kttttttttk...",
  "...ktthhhttk....",
  "..kktsaaaastkk..",
  "..ktaweewwatk...",
  "..ktasaaaastk...",
  "..kktaaaaatkk...",
  "...ktttttttk....",
  "..kkttttttttkk..",
  ".kttttttttttttk.",
  ".ktppttttttpptk.",
  ".kttttttttttttk.",
  ".kttggggggttttk.",
  ".kttttttttttttk.",
  "..kttttttttttk..",
  "..kttt....tttk..",
  "..ktt......ttk..",
  "..kb........bk..",
  "..kb........bk..",
  "................",
  "................",
  "................",
  "................",
  "................",
];

const REFACTORER_OW = [
  "................",
  "...kkrrrrkk.....",
  "..krrhhhhrrk....",
  "..krsaaaaasrk...",
  "..kaweewwaark...",
  "..kasaaaaasrk...",
  "..krzaaaaazrk...",
  "...krraaarrrk...",
  "..kkccccccckk...",
  ".kccccccccccck..",
  ".kcccpppppppck..",
  ".kccccccccccck..",
  ".kcccpppppccck.m",
  ".kcccccccccck.nn",
  "..kccc...ccck.u.",
  "..kcc.....cck...",
  "..kb.......bk...",
  "..kb.......bk...",
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
];

const PUZZLE_OW = [
  ".c..........G...",
  "kc..........Gk..",
  "tkk......kkGGk..",
  ".tkk....kktttk..",
  "..tkk..ktsaastk.",
  "...tkkktaweeatk.",
  "....kktasaaaastk",
  "...kkktazaaaztk.",
  "..ktttttttttttk.",
  ".kttttttttttttk.",
  ".ktGttGttGttGtk.",
  ".kttttttttttttk.",
  ".kttttttttttttk.",
  "..kttttttttttk..",
  "..ktt......ttk..",
  "..kt........tk..",
  "..kb........bk..",
  "..kb........bk..",
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
];

const LATENCY_OW = [
  "................",
  "...kkrrrrkk.....",
  "..krrrrrrrrrk...",
  ".krrsaaaaasrrk..",
  ".krsaweewwasrk..",
  ".krsasaaaasark..",
  "..krzaaaaazrk...",
  "...krrzaazrrk...",
  "...kkttttttkk...",
  "..kttttttttttk..",
  ".ktggtttttggtmk.",
  ".ktttttttttttnk.",
  ".ktttttttttttok.",
  "..ktttttttttk...",
  "..kttt....tttk..",
  "...ktt....ttk...",
  "...kb......bk...",
  "...kb......bk...",
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
];

const SHIP_OW = [
  "................",
  "..kkkkkkkkkkk...",
  ".ktttttttttttk..",
  ".kttsGggGsttk...",
  ".ktasaaaasttk...",
  ".ktaweewwaatk...",
  ".ktasaaaastk....",
  "..kazaaaazk.....",
  "..kkttttttkk....",
  ".kttwwttwwttk...",
  ".ktttttttttttk..",
  ".kttyyyyttttk...",
  ".kttttttttttk...",
  "..kttttttttk....",
  "..ktt....ttk....",
  "..kt......tk....",
  "..kb......bk....",
  "..kb......bk....",
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
];

const CARTO_OW = [
  "................",
  "...kkkkkkkk.....",
  "..krrrrrrrrk....",
  "..krsaaaaark....",
  ".kksaweewaark...",
  ".kkasaaaasarGk..",
  "..krzaaaazrk....",
  "...krraaarrk....",
  "..kkttttttkk....",
  ".kttttttttttk...",
  ".kttppttttpptk..",
  ".ktttttttttttk..",
  ".kttppppppttk...",
  "..kttttttttk....",
  "..ktt....ttk....",
  "..kt......tk....",
  "..kb......bk....",
  "..kb......bk....",
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
];

const EXAMINER_OW = [
  "...G..G..G......",
  "..kGkGkGkGk.....",
  "..kggggggggk....",
  "...kmmmmmmk.....",
  "..kmswwwwsmk....",
  ".kmseeeeeesmk...",
  "..kmsaaaaasmk...",
  "...kmaaaamk.....",
  "..kkttttttkk....",
  ".kttttttttttk...",
  ".ktggtttttggtk..",
  ".ktttttttttttk..",
  ".ktttttttttttk..",
  ".kktttttttttkk..",
  "..ktt....tttk...",
  "..ktt....tttk...",
  "..kb......bbk...",
  "..kb......bbk...",
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
];

const OW_ROWS: Record<EnemyId, readonly string[]> = {
  sentinel: SENTINEL_OW,
  warden: WARDEN_OW,
  architect: ARCHITECT_OW,
  refactorer: REFACTORER_OW,
  puzzlewright: PUZZLE_OW,
  latency: LATENCY_OW,
  shipwright: SHIP_OW,
  cartographer: CARTO_OW,
  examiner: EXAMINER_OW,
};

const OW_LOOK: Record<EnemyId, { metal: Quad; cloth: Quad; accent: Quad; hair: Quad }> = {
  sentinel: {
    metal: [STEEL_HI, STEEL, STEEL_LO, STEEL_DEEP],
    cloth: ["#7ec8c0", "#2f6e6a", "#1c4442", "#102826"],
    accent: [GOLD_HI, GOLD, GOLD_LO, GOLD_DEEP],
    hair: [STEEL_HI, STEEL, STEEL_LO, STEEL_DEEP],
  },
  warden: {
    metal: [STEEL_HI, STEEL, STEEL_LO, STEEL_DEEP],
    cloth: ["#d2a878", "#8d5a30", "#5c3a20", "#3a2414"],
    accent: [GOLD_HI, GOLD, GOLD_LO, GOLD_DEEP],
    hair: [HAIR_BROWN_HI, HAIR_BROWN, HAIR_BROWN_LO, HAIR_DARK],
  },
  architect: {
    metal: [GOLD_HI, GOLD, GOLD_LO, GOLD_DEEP],
    cloth: ["#8aa4c8", "#314868", "#24344c", "#16202e"],
    accent: [PARCH_HI, PARCH, PARCH_LO, PARCH_DEEP],
    hair: [HAIR_GREY_HI, HAIR_GREY, HAIR_GREY_LO, "#4a463c"],
  },
  refactorer: {
    metal: [STEEL_HI, STEEL, STEEL_LO, STEEL_DEEP],
    cloth: ["#f4e7cf", "#d7c4a2", "#b09870", "#7a6848"],
    accent: ["#c49868", "#8a5a32", "#5c3a22", "#3a2416"],
    hair: [HAIR_BROWN_HI, HAIR_BROWN, HAIR_BROWN_LO, HAIR_DARK],
  },
  puzzlewright: {
    metal: ["#f0d8a8", "#c4a060", "#8a6830", "#5c4018"],
    cloth: ["#e07070", "#c44949", "#8a3030", "#4e1c1c"],
    accent: [GOLD_HI, GOLD, GOLD_LO, GOLD_DEEP],
    hair: [HAIR_BROWN_HI, HAIR_BROWN, HAIR_BROWN_LO, HAIR_DARK],
  },
  latency: {
    metal: [STEEL_HI, STEEL, STEEL_LO, STEEL_DEEP],
    cloth: ["#b0a0d8", "#5a4890", "#3c3068", "#241c40"],
    accent: [GOLD_HI, GOLD, GOLD_LO, GOLD_DEEP],
    hair: ["#5a4878", "#3a2860", "#2a2044", "#1a1430"],
  },
  shipwright: {
    metal: [GOLD_HI, GOLD, GOLD_LO, GOLD_DEEP],
    cloth: ["#6a88a8", "#243858", "#1a283c", "#101820"],
    accent: [GOLD_HI, GOLD, GOLD_LO, GOLD_DEEP],
    hair: [HAIR_DARK_HI, HAIR_DARK, HAIR_DARK_LO, "#100c0a"],
  },
  cartographer: {
    metal: [GOLD_HI, GOLD, GOLD_LO, GOLD_DEEP],
    cloth: ["#c5d4b4", "#5e7a52", "#3c5234", "#24321e"],
    accent: [PARCH_HI, PARCH, PARCH_LO, PARCH_DEEP],
    hair: ["#8a6240", "#6b4e32", "#4a3422", "#2c1e14"],
  },
  examiner: {
    metal: [GOLD_HI, GOLD, GOLD_LO, GOLD_DEEP],
    cloth: ["#4a4458", "#2a2434", "#1a1622", "#100e14"],
    accent: [GOLD_HI, GOLD, GOLD_LO, GOLD_DEEP],
    hair: [HAIR_DARK_HI, HAIR_DARK, HAIR_DARK_LO, "#100c0a"],
  },
};

const overworldCache = new Map<string, Sprite>();

export function enemyOverworld(id: EnemyId, bloodline: number): Sprite {
  const age = paletteAge(bloodline);
  const key = `${id}:${age}`;
  const cached = overworldCache.get(key);
  if (cached) return cached;
  const lookAt = OW_LOOK[id];
  const rows = OW_ROWS[id];
  const sprite = makeSprite(`enemy:${id}:overworld:${age}`, 16, 24, ["down0", "down1"], (ctx, frame) => {
    const palette = owPalette(age, lookAt.metal, lookAt.cloth, lookAt.accent, lookAt.hair);
    paint(ctx, rows, palette, 0, frame === "down1" ? -1 : 0);
  });
  overworldCache.set(key, sprite);
  return sprite;
}
