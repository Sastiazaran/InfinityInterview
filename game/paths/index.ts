import { PATH_IDS, type PathId } from "../types";
import { ALGORITHMS } from "./algorithms";
import { PRACTICES } from "./practices";
import { SQL } from "./sql";
import { SYSTEM_DESIGN } from "./system-design";
import type { PathDef } from "./types";

/**
 * Every topic path, keyed by id. To add a topic: add its id to PATH_IDS in game/types.ts,
 * write its PathDef in this folder, and register it here. The tests check the content.
 */
export const PATHS: Record<PathId, PathDef> = {
  algorithms: ALGORITHMS,
  "system-design": SYSTEM_DESIGN,
  sql: SQL,
  practices: PRACTICES,
};

export const PATH_LIST: PathDef[] = PATH_IDS.map((id) => PATHS[id]);

export function isPathId(value: unknown): value is PathId {
  return typeof value === "string" && (PATH_IDS as readonly string[]).includes(value);
}

export type { Guardian, LevelInfo, PathDef, PathPuzzle, PathQuestion, Room } from "./types";
