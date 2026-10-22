import { paletteAge } from "./art/palette";
import { enemyAt, toRoman, type EnemyId, type EnemyStory, type Line, type NodeId, type SignId } from "./contracts";
import { PATHS } from "./paths";
import { nodeAt } from "./route";
import { STORY } from "./story";
import { LEVEL_COUNT, type Level, type PathId } from "./types";

/** What decides a climb's theme: its path, optional subtopic, and its difficulty step. */
export type ClimbRef = { path: PathId | null; bloodline: number; track?: string | null };

export type GuardianView = {
  story: EnemyStory;
  /** The painted guardian to draw. */
  look: EnemyId;
  /** Palette age to draw it in. */
  age: number;
};

export function guardianAt(climb: ClimbRef, nodeIndex: number): GuardianView {
  const node = nodeAt(nodeIndex).id;
  if (climb.path) {
    const def = PATHS[climb.path];
    const guardian = def.rooms[node].guardian;
    return { story: guardian, look: guardian.look, age: def.palette };
  }
  const id = enemyAt(node, climb.bloodline);
  return { story: STORY.enemies[id], look: id, age: paletteAge(climb.bloodline) };
}

export function placeAt(climb: ClimbRef, nodeIndex: number): string {
  const node = nodeAt(nodeIndex);
  return climb.path ? PATHS[climb.path].rooms[node.id].place : node.place;
}

export function stageClearAt(climb: ClimbRef, node: NodeId): Line {
  return climb.path ? PATHS[climb.path].rooms[node].clear : STORY.stageClear[node];
}

const SIGN_ROOM: Partial<Record<SignId, NodeId>> = {
  shore: "foothills",
  gate: "gate",
  yard: "yard",
  stair: "stair",
  west: "west",
  east: "east",
  throne: "throne",
};

/** A room's sign follows the path; the shop, pond, and hidden signs are the same in every castle. */
export function signAt(path: PathId | null, sign: SignId): Line[] {
  const room = SIGN_ROOM[sign];
  if (path && room) return PATHS[path].rooms[room].sign;
  return STORY.signs[sign] ?? [];
}

export function mentorLines(path: PathId | null): Line[] {
  return path ? PATHS[path].mentor : STORY.npcs.mentor.lines;
}

/** "Bloodline II" on a classic climb, "Level 2" on a path. */
export function stepName(path: PathId | null, step: number): string {
  return path ? `Level ${step}` : `Bloodline ${toRoman(step)}`;
}

/** Label for a focused subtopic, or "Mix" on a path that offers tracks. */
export function trackName(path: PathId | null, track?: string | null): string | null {
  if (!path) return null;
  const def = PATHS[path];
  if (!def.pickTracks) return null;
  if (track && def.seats[track]) return def.seats[track];
  return "Mix";
}

/** "Bloodline II", "SQL · Level 2", or "DSA · Hashing · Level 2". */
export function climbName(climb: ClimbRef): string {
  if (!climb.path) return stepName(null, climb.bloodline);
  const topic = trackName(climb.path, climb.track);
  const head = topic ? `${PATHS[climb.path].name} · ${topic}` : PATHS[climb.path].name;
  return `${head} · Level ${climb.bloodline}`;
}

export type ChapterView = { name: string; title: string; epigraph: Line };

export function chapterOf(climb: ClimbRef): ChapterView {
  if (climb.path) {
    const def = PATHS[climb.path];
    const info = def.levels[Math.min(LEVEL_COUNT, Math.max(1, climb.bloodline)) as Level];
    return { name: climbName(climb), title: info.title, epigraph: info.epigraph };
  }
  const chapter = STORY.chapter(climb.bloodline);
  return { name: `Bloodline ${chapter.numeral}`, title: chapter.title, epigraph: chapter.epigraph };
}
