import type { Ctx } from "./pixel";
import {
  BLUSH,
  INK,
  LIP,
  LIP_DEEP,
  SKIN,
  SKIN_HI,
  SKIN_LO,
  SKIN_MID,
  WHITE,
} from "./palette";
import { fillEllipse, hline, pix, rect, vline } from "./pixel";

export type Expression = "idle" | "blink" | "hurt" | "defeated" | "talk";
export type BrowStyle = "level" | "stern" | "soft" | "raised" | "worry" | "oneUp";
export type MouthStyle =
  | "neutral"
  | "smile"
  | "grin"
  | "stern"
  | "frown"
  | "wince"
  | "slack"
  | "open"
  | "mustache";

/** 7×7 eye. (x, y) is the top-left of the outline box. */
export function eye(
  ctx: Ctx,
  x: number,
  y: number,
  expression: Expression,
  iris = "#3a5a78",
  glow?: { hi: string; mid: string },
) {
  if (glow) {
    glowEye(ctx, x, y, expression, glow.hi, glow.mid);
    return;
  }
  if (expression === "blink") {
    hline(ctx, x, y + 3, 7, INK);
    hline(ctx, x + 1, y + 4, 5, SKIN_MID);
    return;
  }
  if (expression === "defeated") {
    hline(ctx, x + 1, y + 3, 5, INK);
    hline(ctx, x + 2, y + 4, 3, SKIN_LO);
    return;
  }
  if (expression === "hurt") {
    hline(ctx, x + 1, y + 2, 5, INK);
    pix(ctx, x, y + 3, INK);
    pix(ctx, x + 6, y + 3, INK);
    hline(ctx, x + 1, y + 4, 5, INK);
    pix(ctx, x - 1, y + 2, INK);
    pix(ctx, x + 7, y + 2, INK);
    return;
  }
  hline(ctx, x + 1, y, 5, INK);
  hline(ctx, x + 1, y + 6, 5, INK);
  vline(ctx, x, y + 1, 5, INK);
  vline(ctx, x + 6, y + 1, 5, INK);
  rect(ctx, x + 1, y + 1, 5, 5, WHITE);
  rect(ctx, x + 2, y + 2, 3, 3, iris);
  rect(ctx, x + 3, y + 3, 2, 2, INK);
  pix(ctx, x + 2, y + 2, WHITE);
  pix(ctx, x + 4, y + 5, SKIN_MID);
}

function glowEye(ctx: Ctx, x: number, y: number, expression: Expression, hi: string, mid: string) {
  if (expression === "defeated") {
    const xMark = [
      [0, 0],
      [4, 0],
      [1, 1],
      [3, 1],
      [2, 2],
      [1, 3],
      [3, 3],
      [0, 4],
      [4, 4],
    ];
    for (const [dx, dy] of xMark) pix(ctx, x + 1 + dx, y + 1 + dy, "#4a4038");
    return;
  }
  if (expression === "blink") {
    hline(ctx, x, y + 3, 8, mid);
    hline(ctx, x + 1, y + 4, 6, hi);
    return;
  }
  if (expression === "hurt") {
    rect(ctx, x, y + 2, 8, 3, mid);
    rect(ctx, x + 1, y + 3, 6, 1, hi);
    pix(ctx, x + 2, y + 3, WHITE);
    pix(ctx, x + 5, y + 3, WHITE);
    return;
  }
  rect(ctx, x, y + 1, 8, 5, mid);
  rect(ctx, x + 1, y + 2, 6, 3, hi);
  rect(ctx, x + 2, y + 3, 3, 2, WHITE);
  pix(ctx, x, y, mid);
  pix(ctx, x + 7, y, mid);
  pix(ctx, x, y + 6, mid);
  pix(ctx, x + 7, y + 6, mid);
}

export function xEye(ctx: Ctx, x: number, y: number, color = INK) {
  const marks = [
    [0, 0],
    [4, 0],
    [1, 1],
    [3, 1],
    [2, 2],
    [1, 3],
    [3, 3],
    [0, 4],
    [4, 4],
  ];
  for (const [dx, dy] of marks) pix(ctx, x + dx, y + dy, color);
}

export function brow(
  ctx: Ctx,
  x: number,
  y: number,
  side: "L" | "R",
  style: BrowStyle,
  color = INK,
) {
  const ink = color;
  if (style === "level") {
    hline(ctx, x, y, 6, ink);
    hline(ctx, x + 1, y + 1, 4, ink);
    return;
  }
  if (style === "soft") {
    pix(ctx, x, y + 1, ink);
    hline(ctx, x + 1, y, 4, ink);
    pix(ctx, x + 5, y + 1, ink);
    return;
  }
  if (style === "raised") {
    pix(ctx, x, y + 1, ink);
    pix(ctx, x + 1, y, ink);
    pix(ctx, x + 2, y - 1, ink);
    pix(ctx, x + 3, y - 1, ink);
    pix(ctx, x + 4, y, ink);
    pix(ctx, x + 5, y + 1, ink);
    return;
  }
  if (style === "oneUp") {
    if (side === "L") {
      pix(ctx, x, y + 1, ink);
      hline(ctx, x + 1, y, 4, ink);
      pix(ctx, x + 5, y + 1, ink);
    } else {
      pix(ctx, x, y + 2, ink);
      pix(ctx, x + 1, y + 1, ink);
      pix(ctx, x + 2, y, ink);
      pix(ctx, x + 3, y - 1, ink);
      pix(ctx, x + 4, y - 1, ink);
      pix(ctx, x + 5, y, ink);
    }
    return;
  }
  const down = style === "stern";
  const innerDown = down;
  for (let i = 0; i < 6; i++) {
    const towardNose = side === "L" ? i : 5 - i;
    const drop = innerDown ? Math.floor(towardNose / 2) : Math.max(0, 2 - Math.floor(towardNose / 2));
    pix(ctx, x + i, y + drop, ink);
    if (style === "stern") pix(ctx, x + i, y + drop + 1, ink);
  }
}

