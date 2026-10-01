"use client";

import dynamic from "next/dynamic";

// The game reads its save from localStorage before the first paint, so it never renders on the server.
const GameApp = dynamic(() => import("./GameApp").then((mod) => mod.GameApp), {
  ssr: false,
  loading: () => (
    <main className="game boot" aria-busy="true">
      <p>Opening the castle gate…</p>
    </main>
  ),
});

export function ClientGame() {
  return <GameApp />;
}
