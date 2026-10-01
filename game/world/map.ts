import type { EggId, NpcId, ObjectId, SignId, TileId } from "../contracts";
import { hash } from "../rng";
import type { Facing } from "../types";

export const MAP_W = 40;
export const MAP_H = 32;
export const TILE = 16;

export type Cell = { x: number; y: number };

const LEGEND: Record<string, TileId> = {
  "~": "water",
  ".": "grass",
  ",": "grassAlt",
  '"': "tallGrass",
  "*": "flowers",
  "=": "path",
  ":": "sand",
  b: "bridge",
  "#": "cliff",
  H: "stairs",
  _: "stoneFloor",
  "+": "carpet",
  W: "castleWall",
  T: "castleWallTop",
};

type Span = [string, number];

const hallInside: Span[] = [["~", 14], ["T", 1], ["_", 4], ["+", 2], ["_", 4], ["T", 1], ["~", 14]];
const terrace: Span[] = [["~", 2], ["_", 17], ["+", 2], ["_", 17], ["~", 2]];
const yard: Span[] = [["~", 2], [",", 5], ["T", 1], [".", 11], ["_", 2], [".", 11], ["T", 1], [",", 5], ["~", 2]];
const curtainFace: Span[] = [["~", 2], [",", 5], ["W", 12], ["_", 1], ["W", 13], [",", 5], ["~", 2]];
const channel: Span[] = [["~", 19], ["b", 2], ["~", 19]];
const pondRow: Span[] = [["~", 1], [".", 8], ["=", 1], [".", 17], ["~", 5], [".", 7], ["~", 1]];
const beach: Span[] = [["~", 1], [":", 38], ["~", 1]];

/** South is the shore where a climb begins; north is the throne. */
const ROWS: Span[][] = [
  [["~", 14], ["T", 12], ["~", 14]],
  [["~", 14], ["T", 1], ["W", 10], ["T", 1], ["~", 14]],
  hallInside,
  hallInside,
  hallInside,
  hallInside,
  [["~", 14], ["T", 5], ["+", 2], ["T", 5], ["~", 14]],
  [["~", 14], ["W", 5], ["+", 2], ["W", 5], ["~", 14]],
  terrace,
  terrace,
  terrace,
  [["~", 2], ["#", 5], ["T", 12], ["H", 2], ["T", 12], ["#", 5], ["~", 2]],
  [["~", 2], ["#", 5], ["W", 12], ["H", 2], ["W", 12], ["#", 5], ["~", 2]],
  yard,
  yard,
  yard,
  yard,
  [["~", 2], [",", 5], ["T", 12], ["_", 1], ["T", 13], [",", 5], ["~", 2]],
  curtainFace,
  curtainFace,
  [["~", 2], [",", 5], [".", 12], ["=", 2], [".", 12], [",", 5], ["~", 2]],
  channel,
  channel,
  [["~", 1], [".", 18], ["=", 2], [".", 18], ["~", 1]],
  [["~", 1], [".", 8], ["=", 12], [".", 18], ["~", 1]],
  [["~", 1], [".", 8], ["=", 1], [".", 29], ["~", 1]],
  pondRow,
  [["~", 1], [".", 3], ["=", 6], [".", 17], ["~", 5], [".", 7], ["~", 1]],
  pondRow,
  beach,
  beach,
  [["~", 40]],
];

function rect(x0: number, y0: number, x1: number, y1: number): Cell[] {
  const cells: Cell[] = [];
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) cells.push({ x, y });
  return cells;
}

const PAINT: [TileId, Cell[]][] = [
  ["tallGrass", [...rect(11, 25, 16, 26), ...rect(21, 26, 23, 28), ...rect(35, 25, 38, 27)]],
  ["flowers", [...rect(12, 28, 13, 28), ...rect(6, 25, 7, 25), ...rect(9, 16, 11, 16), ...rect(29, 16, 30, 16)]],
];

function buildGround(): TileId[][] {
  const grid = ROWS.map((runs) => runs.flatMap(([ch, count]) => Array<TileId>(count).fill(LEGEND[ch])));
  for (const [tile, cells] of PAINT) for (const { x, y } of cells) grid[y][x] = tile;
  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      if (grid[y][x] === "grass" && hash(`${x},${y}`) % 7 === 0) grid[y][x] = "grassAlt";
    }
  }
  return grid;
}

export const GROUND: TileId[][] = buildGround();

