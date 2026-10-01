import type {
  ArtModule,
  BackdropId,
  EnemyId,
  IconId,
  NpcId,
  ObjectId,
  Sprite,
  TileId,
} from "@/game/contracts";
import { BACKDROP_IDS, ICON_IDS, NPC_IDS, OBJECT_SPECS, TILE_IDS } from "@/game/contracts";

const canvasCache = new WeakMap<Sprite, Map<string, HTMLCanvasElement>>();
const urlCache = new WeakMap<Sprite, Map<string, string>>();

function bucket<T>(store: WeakMap<Sprite, Map<string, T>>, sprite: Sprite): Map<string, T> {
  let map = store.get(sprite);
  if (!map) {
    map = new Map();
    store.set(sprite, map);
  }
  return map;
}

/** Nearest-neighbor scale of a native sprite. Browser only; cached by sprite, frame, and scale. */
export function renderSprite(sprite: Sprite, frame: string, scale = 1): HTMLCanvasElement {
  if (typeof document === "undefined") {
    throw new Error("renderSprite is only available in the browser");
  }
  const safeScale = scale > 0 ? scale : 1;
  const key = `${frame}@${safeScale}`;
  const frames = bucket(canvasCache, sprite);
  const hit = frames.get(key);
  if (hit) return hit;

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(sprite.width * safeScale));
  canvas.height = Math.max(1, Math.round(sprite.height * safeScale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get a 2d canvas context");
  ctx.imageSmoothingEnabled = false;

  if (safeScale === 1) {
    sprite.draw(ctx, frame);
  } else {
    const native = document.createElement("canvas");
    native.width = sprite.width;
    native.height = sprite.height;
    const nativeCtx = native.getContext("2d");
    if (!nativeCtx) throw new Error("Could not get a 2d canvas context");
    nativeCtx.imageSmoothingEnabled = false;
    sprite.draw(nativeCtx, frame);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(native, 0, 0, canvas.width, canvas.height);
  }

  frames.set(key, canvas);
  return canvas;
}

/** Cached PNG data URL for a sprite frame. Browser only. */
export function spriteURL(sprite: Sprite, frame: string, scale = 1): string {
  if (typeof document === "undefined") {
    throw new Error("spriteURL is only available in the browser");
  }
  const safeScale = scale > 0 ? scale : 1;
  const key = `${frame}@${safeScale}`;
  const frames = bucket(urlCache, sprite);
  const hit = frames.get(key);
  if (hit) return hit;
  const url = renderSprite(sprite, frame, safeScale).toDataURL("image/png");
  frames.set(key, url);
  return url;
}

const SWATCH = ["#8ea58a", "#c44949", "#e2c07a", "#7aa2c4", "#a67c3d", "#f4e7cf", "#6e8b6e", "#d07a4a"];

function colorFor(id: string, age: number): string {
  let hash = age * 17;
  for (let i = 0; i < id.length; i++) hash = (hash + id.charCodeAt(i) * (i + 3)) % 997;
  return SWATCH[hash % SWATCH.length];
}

/** Bloodlines I–III share palette 0; each later age of three cycles through four palettes. */
export function paletteAge(bloodline: number): number {
  const n = Math.max(1, Math.floor(bloodline));
  return Math.floor((n - 1) / 3) % 4;
}

function placeholder(
  id: string,
  width: number,
  height: number,
  frames: readonly string[],
  color: string,
): Sprite {
  return {
    id,
    width,
    height,
    frames,
    draw(ctx, frame) {
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = "#241c16";
      ctx.fillRect(0, 0, width, 1);
      ctx.fillRect(0, height - 1, width, 1);
      ctx.fillRect(0, 0, 1, height);
      ctx.fillRect(width - 1, 0, 1, height);
      const mark = Math.max(0, frames.indexOf(frame));
      ctx.fillStyle = "#f4e7cf";
      ctx.fillRect(2, 2, Math.min(width - 4, 2 + mark), 2);
    },
  };
}

const portraitCache = new Map<string, Sprite>();
const overworldCache = new Map<string, Sprite>();

function enemyPortrait(id: EnemyId, bloodline: number): Sprite {
  const age = paletteAge(bloodline);
  const key = `${id}:${age}`;
  const cached = portraitCache.get(key);
  if (cached) return cached;
  const sprite = placeholder(
    `enemy:${id}:portrait:${age}`,
    64,
    64,
    ["idle", "blink", "hurt", "defeated"],
    colorFor(id, age),
  );
  portraitCache.set(key, sprite);
  return sprite;
}

function enemyOverworld(id: EnemyId, bloodline: number): Sprite {
  const age = paletteAge(bloodline);
  const key = `${id}:${age}`;
  const cached = overworldCache.get(key);
  if (cached) return cached;
  const sprite = placeholder(
    `enemy:${id}:overworld:${age}`,
    16,
    24,
    ["down0", "down1"],
    colorFor(id, age + 3),
  );
  overworldCache.set(key, sprite);
  return sprite;
}

function recordFrom<T extends string>(ids: readonly T[], make: (id: T) => Sprite): Record<T, Sprite> {
  const out = {} as Record<T, Sprite>;
  for (const id of ids) out[id] = make(id);
  return out;
}

export const ART: ArtModule = {
  enemyPortrait,
  enemyOverworld,
  playerOverworld: placeholder(
    "player:overworld",
    16,
    24,
    [
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
    "#3d9a94",
  ),
  playerBattle: placeholder("player:battle", 64, 64, ["idle", "attack", "hurt"], "#2a706c"),
  npcOverworld: recordFrom(NPC_IDS, (id) =>
    placeholder(`npc:${id}:overworld`, 16, 24, ["down0", "down1"], colorFor(id, 1)),
  ),
  npcPortrait: recordFrom(NPC_IDS, (id) =>
    placeholder(`npc:${id}:portrait`, 48, 48, ["idle", "talk"], colorFor(id, 2)),
  ),
  tiles: recordFrom(TILE_IDS, (id) =>
    placeholder(
      `tile:${id}`,
      16,
      16,
      id === "water" ? ["base", "alt"] : ["base"],
      colorFor(id, 0),
    ),
  ),
  objects: recordFrom(Object.keys(OBJECT_SPECS) as ObjectId[], (id) => {
    const spec = OBJECT_SPECS[id];
    return placeholder(`object:${id}`, spec.width, spec.height, spec.frames, colorFor(id, 4));
  }),
  icons: recordFrom(ICON_IDS, (id) => placeholder(`icon:${id}`, 16, 16, ["base"], colorFor(id, 5))),
  backdrops: recordFrom(BACKDROP_IDS, (id) =>
    placeholder(`backdrop:${id}`, 240, 120, ["base"], colorFor(id, 6)),
  ),
  renderSprite,
  spriteURL,
};

export type { BackdropId, EnemyId, IconId, NpcId, ObjectId, Sprite, TileId };
