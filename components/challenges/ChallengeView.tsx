"use client";

import type { Challenge, ChallengeKind } from "@/game/types";
import { BinaryHunt } from "./BinaryHunt";
import { BracketForge } from "./BracketForge";
import { BoxView, ChoiceView } from "./Choice";
import { ComplexityView, ContextView, FloodView, LatencyView, PipelineView, StackView } from "./Classic";
import { LruGate } from "./LruGate";
import { MazeRun } from "./MazeRun";
import { PointerDash } from "./PointerDash";
import { SwapSort } from "./SwapSort";
import type { ChallengeProps } from "./shared";

export const KIND_LABEL: Record<ChallengeKind, string> = {
  mcq: "Question",
  model: "Question",
  box: "System box",
  stack: "Trace",
  flood: "Breadth-first flood",
  complexity: "Big-O buckets",
  latency: "Critical path",
  pipeline: "Pipeline",
  context: "Contexts",
  pointers: "Pointer Dash",
  bsearch: "Binary Search Hunt",
  brackets: "Bracket Forge",
  maze: "Maze Run",
  swaps: "Swap Sort",
  lru: "LRU Gatekeeper",
};

/** Kinds that are played rather than picked. They take more room on screen. */
export const PUZZLE_KINDS = new Set<ChallengeKind>([
  "stack",
  "flood",
  "complexity",
  "latency",
  "pipeline",
  "context",
  "pointers",
  "bsearch",
  "brackets",
  "maze",
  "swaps",
  "lru",
]);

export function ChallengeView(props: ChallengeProps) {
  const { challenge } = props;
  switch (challenge.kind) {
    case "mcq":
    case "model":
      return <ChoiceView {...props} challenge={challenge} />;
    case "box":
      return <BoxView {...props} challenge={challenge} />;
    case "stack":
      return <StackView {...props} challenge={challenge} />;
    case "flood":
      return <FloodView {...props} challenge={challenge} />;
    case "complexity":
      return <ComplexityView {...props} challenge={challenge} />;
    case "latency":
      return <LatencyView {...props} challenge={challenge} />;
    case "pipeline":
      return <PipelineView {...props} challenge={challenge} />;
    case "context":
      return <ContextView {...props} challenge={challenge} />;
    case "pointers":
      return <PointerDash {...props} challenge={challenge} />;
    case "bsearch":
      return <BinaryHunt {...props} challenge={challenge} />;
    case "brackets":
      return <BracketForge {...props} challenge={challenge} />;
    case "maze":
      return <MazeRun {...props} challenge={challenge} />;
    case "swaps":
      return <SwapSort {...props} challenge={challenge} />;
    case "lru":
      return <LruGate {...props} challenge={challenge} />;
  }
}

export function isChoice(challenge: Challenge): boolean {
  return challenge.kind === "mcq" || challenge.kind === "model" || challenge.kind === "box";
}