const SOLID_TILES = new Set<TileId>(["water", "bankN", "bankS", "bankE", "bankW", "cliff", "castleWall", "castleWallTop"]);
const BANK_LAND = new Set<TileId>(["grass", "grassAlt", "tallGrass", "flowers", "path", "sand", "cliff", "stoneFloor", "carpet"]);

export function tileAt(x: number, y: number): TileId {
  if (x < 0 || y < 0 || x >= MAP_W || y >= MAP_H) return "water";
  return GROUND[y][x];
}

/** Water touching land shows the bank along that edge. */
export function displayTile(x: number, y: number): TileId {
  const tile = tileAt(x, y);
  if (tile !== "water") return tile;
  const land = (dx: number, dy: number) => {
    const nx = x + dx;
    const ny = y + dy;
    if (nx < 0 || ny < 0 || nx >= MAP_W || ny >= MAP_H) return false;
    return BANK_LAND.has(GROUND[ny][nx]);
  };
  if (land(0, -1)) return "bankN";
  if (land(0, 1)) return "bankS";
  if (land(-1, 0)) return "bankW";
  if (land(1, 0)) return "bankE";
  return "water";
}

export function solidTile(x: number, y: number): boolean {
  return SOLID_TILES.has(tileAt(x, y));
}

export type Placed = {
  key: string;
  object: ObjectId;
  /** Bottom-left cell of the sprite. */
  x: number;
  y: number;
  /** Cells that block movement. */
  solid: Cell[];
  chest?: string;
  sign?: SignId;
};

function place(object: ObjectId, x: number, y: number, width = 1): Placed {
  return {
    key: `${object}-${x}-${y}`,
    object,
    x,
    y,
    solid: Array.from({ length: width }, (_, i) => ({ x: x + i, y })),
  };
}

const trees: Placed[] = [
  ...rect(1, 24, 7, 24),
  ...rect(9, 23, 17, 23),
  ...rect(23, 23, 24, 23),
  ...rect(25, 24, 33, 24),
  ...rect(25, 25, 25, 28),
  ...rect(33, 25, 33, 28),
  ...rect(35, 24, 38, 24),
  ...rect(1, 25, 1, 28),
].map(({ x, y }) => place("tree", x, y));

const pines: Placed[] = [
  ...rect(2, 13, 6, 20).filter(({ x, y }) => !(y === 20 && x >= 4) && !(x === 4 && y === 19)),
  ...rect(33, 13, 37, 20),
].map(({ x, y }) => place("pine", x, y));

const bushes: Placed[] = [
  { x: 2, y: 26 },
  { x: 3, y: 26 },
  { x: 2, y: 27 },
  { x: 2, y: 28 },
  { x: 3, y: 28 },
  { x: 18, y: 23 },
].map(({ x, y }) => place("bush", x, y));

const rocks: Placed[] = [
  { x: 3, y: 30 },
  { x: 13, y: 30 },
  { x: 21, y: 30 },
  { x: 36, y: 30 },
].map(({ x, y }) => place("rock", x, y));

export const CHESTS: { id: string; x: number; y: number }[] = [
  { id: "shore-grass", x: 16, y: 26 },
  { id: "shore-nook", x: 38, y: 23 },
  { id: "front-pines", x: 4, y: 19 },
  { id: "yard-corner", x: 31, y: 13 },
  { id: "west-terrace", x: 2, y: 8 },
  { id: "east-terrace", x: 37, y: 8 },
];

export const SIGNS: { id: SignId; x: number; y: number }[] = [
  { id: "shore", x: 8, y: 28 },
  { id: "pond", x: 25, y: 29 },
  { id: "gate", x: 22, y: 23 },
  { id: "yard", x: 16, y: 15 },
  { id: "stair", x: 22, y: 13 },
  { id: "shop", x: 29, y: 15 },
  { id: "west", x: 6, y: 8 },
  { id: "east", x: 33, y: 8 },
  { id: "throne", x: 21, y: 8 },
  { id: "hello-world", x: 1, y: 23 },
];

/** Torches, banners, and the campfire swap frames on a timer. */
export const ANIMATED: ObjectId[] = ["torch", "campfire", "banner"];

