"use client";

import type { ReactNode } from "react";
import type { Challenge } from "@/game/types";

export type ChallengeProps<C extends Challenge = Challenge> = {
  challenge: C;
  /** Keys reach the challenge only while it is active: not under a menu, not after the answer. */
  active: boolean;
  /** Ask a senior was used on this challenge. Puzzles show extra guidance. */
  senior: boolean;
  /** Options or cards a senior crossed out. */
  eliminated: number[];
  onAnswer: (correct: boolean) => void;
};

/** The keys a challenge listens to, shown under it. */
export function Legend({ keys }: { keys: [ReactNode, string][] }) {
  return (
    <p className="legend">
      {keys.map(([key, label], index) => (
        <span key={index}>
          <kbd>{key}</kbd> {label}
        </span>
      ))}
    </p>
  );
}

export function Notice({ tone, children }: { tone: "warn" | "good" | "info"; children: ReactNode }) {
  return <p className={`notice ${tone}`}>{children}</p>;
}
