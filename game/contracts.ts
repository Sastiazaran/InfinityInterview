/**
 * The seam between three parts of the game that are built in parallel:
 * the engine (everything not listed below), the art set (game/art, components/art, app/art),
 * and the story (game/story). Ids are stable. Change this file additively only.
 */

// ——— Route ———

export const NODE_IDS = ["foothills", "gate", "yard", "stair", "west", "east", "throne"] as const;
export type NodeId = (typeof NODE_IDS)[number];

export const ENEMY_IDS = [
  "sentinel",
  "warden",
  "architect",
  "refactorer",
  "puzzlewright",
  "latency",
  "shipwright",
  "cartographer",
  "examiner",
] as const;
export type EnemyId = (typeof ENEMY_IDS)[number];

const STANDING: Record<Exclude<NodeId, "east">, EnemyId> = {
  foothills: "sentinel",
  gate: "warden",
  yard: "architect",
  stair: "refactorer",
  west: "puzzlewright",
  throne: "examiner",
};

const SPECIALISTS: readonly EnemyId[] = ["latency", "shipwright", "cartographer"];

/** The east tower's specialist rotates: Bloodline I, IV, VII… latency; II, V… shipwright; III, VI… cartographer. */
export function enemyAt(node: NodeId, bloodline: number): EnemyId {
  if (node === "east") {
    const n = Math.max(1, Math.floor(bloodline));
    return SPECIALISTS[(n - 1) % SPECIALISTS.length];
  }
  return STANDING[node];
}

export const NPC_IDS = ["mentor", "merchant", "duck", "ghost"] as const;
export type NpcId = (typeof NPC_IDS)[number];

export const ITEM_IDS = [
  "armor",
  "shield",
  "lens",
  "hourglass",
  "seal",
  "potion",
  "scroll",
  "sand",
  "note",
] as const;
export type ItemId = (typeof ITEM_IDS)[number];

/** Rules the engine implements and the story describes. Gear may come in tiers; consumables are used up. */
export const ITEM_EFFECTS: Record<ItemId, string> = {
  armor: "Gear. Each tier adds one max heart.",
  shield: "Gear. Blocks the first miss in each duel.",
  lens: "Gear. Hints also name the principle.",
  hourglass: "Gear. One more Extra time charge each climb.",
  seal: "Gear. One more Ask a senior charge each climb.",
  potion: "Consumable. Restores one heart.",
  scroll: "Consumable. One more Hint this climb.",
  sand: "Consumable. One more Extra time this climb.",
  note: "Consumable. One more Ask a senior this climb.",
};

export const SIGN_IDS = [
  "shore",
  "gate",
  "yard",
  "stair",
  "west",
  "east",
  "throne",
  "shop",
  "pond",
  "hello-world",
] as const;
export type SignId = (typeof SIGN_IDS)[number];

/** Each egg fires once per save. */
export const EGGS = {
  konami: {
    trigger: "Up, Up, Down, Down, Left, Right, Left, Right, B, A, anywhere outside a duel",
    gold: 30,
    perk: "",
  },
  sudo: {
    trigger: "Type s-u-d-o while walking the map",
    gold: 10,
    perk: "Hint charges refill for this climb",
  },
  "rubber-duck": {
    trigger: "Talk to the duck hidden behind the trees by the pond",
    gold: 0,
    perk: "Every climb starts with one extra Hint",
  },
  "hello-world": {
    trigger: "Read the hidden sign in the far corner of the shore",
    gold: 10,
    perk: "",
  },
  "off-by-one": {
    trigger: "Step onto the secret tile one past the end of the shore path",
    gold: 15,
    perk: "",
  },
  "infinite-loop": {
    trigger: "Walk three full laps around the pond",
    gold: 15,
    perk: "",
  },
  "git-blame": {
    trigger: "Talk to the ghost in the castle yard",
    gold: 10,
    perk: "",
  },
  "forty-two": {
    trigger: "Give your 42nd answer, counted across every climb",
    gold: 42,
    perk: "",
  },
} as const satisfies Record<string, { trigger: string; gold: number; perk: string }>;
export type EggId = keyof typeof EGGS;
export const EGG_IDS = Object.keys(EGGS) as EggId[];