export const OBJECTS: Placed[] = [
  ...trees,
  ...pines,
  ...bushes,
  ...rocks,
  ...CHESTS.map((chest) => ({ ...place("chest", chest.x, chest.y), chest: chest.id })),
  ...SIGNS.map((sign) => ({ ...place("sign", sign.x, sign.y), sign: sign.id })),
  place("campfire", 16, 28),
  { ...place("castleGate", 18, 19), solid: [] },
  place("torch", 16, 19),
  place("torch", 22, 19),
  place("banner", 12, 19),
  place("banner", 26, 19),
  place("shopTent", 26, 15, 3),
  place("statue", 9, 13),
  place("statue", 12, 13),
  place("banner", 11, 12),
  place("banner", 15, 12),
  place("banner", 24, 12),
  place("banner", 28, 12),
  place("torch", 17, 12),
  place("torch", 22, 12),
  place("tower", 3, 8, 2),
  place("tower", 35, 8, 2),
  place("torch", 17, 8),
  place("torch", 22, 8),
  place("banner", 16, 7),
  place("banner", 23, 7),
  place("throne", 19, 2, 2),
  place("torch", 16, 1),
  place("torch", 23, 1),
  place("banner", 15, 2),
  place("banner", 24, 2),
  place("statue", 16, 5),
  place("statue", 23, 5),
];

export type NpcSpot = { key: string; npc: NpcId; x: number; y: number; shop?: boolean };

export const NPC_SPOTS: NpcSpot[] = [
  { key: "mentor", npc: "mentor", x: 11, y: 27 },
  { key: "merchant-shore", npc: "merchant", x: 15, y: 28, shop: true },
  { key: "merchant-yard", npc: "merchant", x: 27, y: 16, shop: true },
  { key: "ghost", npc: "ghost", x: 10, y: 14 },
  { key: "duck", npc: "duck", x: 29, y: 23 },
];

export type Zone = { x0: number; y0: number; x1: number; y1: number };

export type EnemySpot = { node: number; x: number; y: number; zone: Zone };

/** Each guardian faces south. Entering its zone, or bumping into it, starts the duel. */
export const ENEMY_SPOTS: EnemySpot[] = [
  { node: 0, x: 19, y: 23, zone: { x0: 18, y0: 24, x1: 21, y1: 25 } },
  { node: 1, x: 19, y: 20, zone: { x0: 18, y0: 21, x1: 21, y1: 22 } },
  { node: 2, x: 19, y: 13, zone: { x0: 18, y0: 14, x1: 21, y1: 15 } },
  { node: 3, x: 19, y: 11, zone: { x0: 19, y0: 12, x1: 20, y1: 12 } },
  { node: 4, x: 3, y: 9, zone: { x0: 2, y0: 9, x1: 7, y1: 10 } },
  { node: 5, x: 36, y: 9, zone: { x0: 32, y0: 9, x1: 37, y1: 10 } },
  { node: 6, x: 19, y: 3, zone: { x0: 15, y0: 4, x1: 24, y1: 5 } },
];

/** A ward closes the way behind each guardian until that guardian falls. */
export const WARDS: { node: number; cells: Cell[] }[] = [
  { node: 0, cells: rect(19, 22, 20, 22) },
  { node: 1, cells: [{ x: 19, y: 19 }] },
  { node: 2, cells: rect(19, 12, 20, 12) },
  { node: 3, cells: rect(19, 10, 20, 10) },
  { node: 4, cells: rect(23, 8, 23, 10) },
  { node: 5, cells: rect(19, 7, 20, 7) },
];

export const START: { x: number; y: number; facing: Facing } = { x: 9, y: 28, facing: "up" };

/** The spur path ends at x = 4. One more step west is the secret. */
export const OFF_BY_ONE: Cell = { x: 3, y: 27 };

/** Water of the pond. Walking its one-tile ring three times around is a secret. */
export const POND = { x0: 27, y0: 26, x1: 31, y1: 28 };

export function onPondRing(x: number, y: number): boolean {
  const dx = Math.max(POND.x0 - x, 0, x - POND.x1);
  const dy = Math.max(POND.y0 - y, 0, y - POND.y1);
  return Math.max(dx, dy) === 1;
}

export function inPond(x: number, y: number): boolean {
  return x >= POND.x0 && x <= POND.x1 && y >= POND.y0 && y <= POND.y1;
}

export const POND_CENTER = { x: (POND.x0 + POND.x1) / 2, y: (POND.y0 + POND.y1) / 2 };

export const MAP_SECRETS: EggId[] = ["hello-world", "off-by-one", "infinite-loop", "rubber-duck", "git-blame"];

export function inZone(zone: Zone, x: number, y: number): boolean {
  return x >= zone.x0 && x <= zone.x1 && y >= zone.y0 && y <= zone.y1;
}
