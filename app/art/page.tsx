"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { SpriteCanvas } from "@/components/art/SpriteCanvas";
import { ART, renderSprite } from "@/game/art";
import type { BackdropId, EnemyId, IconId, NpcId, ObjectId, Sprite, TileId } from "@/game/contracts";
import { BACKDROP_IDS, ENEMY_IDS, ICON_IDS, NPC_IDS, OBJECT_SPECS, TILE_IDS } from "@/game/contracts";

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

const NPC_NAMES: Record<NpcId, string> = {
  mentor: "Mentor",
  merchant: "Merchant",
  duck: "Rubber duck",
  ghost: "Commit ghost",
};

function Cell({
  sprite,
  frame,
  scale = 3,
  label,
}: {
  sprite: Sprite;
  frame?: string;
  scale?: number;
  label: string;
}) {
  return (
    <figure className="art-cell">
      <SpriteCanvas sprite={sprite} frame={frame} scale={scale} label={label} />
      <figcaption>{label}</figcaption>
    </figure>
  );
}

function Row({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="art-section">
      <h2>{title}</h2>
      <div className="art-row">{children}</div>
    </section>
  );
}

const SHORE = ["........", "..uuuu..", ".eggggw.", ".eggggw.", "..nnnn..", "........"];

const ROUTE = [
  "..............",
  "..uuuuuuuuuu..",
  ".egggkkkkgggw.",
  ".egfpllllgggw.",
  ".egpoxrrrppgw.",
  ".etgpppppppgw.",
  ".esbbssssssgw.",
  "..nnnnnnnnnn..",
  "..............",
];

const TILE_CHAR: Record<string, TileId> = {
  ".": "water",
  u: "bankS",
  e: "bankE",
  w: "bankW",
  n: "bankN",
  g: "grass",
  a: "grassAlt",
  t: "tallGrass",
  f: "flowers",
  p: "path",
  s: "sand",
  b: "bridge",
  c: "cliff",
  x: "stairs",
  o: "stoneFloor",
  r: "carpet",
  l: "castleWall",
  k: "castleWallTop",
};

const PROPS: { id: ObjectId; frame: string; col: number; row: number }[] = [
  { id: "tower", frame: "base", col: 10, row: 4 },
  { id: "castleGate", frame: "base", col: 4, row: 3 },
  { id: "banner", frame: "a", col: 3, row: 3 },
  { id: "statue", frame: "base", col: 2, row: 4 },
  { id: "pine", frame: "base", col: 2, row: 3 },
  { id: "tree", frame: "base", col: 11, row: 5 },
  { id: "bush", frame: "base", col: 2, row: 5 },
  { id: "shopTent", frame: "base", col: 8, row: 6 },
  { id: "throne", frame: "base", col: 6, row: 5 },
  { id: "chest", frame: "closed", col: 9, row: 4 },
  { id: "torch", frame: "a", col: 4, row: 4 },
  { id: "torch", frame: "b", col: 7, row: 4 },
  { id: "fence", frame: "base", col: 8, row: 5 },
  { id: "fence", frame: "base", col: 9, row: 5 },
  { id: "sign", frame: "base", col: 5, row: 6 },
  { id: "campfire", frame: "a", col: 3, row: 6 },
  { id: "rock", frame: "base", col: 11, row: 6 },
];

function paintMap(
  ctx: CanvasRenderingContext2D,
  rows: readonly string[],
  scale: number,
  props: typeof PROPS = [],
) {
  const cols = rows[0]?.length ?? 0;
  for (let y = 0; y < rows.length; y++) {
    for (let x = 0; x < cols; x++) {
      const id = TILE_CHAR[rows[y][x]] ?? "water";
      const painted = renderSprite(ART.tiles[id], "base", scale);
      ctx.drawImage(painted, x * 16 * scale, y * 16 * scale);
    }
  }
  const sorted = [...props].sort((a, b) => a.row - b.row || a.col - b.col);
  for (const prop of sorted) {
    const sprite = ART.objects[prop.id];
    const painted = renderSprite(sprite, prop.frame, scale);
    const ox = prop.col * 16 * scale;
    const oy = (prop.row * 16 - (sprite.height - 16)) * scale;
    ctx.drawImage(painted, ox, oy);
  }
}

