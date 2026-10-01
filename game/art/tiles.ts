import type { Sprite, TileId } from "@/game/contracts";
import { hash, hline, pix, rect, vline } from "./pixel";
import type { Ctx } from "./pixel";
import { makeSprite } from "./sprite";

const GRASS = "#4f7a3c";
const GRASS_HI = "#6ea24f";
const GRASS_LO = "#3c5e2e";
const GRASS_DEEP = "#2a4520";
const SAND = "#e4d0a4";
const SAND_HI = "#f3e4c2";
const SAND_LO = "#c8b07a";
const PATH = "#c4a36e";
const PATH_HI = "#dcc398";
const PATH_LO = "#8e7048";
const SEA = ["#142033", "#1a3050", "#214060", "#18344c"];
const FOAM = "#f4e7cf";
const WET = "#b8a078";
const CLIFF = "#7a5434";
const CLIFF_HI = "#c4a078";
const CLIFF_LO = "#4e3422";
const CLIFF_DEEP = "#3a2818";
const STONE = "#9a9488";
const STONE_HI = "#c8c2b4";
const STONE_LO = "#6e6860";
const MORTAR = "#3e3a34";
const BRICK = "#8e8880";
const BRICK_HI = "#b2aca2";
const BRICK_LO = "#6a645c";

function waterColor(x: number, y: number, alt: boolean): string {
  const yy = y + (alt ? 2 : 0);
  const band = Math.floor(yy / 2) % 4;
  const n = hash(x + 4, yy * 3 + (alt ? 11 : 2));
  if (n % 41 === 0) return "#8eb4d4";
  if (n % 29 === 0) return "#3a6898";
  return SEA[band];
}

function fillWater(ctx: Ctx, alt: boolean, x0 = 0, y0 = 0, x1 = 16, y1 = 16) {
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) pix(ctx, x, y, waterColor(x, y, alt));
  }
}

function grassSpecks(ctx: Ctx, salt: number) {
  rect(ctx, 0, 0, 16, 16, GRASS);
  for (let y = 1; y < 15; y++) {
    for (let x = 1; x < 15; x++) {
      const n = hash(x + salt * 19, y + salt * 7);
      if (n % 11 === 0) pix(ctx, x, y, GRASS_HI);
      else if (n % 13 === 0) pix(ctx, x, y, GRASS_LO);
      else if (n % 29 === 0) {
        pix(ctx, x, y, GRASS_DEEP);
        pix(ctx, x, y - 1, GRASS_HI);
      }
    }
  }
}

function sandLip(ctx: Ctx, edge: "N" | "S" | "E" | "W") {
  fillWater(ctx, false);
  if (edge === "N" || edge === "S") {
    const y = edge === "N" ? 0 : 13;
    rect(ctx, 0, y, 16, 3, SAND);
    hline(ctx, 0, y, 16, SAND_HI);
    hline(ctx, 0, edge === "N" ? 2 : 15, 16, SAND_LO);
    const foam = edge === "N" ? 3 : 12;
    hline(ctx, 0, foam, 16, FOAM);
    for (let x = 0; x < 16; x++) if (hash(x, foam) % 3 === 0) pix(ctx, x, foam, WET);
    return;
  }
  const x = edge === "W" ? 0 : 13;
  rect(ctx, x, 0, 3, 16, SAND);
  vline(ctx, x, 0, 16, edge === "W" ? SAND_HI : SAND_LO);
  vline(ctx, edge === "W" ? 2 : 15, 0, 16, edge === "W" ? SAND_LO : SAND_HI);
  const foam = edge === "W" ? 3 : 12;
  vline(ctx, foam, 0, 16, FOAM);
  for (let y = 0; y < 16; y++) if (hash(foam, y) % 3 === 0) pix(ctx, foam, y, WET);
}

