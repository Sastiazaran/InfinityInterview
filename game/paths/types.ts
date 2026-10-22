import type { EnemyId, EnemyStory, Line, NodeId } from "../contracts";
import type {
  BoxChallenge,
  ChallengeKind,
  ContextChallenge,
  LatencyChallenge,
  Level,
  PathId,
  PipelineChallenge,
} from "../types";

/** What every question and puzzle on a path teaches. Shown in hints and the Codex. */
type Teaching = {
  /** Unique across every path and the classic bank. Prefix it with the path's short code. */
  id: string;
  level: Level;
  /** One of the path's seat ids: the sub-topic a guardian asks about. */
  seat: string;
  prompt: string;
  hint: string;
  senior: string;
  principle: string;
  why: string;
};

/** A multiple-choice question. The first option is the right one; options are shuffled when asked. */
export type PathQuestion = Teaching & {
  options: string[];
  /** Shown after the answer. Defaults to the right option. */
  reveal?: string;
};

type Authored<T> = Omit<T, "id" | "bloodline" | "topic" | "par" | keyof Teaching> &
  Teaching & { reveal: string; par?: number };

/** Hands-on boards that reuse the classic puzzle views with authored content. */
export type PathPuzzle =
  | Authored<PipelineChallenge>
  | Authored<ContextChallenge>
  | Authored<LatencyChallenge>
  | Authored<BoxChallenge>;

export type Guardian = EnemyStory & {
  /** Which painted guardian stands in for this one. */
  look: EnemyId;
};

export type Room = {
  /** The room's name on this path, shown on the HUD and in the duel. */
  place: string;
  /** The room's sign: a heading, then one or two lines. */
  sign: Line[];
  /** Spoken when the room's guardian falls. */
  clear: Line;
  guardian: Guardian;
  /** Seats this guardian asks from first. The throne lists every seat and rotates through them. */
  seats: string[];
  /** Generated puzzles this room may mix in. */
  puzzles: ChallengeKind[];
  /** Every challenge in this room is a puzzle, like the classic West Tower. */
  puzzleOnly?: boolean;
};

export type LevelInfo = {
  title: string;
  /** One line on what this level asks of the climber. */
  focus: Line;
  epigraph: Line;
};

export type PathDef = {
  id: PathId;
  /** Short name on the selector, such as "SQL". */
  name: string;
  /** The castle's name on this path. */
  castle: string;
  /** One line on what the path covers. */
  blurb: Line;
  /** Seat id to its label, in route order. */
  seats: Record<string, string>;
  /** Palette age the guardians wear, so each path's castle looks its own. 0 is the classic look. */
  palette: number;
  /** Shown the first time a climb starts on this path. */
  prologue: Line[];
  /** What the Senior says on this path, one line per visit. */
  mentor: Line[];
  levels: Record<Level, LevelInfo>;
  rooms: Record<NodeId, Room>;
  questions: PathQuestion[];
  puzzles: PathPuzzle[];
  /** Chance that a question slot becomes a puzzle, when the room has one to give. */
  mix: number;
  /**
   * When true, the title lets the climber pick one seat or a mix of every seat.
   * Progress is saved per seat as well as for the mix.
   */
  pickTracks?: boolean;
};