export function nose(ctx: Ctx, x: number, y: number) {
  vline(ctx, x, y, 3, SKIN_LO);
  pix(ctx, x - 1, y + 2, SKIN_MID);
  pix(ctx, x + 1, y + 3, SKIN_LO);
  pix(ctx, x - 1, y + 3, SKIN_LO);
}

export function mouth(ctx: Ctx, cx: number, y: number, style: MouthStyle) {
  if (style === "neutral") {
    hline(ctx, cx - 2, y, 5, LIP_DEEP);
    return;
  }
  if (style === "smile") {
    pix(ctx, cx - 3, y, LIP);
    hline(ctx, cx - 2, y + 1, 5, LIP);
    pix(ctx, cx + 3, y, LIP);
    hline(ctx, cx - 1, y + 2, 3, LIP_DEEP);
    return;
  }
  if (style === "grin") {
    pix(ctx, cx - 4, y, LIP_DEEP);
    hline(ctx, cx - 3, y + 1, 7, LIP);
    rect(ctx, cx - 2, y + 2, 5, 2, WHITE);
    hline(ctx, cx - 2, y + 4, 5, LIP_DEEP);
    pix(ctx, cx - 3, y + 2, LIP);
    pix(ctx, cx + 3, y + 2, LIP);
    pix(ctx, cx, y + 3, LIP);
    return;
  }
  if (style === "stern") {
    hline(ctx, cx - 3, y, 7, LIP_DEEP);
    pix(ctx, cx - 4, y - 1, LIP_DEEP);
    pix(ctx, cx + 4, y - 1, LIP_DEEP);
    return;
  }
  if (style === "frown") {
    pix(ctx, cx - 3, y + 1, LIP_DEEP);
    hline(ctx, cx - 2, y, 5, LIP);
    pix(ctx, cx + 3, y + 1, LIP_DEEP);
    return;
  }
  if (style === "wince") {
    hline(ctx, cx - 3, y, 2, LIP_DEEP);
    pix(ctx, cx - 1, y + 1, LIP_DEEP);
    pix(ctx, cx, y + 1, WHITE);
    pix(ctx, cx + 1, y + 1, LIP_DEEP);
    hline(ctx, cx + 2, y, 2, LIP_DEEP);
    return;
  }
  if (style === "slack") {
    rect(ctx, cx - 1, y, 3, 3, "#5a3030");
    hline(ctx, cx - 1, y, 3, LIP);
    return;
  }
  if (style === "open") {
    rect(ctx, cx - 2, y, 5, 4, "#4a2424");
    hline(ctx, cx - 1, y, 3, WHITE);
    pix(ctx, cx, y + 2, ROSE_TONGUE);
    hline(ctx, cx - 2, y + 3, 5, LIP_DEEP);
    return;
  }
  hline(ctx, cx - 3, y, 7, "#4a3428");
}

const ROSE_TONGUE = "#c44949";

export function blush(ctx: Ctx, x: number, y: number) {
  pix(ctx, x, y, BLUSH);
  pix(ctx, x + 1, y, BLUSH);
  pix(ctx, x, y + 1, "#d08078");
}

export function hand(ctx: Ctx, x: number, y: number, inkStain = false) {
  fillEllipse(ctx, x, y, 3.2, 2.6, SKIN);
  fillEllipse(ctx, x - 0.6, y - 0.4, 2, 1.5, SKIN_HI);
  pix(ctx, x + 1, y + 1, SKIN_LO);
  pix(ctx, x - 2, y + 1, SKIN_MID);
  if (inkStain) {
    pix(ctx, x - 1, y, "#243056");
    pix(ctx, x + 1, y + 1, "#1a2848");
    pix(ctx, x, y - 1, "#345078");
    pix(ctx, x + 2, y, "#243056");
  }
}

export function sweat(ctx: Ctx, x: number, y: number) {
  pix(ctx, x, y, "#e8f4ff");
  pix(ctx, x, y + 1, "#b8d8f0");
  pix(ctx, x - 1, y + 2, "#e8f4ff");
  pix(ctx, x, y + 2, "#8ec0e0");
}

export function ear(ctx: Ctx, x: number, y: number) {
  fillEllipse(ctx, x, y, 2.2, 3, SKIN_MID);
  fillEllipse(ctx, x + 0.3, y, 1.2, 1.8, SKIN);
  pix(ctx, x, y + 1, SKIN_LO);
}

export function lashes(ctx: Ctx, x: number, y: number, side: "L" | "R") {
  const tip = side === "L" ? x - 1 : x + 7;
  pix(ctx, tip, y, INK);
  pix(ctx, tip, y + 1, INK);
  pix(ctx, side === "L" ? x : x + 6, y - 1, INK);
}
