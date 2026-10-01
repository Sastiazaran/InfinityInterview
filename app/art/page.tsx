"use client";

import { ART } from "@/game/art";
import { SpriteCanvas } from "@/components/art/SpriteCanvas";

/** Placeholder gallery. The full sheet lands with the finished sprites. */
export default function ArtPage() {
  const sentinel = ART.enemyPortrait("sentinel", 1);
  return (
    <main className="shell">
      <p className="kicker">Art</p>
      <h1>Sprite sheet</h1>
      <SpriteCanvas sprite={sentinel} frame="idle" scale={3} label="Foothill Sentinel, idle" />
    </main>
  );
}
