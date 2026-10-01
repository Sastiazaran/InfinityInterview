"use client";

import { SpriteCanvas } from "@/components/art/SpriteCanvas";
import { ART } from "@/game/art";
import { ENEMY_IDS } from "@/game/contracts";
import type { EnemyId } from "@/game/contracts";

const NAMES: Record<EnemyId, string> = {
  sentinel: "Foothill Sentinel",
  warden: "Gate Warden",
  architect: "The Architect",
  refactorer: "The Refactorer",
  puzzlewright: "The Puzzlewright",
  latency: "Lady Latency",
  shipwright: "The Shipwright",
  cartographer: "The Cartographer",
  examiner: "The Crown Examiner",
};

export default function PortraitPage() {
  return (
    <main className="art-page">
      <h1>Guardians</h1>
      {ENEMY_IDS.map((id) => (
        <section key={id} className="art-enemy">
          <h2>{NAMES[id]}</h2>
          <div className="art-row">
            {ART.enemyPortrait(id, 1).frames.map((frame) => (
              <figure key={frame} className="art-cell">
                <SpriteCanvas
                  sprite={ART.enemyPortrait(id, 1)}
                  frame={frame}
                  scale={3}
                  label={`${NAMES[id]}, ${frame}`}
                />
                <figcaption>{frame}</figcaption>
              </figure>
            ))}
          </div>
        </section>
      ))}
      <style>{`
        .art-page { width: min(1100px, calc(100% - 1.5rem)); margin: 0 auto; padding: 1rem 0 2rem; }
        .art-enemy { margin: 0.4rem 0 0.8rem; }
        .art-enemy h2 { margin: 0 0 0.35rem; font-family: var(--font-display), Georgia, serif; font-size: 1.1rem; }
        .art-row { display: flex; gap: 0.5rem; align-items: end; }
        .art-cell { margin: 0; background: #1a283c; border: 1px solid #3a4a62; padding: 0.35rem; }
        .art-cell figcaption { color: #e7d3ae; font-size: 0.72rem; margin-top: 0.2rem; }
      `}</style>
    </main>
  );
}
