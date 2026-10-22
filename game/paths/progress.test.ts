import { describe, expect, it } from "vitest";
import { enemyHeartCount } from "../balance";
import { answer, beginDuel, clearStage, fallClimb, newRun } from "../engine";
import { NODES, ROUTE_LENGTH } from "../route";
import { emptySave, normalize } from "../save";
import type { Challenge, PathId, Save } from "../types";
import { levelState, openLevel, pathMastered, progressMark } from "./progress";

const PROBE: Challenge = {
  kind: "mcq",
  id: "probe",
  topic: "sql",
  bloodline: 1,
  prompt: "Probe",
  options: ["right", "wrong"],
  answer: 0,
  hint: "",
  senior: "",
  principle: "Probe",
  why: "",
  reveal: "right",
};

function withCleared(save: Save, path: PathId, cleared: number, track?: string): Save {
  const progress = save.paths[path];
  if (track) {
    const bucket = progress.tracks[track] ?? { cleared: 0, last: 1, climbs: 0 };
    return {
      ...save,
      paths: {
        ...save.paths,
        [path]: { ...progress, tracks: { ...progress.tracks, [track]: { ...bucket, cleared } } },
      },
    };
  }
  return { ...save, paths: { ...save.paths, [path]: { ...progress, cleared } } };
}

/** Begins the next duel and answers right until its guardian falls. */
function slay(save: Save): Save {
  let current = beginDuel(save);
  let slain = false;
  while (!slain) {
    const result = answer(current, PROBE, true, 0);
    current = result.save;
    slain = result.outcome.slain;
  }
  return current;
}

/** Plays every duel on the route, answering right, until the throne falls. */
function winClimb(save: Save): Save {
  let current = save;
  for (let node = 0; node < ROUTE_LENGTH; node++) current = clearStage(slay(current)).save;
  return current;
}

/** Misses in the first duel until the climber falls, then ends the climb. */
function loseClimb(save: Save): Save {
  let current = beginDuel(save);
  let fallen = false;
  while (!fallen) {
    const result = answer(current, PROBE, false, 0);
    current = result.save;
    fallen = result.outcome.fallen;
  }
  return fallClimb(current).save;
}

describe("level selection", () => {
  it("opens only level 1 of every path on a fresh save", () => {
    const save = emptySave();
    for (const path of ["algorithms", "system-design", "sql", "practices"] as const) {
      expect(openLevel(save, path)).toBe(1);
      expect(levelState(save, path, 1)).toBe("open");
      expect(levelState(save, path, 2)).toBe("locked");
    }
  });

  it("starts a path climb at the chosen level, capped at the highest open level", () => {
    const capped = newRun(emptySave(), 4, "climb", "sql");
    expect(capped.run?.path).toBe("sql");
    expect(capped.run?.bloodline).toBe(1);

    const opened = newRun(withCleared(emptySave(), "sql", 2), 3, "climb", "sql");
    expect(opened.run?.bloodline).toBe(3);
    expect(opened.lastPath).toBe("sql");
    expect(opened.paths.sql).toMatchObject({ last: 3, climbs: 1 });
  });

  it("never goes past the last level", () => {
    const save = withCleared(emptySave(), "algorithms", 5);
    expect(openLevel(save, "algorithms")).toBe(5);
    expect(pathMastered(save, "algorithms")).toBe(true);
    expect(newRun(save, 9, "climb", "algorithms").run?.bloodline).toBe(5);
  });

  it("leaves the classic Bloodline selector alone when a path climb starts", () => {
    const save = { ...emptySave(), unlocked: 4, lastBloodline: 3 };
    const started = newRun(save, 1, "climb", "practices");
    expect(started.lastBloodline).toBe(3);
    expect(started.unlocked).toBe(4);
  });

  it("starts a classic climb with no path", () => {
    const started = newRun({ ...emptySave(), unlocked: 2 }, 2, "climb");
    expect(started.run?.path).toBeNull();
    expect(started.run?.bloodline).toBe(2);
    expect(started.lastPath).toBeNull();
  });
});

