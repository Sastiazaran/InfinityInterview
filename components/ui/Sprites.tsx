"use client";

import { ART } from "@/game/art";
import { SpriteCanvas } from "@/components/art/SpriteCanvas";
import type { IconId } from "@/game/contracts";

export function Icon({
  id,
  scale = 2,
  className,
  label,
}: {
  id: IconId;
  scale?: number;
  className?: string;
  label?: string;
}) {
  return (
    <SpriteCanvas
      sprite={ART.icons[id]}
      scale={scale}
      className={`px-icon ${className ?? ""}`}
      label={label ?? ""}
    />
  );
}

const HEART_ROW_LIMIT = 10;

export function Hearts({
  current,
  max,
  className,
  breaking,
}: {
  current: number;
  max: number;
  className?: string;
  /** Index of a heart that just broke, to replay its animation. */
  breaking?: number | null;
}) {
  const label = `${current} of ${max} hearts`;
  if (max > HEART_ROW_LIMIT) {
    return (
      <span className={`hearts compact ${className ?? ""}`} aria-label={label}>
        <Icon id={current > 0 ? "heart" : "heartEmpty"} />
        <b>
          {current}/{max}
        </b>
      </span>
    );
  }
  return (
    <span className={`hearts ${className ?? ""}`} aria-label={label}>
      {Array.from({ length: max }, (_, index) => (
        <span key={index} className={`heart-slot ${breaking === index ? "breaking" : ""}`}>
          <Icon id={index < current ? "heart" : "heartEmpty"} />
        </span>
      ))}
    </span>
  );
}

export function Coin({ amount, className }: { amount: number; className?: string }) {
  return (
    <span className={`coin ${className ?? ""}`}>
      <Icon id="coin" />
      <b>{amount}</b>
    </span>
  );
}