// ——— Art ———

/** A sprite painted in code at native resolution. Scale up with nearest-neighbor only. */
export type Sprite = {
  id: string;
  width: number;
  height: number;
  frames: readonly string[];
  /** Paints one frame at native size: origin top-left, whole pixels, no anti-aliasing. */
  draw: (ctx: CanvasRenderingContext2D, frame: string) => void;
};

/**
 * Sizes and frame names. Overworld characters stand on one 16×16 tile: their bottom 16 rows
 * cover it and the top 8 overlap the tile above. Walk frames: 0 stands, 1 and 2 alternate steps.
 */
export const SPRITE_SPECS = {
  tile: { width: 16, height: 16, frames: ["base"] },
  icon: { width: 16, height: 16, frames: ["base"] },
  backdrop: { width: 240, height: 120, frames: ["base"] },
  enemyPortrait: { width: 64, height: 64, frames: ["idle", "blink", "hurt", "defeated"] },
  enemyOverworld: { width: 16, height: 24, frames: ["down0", "down1"] },
  playerOverworld: {
    width: 16,
    height: 24,
    frames: [
      "down0",
      "down1",
      "down2",
      "up0",
      "up1",
      "up2",
      "left0",
      "left1",
      "left2",
      "right0",
      "right1",
      "right2",
    ],
  },
  playerBattle: { width: 64, height: 64, frames: ["idle", "attack", "hurt"] },
  npcOverworld: { width: 16, height: 24, frames: ["down0", "down1"] },
  npcPortrait: { width: 48, height: 48, frames: ["idle", "talk"] },
} as const;

/** 16×16 ground. water also has an "alt" frame. bankN/S/E/W are water with the land bank along that edge. */
export const TILE_IDS = [
  "grass",
  "grassAlt",
  "tallGrass",
  "flowers",
  "path",
  "sand",
  "water",
  "bankN",
  "bankS",
  "bankE",
  "bankW",
  "bridge",
  "cliff",
  "stairs",
  "stoneFloor",
  "carpet",
  "castleWall",
  "castleWallTop",
] as const;
export type TileId = (typeof TILE_IDS)[number];

/** Drawn over tiles, anchored bottom-left on the map grid. The bottom row of 16px cells is the footprint. */
export const OBJECT_SPECS = {
  tree: { width: 16, height: 32, frames: ["base"] },
  pine: { width: 16, height: 32, frames: ["base"] },
  bush: { width: 16, height: 16, frames: ["base"] },
  rock: { width: 16, height: 16, frames: ["base"] },
  fence: { width: 16, height: 16, frames: ["base"] },
  sign: { width: 16, height: 16, frames: ["base"] },
  chest: { width: 16, height: 16, frames: ["closed", "open"] },
  torch: { width: 16, height: 16, frames: ["a", "b"] },
  campfire: { width: 16, height: 16, frames: ["a", "b"] },
  banner: { width: 16, height: 32, frames: ["a", "b"] },
  statue: { width: 16, height: 32, frames: ["base"] },
  throne: { width: 32, height: 32, frames: ["base"] },
  castleGate: { width: 48, height: 48, frames: ["base"] },
  shopTent: { width: 48, height: 48, frames: ["base"] },
  tower: { width: 32, height: 64, frames: ["base"] },
} as const;
export type ObjectId = keyof typeof OBJECT_SPECS;

/** 16×16, frame "base". Every ItemId has an icon of the same name. */
export const ICON_IDS = ["heart", "heartEmpty", "coin", "star", "key", "duck", ...ITEM_IDS] as const;
export type IconId = (typeof ICON_IDS)[number];

/** 240×120 battle backgrounds with two ground platforms: the enemy's upper right, the player's lower left. */
export const BACKDROP_IDS = ["shore", "gate", "yard", "stair", "tower", "throne"] as const;
export type BackdropId = (typeof BACKDROP_IDS)[number];