describe("level progression", () => {
  it("unlocks the next level when the throne of the current one falls", () => {
    const after = winClimb(newRun(emptySave(), 1, "climb", "sql"));
    expect(after.run).toBeNull();
    expect(after.paths.sql.cleared).toBe(1);
    expect(openLevel(after, "sql")).toBe(2);
    expect(levelState(after, "sql", 1)).toBe("cleared");
    expect(levelState(after, "sql", 2)).toBe("open");
    expect(levelState(after, "sql", 3)).toBe("locked");
    expect(after.stats.thrones).toBe(1);
  });

  it("reports the newly opened level in the throne's reward", () => {
    let save = newRun(emptySave(), 1, "climb", "algorithms");
    for (let node = 0; node < ROUTE_LENGTH - 1; node++) {
      const { save: next, reward } = clearStage(slay(save));
      expect(reward.victory).toBe(false);
      expect(reward.unlocked).toBe(1);
      save = next;
    }
    const { reward, finished } = clearStage(slay(save));
    expect(reward.victory).toBe(true);
    expect(reward.unlocked).toBe(2);
    expect(finished?.path).toBe("algorithms");
  });

  it("does not unlock anything when the climber falls", () => {
    const after = loseClimb(newRun(emptySave(), 1, "climb", "system-design"));
    expect(after.run).toBeNull();
    expect(after.paths["system-design"].cleared).toBe(0);
    expect(openLevel(after, "system-design")).toBe(1);
    expect(after.unlocked).toBe(1);
    expect(after.stats.climbs).toBe(1);
  });

  it("keeps the highest cleared level when an easier level is replayed", () => {
    const after = winClimb(newRun(withCleared(emptySave(), "sql", 3), 1, "climb", "sql"));
    expect(after.paths.sql.cleared).toBe(3);
  });

  it("saves progress per topic", () => {
    const after = winClimb(newRun(emptySave(), 1, "climb", "practices"));
    expect(openLevel(after, "practices")).toBe(2);
    expect(openLevel(after, "algorithms")).toBe(1);
    expect(openLevel(after, "sql")).toBe(1);
    expect(after.unlocked).toBe(1);
    expect(after.stats.best).toBe(0);
  });

  it("still opens the next Bloodline on any finished classic climb", () => {
    const after = loseClimb(newRun(emptySave(), 1, "climb"));
    expect(after.unlocked).toBe(2);
    expect(after.paths.sql.cleared).toBe(0);
    expect(progressMark(after, null)).toBe(2);
  });

  it("gives guardians more hearts as levels rise, and the throne one more", () => {
    const hearts = [1, 2, 3, 4, 5].map((level) => enemyHeartCount(level, "algo", true));
    expect(hearts).toEqual([2, 2, 3, 3, 4]);
    for (let level = 1; level <= 5; level++) {
      expect(enemyHeartCount(level, "boss", true)).toBe(enemyHeartCount(level, "algo", true) + 1);
    }
    const duel = beginDuel(newRun(emptySave(), 1, "climb", "sql")).run?.duel;
    expect(duel?.enemyMax).toBe(2);
    expect(NODES.at(-1)?.role).toBe("boss");
  });
});

describe("saved progress", () => {
  it("fills in path progress for a save written before topic paths existed", () => {
    const legacy = { ...emptySave(), unlocked: 3 } as Partial<Save>;
    delete legacy.paths;
    delete legacy.lastPath;
    const run = newRun(emptySave(), 1, "old").run as Partial<NonNullable<Save["run"]>>;
    delete run.path;
    const loaded = normalize({ ...legacy, run });
    expect(loaded.unlocked).toBe(3);
    expect(loaded.paths.sql).toMatchObject({ cleared: 0, last: 1, climbs: 0, lastTrack: null, tracks: {} });
    expect(loaded.lastPath).toBeNull();
    expect(loaded.run?.path).toBeNull();
  });

  it("round-trips progress and repairs values out of range", () => {
    const save = withCleared(emptySave(), "sql", 2);
    expect(normalize(JSON.parse(JSON.stringify(save))).paths.sql.cleared).toBe(2);

    const broken = normalize({
      ...emptySave(),
      lastPath: "cooking",
      paths: { sql: { cleared: 99, last: 7, climbs: -3 }, algorithms: { cleared: 1, last: 4 } },
    });
    expect(broken.lastPath).toBeNull();
    expect(broken.paths.sql).toMatchObject({ cleared: 5, last: 5, climbs: 0 });
    expect(broken.paths.algorithms.last).toBe(2);
    expect(broken.paths.practices.cleared).toBe(0);
  });

  it("keeps a path climb in progress, with its level capped", () => {
    const started = newRun(withCleared(emptySave(), "sql", 4), 5, "mid", "sql");
    const raw = JSON.parse(JSON.stringify(started));
    raw.run.bloodline = 12;
    const loaded = normalize(raw);
    expect(loaded.run?.path).toBe("sql");
    expect(loaded.run?.track).toBeNull();
    expect(loaded.run?.bloodline).toBe(5);
  });

  it("unlocks a DSA subtopic without opening the mix or a sibling topic", () => {
    const started = newRun(emptySave(), 1, "hash", "algorithms", "hashing");
    expect(started.run?.track).toBe("hashing");
    expect(started.paths.algorithms.lastTrack).toBe("hashing");
    const after = winClimb(started);
    expect(openLevel(after, "algorithms", "hashing")).toBe(2);
    expect(openLevel(after, "algorithms")).toBe(1);
    expect(openLevel(after, "algorithms", "graphs")).toBe(1);
    expect(levelState(after, "algorithms", 2, "hashing")).toBe("open");
    expect(levelState(after, "algorithms", 2)).toBe("locked");
  });

  it("caps a focused DSA climb at that subtopic's open level", () => {
    const save = withCleared(emptySave(), "algorithms", 3, "arrays");
    expect(newRun(save, 5, "arr", "algorithms", "arrays").run?.bloodline).toBe(4);
    expect(newRun(save, 2, "mix", "algorithms").run?.bloodline).toBe(1);
  });
});
