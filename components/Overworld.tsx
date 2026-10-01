"use client";

import { useEffect, useRef } from "react";
import type { WorldBridge } from "@/game/world/bridge";

type GameHandle = {
  isBooted: boolean;
  loop: { running: boolean; wake: () => void };
  destroy: (removeCanvas: boolean) => void;
};

/** Hosts the one Phaser game. It stays mounted for the whole session and sleeps while hidden. */
export function Overworld({ bridge, hidden }: { bridge: WorldBridge; hidden: boolean }) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = host.current;
    if (!element) return;
    let cancelled = false;
    let game: GameHandle | null = null;
    import("./overworld/scene").then(({ createWorld }) => {
      if (cancelled) return;
      game = createWorld(element, bridge) as unknown as GameHandle;
    });
    return () => {
      cancelled = true;
      if (!game) return;
      // A sleeping loop never reaches the frame where Phaser finishes destroying itself.
      if (game.isBooted && !game.loop.running) game.loop.wake();
      game.destroy(true);
      game = null;
    };
  }, [bridge]);

  return <div ref={host} className={`world ${hidden ? "is-hidden" : ""}`} aria-hidden={hidden} />;
}