function MapCanvas({
  rows,
  props = [],
  scale = 3,
  label,
}: {
  rows: readonly string[];
  props?: typeof PROPS;
  scale?: number;
  label: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const width = (rows[0]?.length ?? 0) * 16 * scale;
  const height = rows.length * 16 * scale;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    paintMap(ctx, rows, scale, props);
  }, [rows, props, scale]);

  return (
    <canvas
      ref={ref}
      role="img"
      aria-label={label}
      width={width}
      height={height}
      style={{ width, height, imageRendering: "pixelated", display: "block" }}
    />
  );
}

export default function ArtPage() {
  return (
    <main className="art-page">
      <p className="kicker">Bloodline</p>
      <h1>Art gallery</h1>
      <p className="art-lead">
        Handheld pixel cast, night shore, and the castle route. Every frame is drawn in code at native size.
      </p>

      <section className="art-section">
        <h2>Shore seam</h2>
        <MapCanvas rows={SHORE} scale={4} label="Small island checking grass, sand banks, and water seams" />
      </section>

      <section className="art-section">
        <h2>Sample route</h2>
        <MapCanvas rows={ROUTE} props={PROPS} scale={3} label="Fourteen by nine castle route of tiles and objects" />
      </section>

      <section className="art-section" id="portraits">
        <h2>Guardians</h2>
        {ENEMY_IDS.map((id) => (
          <div key={id} className="art-enemy">
            <h3>{NAMES[id]}</h3>
            <div className="art-row">
              {ART.enemyPortrait(id, 1).frames.map((frame) => (
                <Cell
                  key={frame}
                  sprite={ART.enemyPortrait(id, 1)}
                  frame={frame}
                  scale={3}
                  label={`${NAMES[id]}, ${frame}`}
                />
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className="art-section">
        <h2>Bloodline variants</h2>
        <p className="art-lead">Ages I, IV, VII, and X. Later trios cycle the same four palettes.</p>
        {ENEMY_IDS.map((id) => (
          <div key={id} className="art-enemy">
            <h3>{NAMES[id]}</h3>
            <div className="art-row">
              {[1, 4, 7, 10].map((bloodline) => (
                <Cell
                  key={bloodline}
                  sprite={ART.enemyPortrait(id, bloodline)}
                  frame="idle"
                  scale={3}
                  label={`${NAMES[id]}, Bloodline ${bloodline}`}
                />
              ))}
              {[1, 4, 7, 10].map((bloodline) => (
                <Cell
                  key={`ow-${bloodline}`}
                  sprite={ART.enemyOverworld(id, bloodline)}
                  frame="down0"
                  scale={4}
                  label={`${NAMES[id]} overworld, Bloodline ${bloodline}`}
                />
              ))}
            </div>
          </div>
        ))}
      </section>

      <Row title="Overworld guardians">
        {ENEMY_IDS.flatMap((id) =>
          ART.enemyOverworld(id, 1).frames.map((frame) => (
            <Cell
              key={`${id}-${frame}`}
              sprite={ART.enemyOverworld(id, 1)}
              frame={frame}
              scale={4}
              label={`${NAMES[id]} ${frame}`}
            />
          )),
        )}
      </Row>

      <Row title="Climber, overworld">
        {ART.playerOverworld.frames.map((frame) => (
          <Cell key={frame} sprite={ART.playerOverworld} frame={frame} scale={4} label={`Climber ${frame}`} />
        ))}
      </Row>

      <Row title="Climber, battle">
        {ART.playerBattle.frames.map((frame) => (
          <Cell key={frame} sprite={ART.playerBattle} frame={frame} scale={3} label={`Climber battle ${frame}`} />
        ))}
      </Row>

      <Row title="NPC overworld">
        {NPC_IDS.flatMap((id) =>
          ART.npcOverworld[id].frames.map((frame) => (
            <Cell
              key={`${id}-${frame}`}
              sprite={ART.npcOverworld[id]}
              frame={frame}
              scale={4}
              label={`${NPC_NAMES[id]} ${frame}`}
            />
          )),
        )}
      </Row>

      <Row title="NPC portraits">
        {NPC_IDS.flatMap((id) =>
          ART.npcPortrait[id].frames.map((frame) => (
            <Cell
              key={`${id}-${frame}`}
              sprite={ART.npcPortrait[id]}
              frame={frame}
              scale={3}
              label={`${NPC_NAMES[id]} ${frame}`}
            />
          )),
        )}
      </Row>

      <section className="art-section">
        <h2>Tiles, two by two</h2>
        <div className="art-row">
          {TILE_IDS.map((id) => (
            <TilePair key={id} id={id} />
          ))}
        </div>
      </section>

      <Row title="Objects">
        {(Object.keys(OBJECT_SPECS) as ObjectId[]).flatMap((id) =>
          ART.objects[id].frames.map((frame) => (
            <Cell key={`${id}-${frame}`} sprite={ART.objects[id]} frame={frame} scale={3} label={`${id} ${frame}`} />
          )),
        )}
      </Row>

      <Row title="Icons">
        {ICON_IDS.map((id: IconId) => (
          <Cell key={id} sprite={ART.icons[id]} scale={4} label={id} />
        ))}
      </Row>

      <section className="art-section">
        <h2>Battle backdrops</h2>
        <div className="art-backdrops">
          {BACKDROP_IDS.map((id: BackdropId) => (
            <Cell key={id} sprite={ART.backdrops[id]} scale={2} label={`${id} backdrop`} />
          ))}
        </div>
      </section>

      <style>{`
        .art-page {
          width: min(1280px, calc(100% - 2rem));
          margin: 0 auto;
          padding: 1.5rem 0 4rem;
        }
        .art-lead { max-width: 40rem; color: #e7d3ae; }
        .art-section { margin: 1.5rem 0 2rem; }
        .art-section h2, .art-enemy h3 {
          font-family: var(--font-display), Georgia, serif;
          margin: 0 0 0.6rem;
        }
        .art-enemy { margin: 0.8rem 0 1.2rem; }
        .art-row, .art-backdrops {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
          align-items: end;
        }
        .art-cell {
          margin: 0;
          background: #1a283c;
          border: 1px solid #3a4a62;
          padding: 0.4rem;
        }
        .art-cell figcaption {
          margin-top: 0.25rem;
          font-size: 0.72rem;
          letter-spacing: 0.02em;
          color: #e7d3ae;
        }
        .art-pair { background: #142033; border: 1px solid #3a4a62; padding: 0.35rem; }
        .art-pair span { display: block; color: #e7d3ae; font-size: 0.72rem; margin-bottom: 0.25rem; }
      `}</style>
    </main>
  );
}

function TilePair({ id }: { id: TileId }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const frames = ART.tiles[id].frames;
  const scale = 3;
  const width = 16 * 2 * scale * frames.length;
  const height = 16 * 2 * scale;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    frames.forEach((frame, index) => {
      const painted = renderSprite(ART.tiles[id], frame, scale);
      for (let y = 0; y < 2; y++) {
        for (let x = 0; x < 2; x++) {
          ctx.drawImage(painted, (index * 2 + x) * 16 * scale, y * 16 * scale);
        }
      }
    });
  }, [id, frames, scale]);

  return (
    <div className="art-pair">
      <span>{id}</span>
      <canvas
        ref={ref}
        role="img"
        aria-label={`${id} tiled twice`}
        width={width}
        height={height}
        style={{ width, height, imageRendering: "pixelated", display: "block" }}
      />
    </div>
  );
}
