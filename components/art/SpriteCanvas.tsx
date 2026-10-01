"use client";

import { useEffect, useRef } from "react";
import type { SpriteCanvasProps } from "@/game/contracts";
import { renderSprite } from "@/game/art";

export function SpriteCanvas({ sprite, frame, scale = 1, className, label }: SpriteCanvasProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  const frameName = frame ?? sprite.frames[0] ?? "base";
  const safeScale = scale > 0 ? scale : 1;
  const width = Math.max(1, Math.round(sprite.width * safeScale));
  const height = Math.max(1, Math.round(sprite.height * safeScale));

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const painted = renderSprite(sprite, frameName, safeScale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(painted, 0, 0);
  }, [sprite, frameName, safeScale]);

  return (
    <canvas
      ref={ref}
      role="img"
      aria-label={label}
      width={width}
      height={height}
      className={className}
      style={{
        width,
        height,
        imageRendering: "pixelated",
        display: "block",
      }}
    />
  );
}
