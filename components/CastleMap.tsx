"use client";

import { useEffect, useRef } from "react";
import type { Bloodline } from "@/game/types";

type Bridge = {
  nodeIndex: number;
  bloodline: Bloodline;
  onEngage: () => void;
};

const SPOTS = [
  { x: 132, y: 268 },
  { x: 268, y: 318 },
  { x: 392, y: 248 },
  { x: 520, y: 312 },
  { x: 640, y: 228 },
  { x: 748, y: 176 },
  { x: 852, y: 118 },
];

export function CastleMap({
  nodeIndex,
  bloodline,
  onEngage,
}: {
  nodeIndex: number;
  bloodline: Bloodline;
  onEngage: () => void;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const bridge = useRef<Bridge>({ nodeIndex, bloodline, onEngage });
  bridge.current.nodeIndex = nodeIndex;
  bridge.current.bloodline = bloodline;
  bridge.current.onEngage = onEngage;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let destroyed = false;
    let game: { destroy: (removeCanvas: boolean) => void } | null = null;

    (async () => {
      const Phaser = (await import("phaser")).default;
      if (destroyed || !hostRef.current) return;

      class RouteScene extends Phaser.Scene {
        tokens!: Phaser.GameObjects.Container;
        ring: Phaser.GameObjects.Arc | null = null;
        pulse = 0;
        drawn = -1;

        constructor() {
          super("route");
        }

        create() {
          this.drawWorld();
          this.tokens = this.add.container(0, 0);
          this.redraw(true);
        }

        update(_time: number, delta: number) {
          const bridgeNow = this.registry.get("bridge") as Bridge;
          if (bridgeNow.nodeIndex !== this.drawn) this.redraw(false);
          if (this.ring) {
            this.pulse += delta / 280;
            this.ring.setAlpha(0.35 + Math.sin(this.pulse) * 0.35);
          }
        }

        redraw(force: boolean) {
          const bridgeNow = this.registry.get("bridge") as Bridge;
          if (!force && bridgeNow.nodeIndex === this.drawn) return;
          this.drawn = bridgeNow.nodeIndex;
          this.tokens.removeAll(true);
          this.ring = null;

          const path = this.add.graphics();
          path.lineStyle(6, 0xc6a15a, 0.9);
          path.beginPath();
          path.moveTo(SPOTS[0].x, SPOTS[0].y);
          for (const spot of SPOTS.slice(1)) path.lineTo(spot.x, spot.y);
          path.strokePath();
          this.tokens.add(path);

          SPOTS.forEach((spot, index) => {
            const state =
              index < bridgeNow.nodeIndex
                ? "down"
                : index === bridgeNow.nodeIndex
                  ? "now"
                  : "wait";
            const fill = state === "down" ? 0x6d7c72 : state === "now" ? 0xe2c07a : 0x8a6848;
            if (state === "now") {
              this.ring = this.add.circle(spot.x, spot.y, 26, 0xe2c07a, 0.35);
              this.tokens.add(this.ring);
            }
            const disc = this.add.circle(spot.x, spot.y, 16, fill, 1);
            disc.setStrokeStyle(3, 0x2a2118, 1);
            this.tokens.add(disc);
            this.tokens.add(this.pawn(spot.x, spot.y - 22, index, state === "wait"));
            const label = this.add
              .text(spot.x, spot.y + 28, String(index + 1), {
                fontFamily: "Georgia, serif",
                fontSize: "13px",
                color: state === "now" ? "#2a2118" : "#f3e6c8",
              })
              .setOrigin(0.5);
            this.tokens.add(label);
            if (state === "now") {
              disc.setInteractive({ useHandCursor: true });
              disc.on("pointerdown", () => {
                (this.registry.get("bridge") as Bridge).onEngage();
              });
            }
          });
        }

        pawn(x: number, y: number, index: number, dim: boolean) {
          const g = this.add.graphics();
          const color = [0x8c3b3b, 0x355f8c, 0x8c6a32, 0x3f6b45, 0x6a4c93, 0x2f6f78, 0xd7c07a][
            index
          ];
          g.fillStyle(dim ? 0x4a433c : color, 1);
          g.fillRect(x - 5, y - 14, 10, 8);
          g.fillRect(x - 7, y - 6, 14, 12);
          g.fillStyle(dim ? 0x2c2824 : 0xf0d7a8, 1);
          g.fillRect(x - 2, y + 6, 4, 6);
          return g;
        }

        drawWorld() {
          const g = this.add.graphics();
          const sky = [0x172845, 0x1e3658, 0x2a4a72, 0x3d6794, 0x4e7ea8];
          sky.forEach((color, i) => {
            g.fillStyle(color, 1);
            g.fillRect(0, i * 36, 960, 36);
          });
          g.fillStyle(0xf3e6c5, 1);
          g.fillCircle(78, 48, 16);
          g.fillStyle(0x2a4a72, 1);
          g.fillCircle(86, 44, 13);

          g.fillStyle(0x163e5c, 1);
          g.fillRect(0, 200, 960, 340);
          g.fillStyle(0x1d5678, 1);
          g.fillRect(0, 236, 960, 304);
          g.fillStyle(0xd5ecf6, 0.28);
          for (let y = 250; y < 520; y += 16) {
            for (let x = y % 32; x < 960; x += 26) g.fillRect(x, y, 12, 2);
          }

          this.island(g, 48, 214, 210, 150);
          this.island(g, 230, 268, 150, 110);
          this.island(g, 360, 196, 170, 150);
          this.island(g, 520, 246, 140, 120);
          this.castleCliff(g, 690, 150);

          g.fillStyle(0x24533a, 1);
          for (const [x, y] of [
            [90, 200],
            [130, 206],
            [400, 188],
            [450, 196],
          ] as const) {
            g.fillRect(x, y, 6, 16);
            g.fillRect(x - 6, y, 18, 6);
          }
        }

        island(
          g: Phaser.GameObjects.Graphics,
          x: number,
          y: number,
          w: number,
          h: number,
        ) {
          g.fillStyle(0x7a4a32, 1);
          g.fillRect(x + 18, y + 22, w - 28, h);
          g.fillStyle(0x8b5a3c, 1);
          g.fillRect(x + 28, y + 36, w - 48, h - 20);
          g.fillStyle(0x2f6b3c, 1);
          g.fillRect(x, y, w, 26);
          g.fillStyle(0x3e8a4c, 1);
          g.fillRect(x + 10, y + 6, w - 28, 10);
        }

        castleCliff(g: Phaser.GameObjects.Graphics, x: number, y: number) {
          g.fillStyle(0x6d4632, 1);
          g.fillRect(x + 10, y + 70, 230, 210);
          g.fillStyle(0x2f6b3c, 1);
          g.fillRect(x, y + 52, 250, 24);
          g.fillStyle(0x9a968c, 1);
          g.fillRect(x + 70, y + 10, 120, 70);
          g.fillRect(x + 48, y - 8, 34, 58);
          g.fillRect(x + 176, y - 36, 42, 96);
          g.fillStyle(0x7d796f, 1);
          for (let i = 0; i < 4; i++) g.fillRect(x + 74 + i * 30, y - 2, 14, 12);
          g.fillRect(x + 180, y - 48, 14, 12);
          g.fillRect(x + 200, y - 48, 14, 12);
          g.fillStyle(0x241c16, 1);
          g.fillRect(x + 112, y + 42, 28, 38);
          g.fillStyle(0xe2c07a, 1);
          g.fillRect(x + 190, y - 16, 12, 18);
          g.fillStyle(0x6e8eab, 1);
          g.fillRect(x + 92, y + 24, 10, 14);
          g.fillRect(x + 156, y + 24, 10, 14);
        }
      }

      game = new Phaser.Game({
        type: Phaser.AUTO,
        parent: hostRef.current,
        width: 960,
        height: 540,
        backgroundColor: "#172845",
        scene: RouteScene,
        audio: { noAudio: true },
        banner: false,
        scale: {
          mode: Phaser.Scale.FIT,
          autoCenter: Phaser.Scale.CENTER_BOTH,
          width: 960,
          height: 540,
        },
        callbacks: {
          preBoot: (booting) => {
            booting.registry.set("bridge", bridge.current);
          },
        },
      });
    })().catch(() => {
      host.dataset.failed = "true";
    });

    return () => {
      destroyed = true;
      game?.destroy(true);
    };
  }, []);

  return (
    <div className="map-frame">
      <div ref={hostRef} className="map-host" />
    </div>
  );
}
