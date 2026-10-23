import { LEVEL_COUNT, MIX_TRACK, type Level, type PathId, type Save, type TrackProgress } from "../types";

export type LevelState = "cleared" | "open" | "locked";

export const LEVELS: readonly Level[] = Array.from({ length: LEVEL_COUNT }, (_, index) => (index + 1) as Level);

export { MIX_TRACK };

export function emptyTrack(): TrackProgress {
  return { cleared: 0, last: 1, climbs: 0 };
}

/** The progress bucket for a path: a subtopic seat, or the mixed climb when track is null or "mix". */
export function trackOf(save: Save, path: PathId, track?: string | null): TrackProgress {
  if (track && track !== MIX_TRACK) {
    return save.paths[path].tracks[track] ?? emptyTrack();
  }
  const progress = save.paths[path];
  return { cleared: progress.cleared, last: progress.last, climbs: progress.climbs };
}

/** The highest level that can be climbed: one past the last cleared, capped at the top. */
export function openLevel(save: Save, path: PathId, track?: string | null): Level {
  return Math.min(LEVEL_COUNT, trackOf(save, path, track).cleared + 1) as Level;
}

export function levelState(save: Save, path: PathId, level: number, track?: string | null): LevelState {
  if (level <= trackOf(save, path, track).cleared) return "cleared";
  return level <= openLevel(save, path, track) ? "open" : "locked";
}

/** Every level of the track has been cleared. */
export function pathMastered(save: Save, path: PathId, track?: string | null): boolean {
  return trackOf(save, path, track).cleared >= LEVEL_COUNT;
}

/** How far a climb's track has opened: the open level on a path, the highest Bloodline otherwise. */
export function progressMark(save: Save, path: PathId | null, track?: string | null): number {
  return path ? openLevel(save, path, track) : save.unlocked;
}
