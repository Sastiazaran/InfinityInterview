import type { ArtModule, Sprite } from "@/game/contracts";
import { backdrops } from "./backdrops";
import { enemyOverworld, enemyPortrait } from "./enemies";
import { icons } from "./icons";
import { npcOverworld, npcPortrait } from "./npcs";
import { objects } from "./objects";
import { playerBattle, playerOverworld } from "./player";
import { tiles } from "./tiles";

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

export const ART: ArtModule = {
  enemyPortrait,
  enemyOverworld,
  playerOverworld,
  playerBattle,
  npcOverworld,
  npcPortrait,
  tiles,
  objects,
  icons,
  backdrops,
  renderSprite,
  spriteURL,
};