function bricks(ctx: Ctx, top: boolean) {
  rect(ctx, 0, 0, 16, 16, MORTAR);
  const start = top ? 6 : 0;
  for (let by = start; by < 16; by += 5) {
    const offset = Math.floor((by - start) / 5) % 2 === 0 ? 0 : -4;
    for (let bx = offset; bx < 16; bx += 8) {
      const x = Math.max(0, bx);
      const w = Math.min(16, bx + 7) - x;
      const h = Math.min(4, 16 - by);
      if (w > 0 && h > 0 && by < 16) {
        rect(ctx, x, by, w, h, BRICK);
        hline(ctx, x, by, w, BRICK_HI);
        if (w > 1) vline(ctx, x, by, h, BRICK_HI);
        pix(ctx, Math.min(15, x + w - 1), by + h - 1, BRICK_LO);
      }
    }
  }
  if (top) {
    rect(ctx, 0, 0, 16, 6, "#6e6860");
    rect(ctx, 0, 0, 5, 5, STONE_HI);
    rect(ctx, 8, 0, 5, 5, STONE_HI);
    hline(ctx, 0, 5, 16, STONE_LO);
    pix(ctx, 2, 1, "#e2c07a");
    pix(ctx, 10, 1, "#e2c07a");
  }
}

function drawTile(ctx: Ctx, id: TileId, frame: string) {
  switch (id) {
    case "grass":
      grassSpecks(ctx, 1);
      break;
    case "grassAlt":
      grassSpecks(ctx, 4);
      pix(ctx, 4, 5, GRASS_HI);
      pix(ctx, 5, 6, GRASS_DEEP);
      pix(ctx, 11, 9, GRASS_HI);
      pix(ctx, 8, 3, GRASS_LO);
      break;
    case "tallGrass":
      grassSpecks(ctx, 2);
      for (const [x, y] of [
        [3, 4],
        [7, 6],
        [11, 5],
        [5, 11],
        [13, 10],
      ] as const) {
        vline(ctx, x, y, 4, GRASS_DEEP);
        pix(ctx, x, y, GRASS_HI);
        pix(ctx, x - 1, y + 2, GRASS_LO);
      }
      break;
    case "flowers":
      grassSpecks(ctx, 3);
      for (const [x, y, c] of [
        [4, 4, "#e07070"],
        [11, 6, "#f4e7cf"],
        [6, 11, "#e2c07a"],
        [13, 12, "#e07070"],
      ] as const) {
        pix(ctx, x, y, c);
        pix(ctx, x - 1, y, c);
        pix(ctx, x + 1, y, c);
        pix(ctx, x, y - 1, c);
        pix(ctx, x, y + 1, "#f7f3ea");
        pix(ctx, x, y + 2, GRASS_DEEP);
      }
      break;
    case "path":
      rect(ctx, 0, 0, 16, 16, PATH);
      for (let y = 1; y < 15; y++) {
        for (let x = 1; x < 15; x++) {
          const n = hash(x + 3, y + 8);
          if (n % 9 === 0) pix(ctx, x, y, PATH_HI);
          else if (n % 14 === 0) pix(ctx, x, y, PATH_LO);
        }
      }
      break;
    case "sand":
      rect(ctx, 0, 0, 16, 16, SAND);
      for (let y = 1; y < 15; y++) {
        for (let x = 1; x < 15; x++) {
          const n = hash(x + 5, y + 2);
          if (n % 8 === 0) pix(ctx, x, y, SAND_HI);
          else if (n % 15 === 0) pix(ctx, x, y, SAND_LO);
        }
      }
      break;
    case "water":
      fillWater(ctx, frame === "alt");
      break;
    case "bankN":
      sandLip(ctx, "N");
      break;
    case "bankS":
      sandLip(ctx, "S");
      break;
    case "bankE":
      sandLip(ctx, "E");
      break;
    case "bankW":
      sandLip(ctx, "W");
      break;
    case "bridge":
      rect(ctx, 0, 0, 16, 16, "#6b4428");
      for (let x = 0; x < 16; x += 4) {
        rect(ctx, x, 0, 3, 16, x % 8 === 0 ? "#a87848" : "#8b5a32");
        vline(ctx, x, 0, 16, "#c49464");
        vline(ctx, x + 2, 0, 16, "#5c3a22");
      }
      hline(ctx, 0, 0, 16, "#5c3a22");
      hline(ctx, 0, 15, 16, "#3a2416");
      pix(ctx, 1, 2, "#e2c07a");
      pix(ctx, 5, 8, "#e2c07a");
      pix(ctx, 9, 4, "#e2c07a");
      pix(ctx, 13, 11, "#e2c07a");
      break;
    case "cliff":
      rect(ctx, 0, 0, 16, 16, CLIFF);
      hline(ctx, 0, 0, 16, CLIFF_HI);
      hline(ctx, 0, 1, 16, "#b48a60");
      vline(ctx, 0, 0, 16, CLIFF_HI);
      vline(ctx, 15, 0, 16, CLIFF_DEEP);
      hline(ctx, 0, 6, 16, CLIFF_LO);
      hline(ctx, 0, 7, 16, CLIFF_DEEP);
      hline(ctx, 0, 12, 16, CLIFF_LO);
      vline(ctx, 5, 2, 4, CLIFF_DEEP);
      vline(ctx, 11, 8, 4, CLIFF_DEEP);
      pix(ctx, 3, 4, CLIFF_HI);
      pix(ctx, 8, 10, CLIFF_HI);
      pix(ctx, 14, 14, CLIFF_DEEP);
      break;
    case "stairs":
      rect(ctx, 0, 0, 16, 16, STONE_LO);
      for (let s = 0; s < 4; s++) {
        const y = s * 4;
        rect(ctx, 0, y, 16, 3, s % 2 ? STONE : "#8e887c");
        hline(ctx, 0, y, 16, STONE_HI);
        hline(ctx, 0, y + 3, 16, "#4a453e");
        vline(ctx, 0, y, 3, STONE_HI);
      }
      break;
    case "stoneFloor":
      rect(ctx, 0, 0, 16, 16, STONE);
      hline(ctx, 0, 0, 16, MORTAR);
      vline(ctx, 0, 0, 16, MORTAR);
      for (let y = 1; y < 15; y++) {
        for (let x = 1; x < 15; x++) {
          if (hash(x, y + 20) % 17 === 0) pix(ctx, x, y, STONE_HI);
          else if (hash(x + 4, y) % 19 === 0) pix(ctx, x, y, STONE_LO);
        }
      }
      pix(ctx, 1, 1, STONE_HI);
      break;
    case "carpet":
      rect(ctx, 0, 0, 16, 16, "#8a3030");
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          if (((x + y) & 7) === 0) pix(ctx, x, y, "#a84848");
          if (((x - y + 16) & 7) === 3) pix(ctx, x, y, "#6e2424");
        }
      }
      pix(ctx, 8, 7, "#e2c07a");
      pix(ctx, 7, 8, "#e2c07a");
      pix(ctx, 8, 8, "#f0d9a0");
      pix(ctx, 9, 8, "#e2c07a");
      pix(ctx, 8, 9, "#a67c3d");
      break;
    case "castleWall":
      bricks(ctx, false);
      break;
    case "castleWallTop":
      bricks(ctx, true);
      break;
    default:
      rect(ctx, 0, 0, 16, 16, "#c44949");
  }
}

function tile(id: TileId): Sprite {
  const frames = id === "water" ? ["base", "alt"] : ["base"];
  return makeSprite(`tile:${id}`, 16, 16, frames, (ctx, frame) => drawTile(ctx, id, frame));
}

export const tiles: Record<TileId, Sprite> = {
  grass: tile("grass"),
  grassAlt: tile("grassAlt"),
  tallGrass: tile("tallGrass"),
  flowers: tile("flowers"),
  path: tile("path"),
  sand: tile("sand"),
  water: tile("water"),
  bankN: tile("bankN"),
  bankS: tile("bankS"),
  bankE: tile("bankE"),
  bankW: tile("bankW"),
  bridge: tile("bridge"),
  cliff: tile("cliff"),
  stairs: tile("stairs"),
  stoneFloor: tile("stoneFloor"),
  carpet: tile("carpet"),
  castleWall: tile("castleWall"),
  castleWallTop: tile("castleWallTop"),
};