const BACKDROP_AT: Record<NodeId, BackdropId> = {
  foothills: "shore",
  gate: "gate",
  yard: "yard",
  stair: "stair",
  west: "tower",
  east: "tower",
  throne: "throne",
};

export function backdropAt(node: NodeId): BackdropId {
  return BACKDROP_AT[node];
}

/** What game/art/index.ts exports as ART. */
export type ArtModule = {
  /** Bloodlines I–III use the base palette; each later age of three Bloodlines swaps palettes. */
  enemyPortrait: (id: EnemyId, bloodline: number) => Sprite;
  enemyOverworld: (id: EnemyId, bloodline: number) => Sprite;
  playerOverworld: Sprite;
  playerBattle: Sprite;
  npcOverworld: Record<NpcId, Sprite>;
  npcPortrait: Record<NpcId, Sprite>;
  tiles: Record<TileId, Sprite>;
  objects: Record<ObjectId, Sprite>;
  icons: Record<IconId, Sprite>;
  backdrops: Record<BackdropId, Sprite>;
  /** Browser only. Cached by sprite, frame, and scale. */
  renderSprite: (sprite: Sprite, frame: string, scale?: number) => HTMLCanvasElement;
  /** Browser only. Cached PNG data URL. */
  spriteURL: (sprite: Sprite, frame: string, scale?: number) => string;
};

/** Props of components/art/SpriteCanvas.tsx, a client component that paints after mount. */
export type SpriteCanvasProps = {
  sprite: Sprite;
  frame?: string;
  scale?: number;
  className?: string;
  label?: string;
};

// ——— Story ———

/** May contain {bloodline} (a Roman numeral) and {gold}. At most 110 characters: two lines of a dialog box. */
export type Line = string;

export type EnemyStory = {
  name: string;
  title: string;
  /** One line on what this guardian tests. */
  domain: Line;
  /** Pools; the engine picks one line per moment. */
  intro: Line[];
  /** The player answered right. */
  struck: Line[];
  /** The player missed. */
  taunt: Line[];
  /** The guardian falls. */
  defeat: Line[];
  /** The player falls in this duel. */
  triumph: Line[];
};

export type NpcStory = {
  name: string;
  /** Spoken one per visit, in order; the last line repeats. */
  lines: Line[];
};

export type Chapter = { numeral: string; title: string; epigraph: Line };

/** What game/story/index.ts exports as STORY. */
export type Story = {
  title: string;
  tagline: Line;
  prologue: Line[];
  /** Deterministic and defined for every whole n >= 1; numeral is toRoman(n). */
  chapter: (bloodline: number) => Chapter;
  enemies: Record<EnemyId, EnemyStory>;
  npcs: Record<NpcId, NpcStory>;
  merchant: { greet: Line[]; bought: Line[]; broke: Line[]; owned: Line[]; farewell: Line[] };
  items: Record<ItemId, { name: string; flavor: Line }>;
  signs: Record<SignId, Line[]>;
  eggs: Record<EggId, { title: string; lines: Line[] }>;
  stageClear: Record<NodeId, Line>;
  rebirth: { victory: Line[]; defeat: Line[] };
  lifelines: { hint: Line[]; time: Line[]; senior: Line[] };
};

export function toRoman(value: number): string {
  let n = Math.max(1, Math.floor(value));
  if (n >= 4000) return String(n);
  const table: [number, string][] = [
    [1000, "M"],
    [900, "CM"],
    [500, "D"],
    [400, "CD"],
    [100, "C"],
    [90, "XC"],
    [50, "L"],
    [40, "XL"],
    [10, "X"],
    [9, "IX"],
    [5, "V"],
    [4, "IV"],
    [1, "I"],
  ];
  let out = "";
  for (const [size, glyph] of table) {
    while (n >= size) {
      out += glyph;
      n -= size;
    }
  }
  return out;
}

export function fillLine(line: Line, vars: { bloodline: number; gold?: number }): string {
  return line
    .replaceAll("{bloodline}", toRoman(vars.bloodline))
    .replaceAll("{gold}", String(vars.gold ?? 0));
}
