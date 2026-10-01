import type { Sprite } from "@/game/contracts";
import type { Ctx } from "./pixel";

export function makeSprite(
  id: string,
  width: number,
  height: number,
  frames: readonly string[],
  draw: (ctx: Ctx, frame: string) => void,
): Sprite {
  return { id, width, height, frames, draw };
}
