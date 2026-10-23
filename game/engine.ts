import { EGGS, type EggId, type ItemId, type NpcId } from "./contracts";
import {
  chestGold,
  consumablePrice,
  enemyHeartCount,
  flawlessGold,
  gearPrice,
  GEAR_MAX,
  heartGold,
  isGear,
  playerHeartMax,
  SATCHEL_MAX,
  stageGold,
  startingLifelines,
  throneGold,
  wholeBloodline,
  wholeLevel,
} from "./balance";
import { openLevel, progressMark } from "./paths/progress";
import { nodeAt, ROUTE_LENGTH } from "./route";
import { rememberMiss } from "./save";
import { MIX_TRACK, type Challenge, ConsumableId, Facing, Lifelines, PathId, Run, Save } from "./types";

export const FORTY_TWO = 42;

export function hasDuck(save: Save): boolean {
  return save.secrets.includes("rubber-duck");
}

function credit(save: Save, amount: number): Save {
  if (amount <= 0) return save;
  return {
    ...save,
    gold: save.gold + amount,
    run: save.run ? { ...save.run, gold: save.run.gold + amount } : save.run,
    stats: { ...save.stats, earned: save.stats.earned + amount },
  };
}

/** Optional rewards, such as the arrow combo after a correct answer. */
export function bonusGold(save: Save, amount: number): Save {
  return credit(save, Math.max(0, Math.floor(amount)));
}

/**
 * Starts a climb. With a path, `step` is the level on that path, capped at the highest open level;
 * without one, it is the Bloodline, capped at the highest unlocked.
 */
export function newRun(
  save: Save,
  step: number,
  id: string,
  path: PathId | null = null,
  track: string | null = null,
): Save {
  const seat = path && track && track !== MIX_TRACK ? track : null;
  const n = path
    ? Math.min(wholeLevel(step), openLevel(save, path, seat))
    : Math.min(wholeBloodline(step), save.unlocked);
  const maxHearts = playerHeartMax(save.gear);
  const previous = save.run?.usedIds ?? [];
  const run: Run = {
    id,
    path,
    track: path ? seat : null,
    bloodline: n,
    nodeIndex: 0,
    hearts: maxHearts,
    maxHearts,
    lifelines: startingLifelines(save.gear, n, hasDuck(save)),
    gold: 0,
    usedIds: [],
    chests: [],
    pos: null,
    duel: null,
    answers: 0,
    correct: 0,
  };
  const lastSeen = previous.length ? previous.slice(-120) : save.lastSeen;
  if (path) {
    const progress = save.paths[path];
    const next = seat
      ? {
          ...progress,
          lastTrack: seat,
          tracks: {
            ...progress.tracks,
            [seat]: { ...(progress.tracks[seat] ?? { cleared: 0, last: 1, climbs: 0 }), last: n, climbs: (progress.tracks[seat]?.climbs ?? 0) + 1 },
          },
        }
      : { ...progress, lastTrack: null, last: n, climbs: progress.climbs + 1 };
    return { ...save, run, lastPath: path, lastSeen, paths: { ...save.paths, [path]: next } };
  }
  return { ...save, run, lastPath: null, lastBloodline: n, lastSeen };
}

export function beginDuel(save: Save): Save {
  const run = save.run;
  if (!run || run.duel) return save;
  const enemyMax = enemyHeartCount(run.bloodline, nodeAt(run.nodeIndex).role, run.path !== null);
  return {
    ...save,
    run: {
      ...run,
      duel: {
        enemyHearts: enemyMax,
        enemyMax,
        shield: save.gear.shield > 0,
        misses: 0,
        hits: 0,
        seats: [],
      },
    },
  };
}

export function recordChallenge(save: Save, challenge: Challenge): Save {
  const run = save.run;
  if (!run) return save;
  const seat = challenge.kind === "mcq" ? challenge.seat : undefined;
  return {
    ...save,
    run: {
      ...run,
      usedIds: [...run.usedIds, challenge.id].slice(-240),
      duel:
        run.duel && seat ? { ...run.duel, seats: [...run.duel.seats, seat] } : run.duel,
    },
  };
}

export type AnswerOutcome = {
  correct: boolean;
  blocked: boolean;
  slain: boolean;
  fallen: boolean;
  gold: number;
  eggs: EggId[];
};

export function answer(save: Save, challenge: Challenge, correct: boolean, now: number): {
  save: Save;
  outcome: AnswerOutcome;
} {
  const run = save.run;
  const duel = run?.duel;
  if (!run || !duel) {
    return {
      save,
      outcome: { correct, blocked: false, slain: false, fallen: false, gold: 0, eggs: [] },
    };
  }
  let next = save;
  let hearts = run.hearts;
  let enemyHearts = duel.enemyHearts;
  let shield = duel.shield;
  let blocked = false;
  if (correct) {
    enemyHearts -= 1;
  } else if (shield) {
    shield = false;
    blocked = true;
  } else {
    hearts -= 1;
  }

  next = {
    ...next,
    answers: next.answers + 1,
    run: {
      ...run,
      hearts: Math.max(0, hearts),
      answers: run.answers + 1,
      correct: run.correct + (correct ? 1 : 0),
      duel: {
        ...duel,
        enemyHearts: Math.max(0, enemyHearts),
        shield,
        hits: duel.hits + (correct ? 1 : 0),
        misses: duel.misses + (correct ? 0 : 1),
      },
    },
  };

  if (!correct) {
    next = rememberMiss(next, {
      id: challenge.id,
      prompt: challenge.prompt,
      reveal: challenge.reveal,
      why: challenge.why,
      principle: challenge.principle,
      topic: run.path ?? challenge.topic,
      bloodline: run.bloodline,
      at: now,
    });
  }

  const gold = correct ? heartGold(run.bloodline) : 0;
  next = credit(next, gold);

  const eggs: EggId[] = [];
  if (next.answers >= FORTY_TWO && !next.secrets.includes("forty-two")) {
    const award = awardEgg(next, "forty-two");
    next = award.save;
    if (award.fresh) eggs.push("forty-two");
  }

  return {
    save: next,
    outcome: {
      correct,
      blocked,
      slain: enemyHearts <= 0,
      fallen: hearts <= 0,
      gold,
      eggs,
    },
  };
}

export type StageReward = {
  stage: number;
  flawless: number;
  throne: number;
  total: number;
  victory: boolean;
  /** The highest Bloodline, or on a path the highest open level, once this stage is paid. */
  unlocked: number;
};

/** The guardian is down: pay the stage, open the next ward, or end the climb at the throne. */
export function clearStage(save: Save): { save: Save; reward: StageReward; finished: Run | null } {
  const run = save.run;
  if (!run) {
    return {
      save,
      reward: { stage: 0, flawless: 0, throne: 0, total: 0, victory: false, unlocked: save.unlocked },
      finished: null,
    };
  }
  const n = run.bloodline;
  const victory = run.nodeIndex >= ROUTE_LENGTH - 1;
  const stage = stageGold(n, run.nodeIndex);
  const flawless = run.duel && run.duel.misses === 0 ? flawlessGold(n) : 0;
  const throne = victory ? throneGold(n) : 0;
  const total = stage + flawless + throne;
  let next = credit(save, total);
  const paid = next.run!;
  if (victory) {
    const done = finishClimb(next, true);
    return {
      save: done.save,
      reward: { stage, flawless, throne, total, victory, unlocked: progressMark(done.save, run.path, run.track) },
      finished: done.finished,
    };
  }
  next = { ...next, run: { ...paid, nodeIndex: paid.nodeIndex + 1, duel: null } };
  return {
    save: next,
        reward: { stage, flawless, throne, total, victory, unlocked: progressMark(next, run.path, run.track) },
    finished: null,
  };
}

export function fallClimb(save: Save): { save: Save; finished: Run | null } {
  return finishClimb(save, false);
}

/**
 * A classic climb opens the next Bloodline whether it is won or lost.
 * A path climb opens the next level only when its throne falls.
 */
function finishClimb(save: Save, victory: boolean): { save: Save; finished: Run | null } {
  const run = save.run;
  if (!run) return { save, finished: null };
  const finished: Run = { ...run, duel: null, nodeIndex: victory ? ROUTE_LENGTH : run.nodeIndex };
  const path = run.path;
  const progress = path ? save.paths[path] : null;
  const seat = run.track;
  let paths = save.paths;
  if (path && progress && victory) {
    if (seat) {
      const bucket = progress.tracks[seat] ?? { cleared: 0, last: 1, climbs: 0 };
      paths = {
        ...save.paths,
        [path]: {
          ...progress,
          tracks: { ...progress.tracks, [seat]: { ...bucket, cleared: Math.max(bucket.cleared, run.bloodline) } },
        },
      };
    } else {
      paths = { ...save.paths, [path]: { ...progress, cleared: Math.max(progress.cleared, run.bloodline) } };
    }
  }
  return {
    save: {
      ...save,
      run: null,
      unlocked: path ? save.unlocked : Math.max(save.unlocked, run.bloodline + 1),
      paths,
      lastSeen: run.usedIds.slice(-120),
      stats: {
        ...save.stats,
        climbs: save.stats.climbs + 1,
        thrones: save.stats.thrones + (victory ? 1 : 0),
        best: victory && !path ? Math.max(save.stats.best, run.bloodline) : save.stats.best,
      },
    },
    finished,
  };
}

export function spendLifeline(save: Save, kind: keyof Lifelines): Save | null {
  const run = save.run;
  if (!run || run.lifelines[kind] <= 0) return null;
  return {
    ...save,
    run: { ...run, lifelines: { ...run.lifelines, [kind]: run.lifelines[kind] - 1 } },
  };
}

export type BuyResult = "bought" | "broke" | "owned" | "full";

export function priceOf(save: Save, item: ItemId): number {
  if (isGear(item)) return gearPrice(item, save.gear[item]);
  return consumablePrice(item, save.run?.bloodline ?? save.lastBloodline);
}

export function canStillBuy(save: Save, item: ItemId): boolean {
  if (isGear(item)) return save.gear[item] < GEAR_MAX[item];
  return save.satchel[item] < SATCHEL_MAX;
}

export function buy(save: Save, item: ItemId): { save: Save; result: BuyResult } {
  if (isGear(item)) {
    if (save.gear[item] >= GEAR_MAX[item]) return { save, result: "owned" };
  } else if (save.satchel[item] >= SATCHEL_MAX) {
    return { save, result: "full" };
  }
  const price = priceOf(save, item);
  if (save.gold < price) return { save, result: "broke" };
  let next: Save = { ...save, gold: save.gold - price };
  if (isGear(item)) {
    next = { ...next, gear: { ...next.gear, [item]: next.gear[item] + 1 } };
    const run = next.run;
    if (run) {
      if (item === "armor") {
        next = { ...next, run: { ...run, maxHearts: run.maxHearts + 1, hearts: run.hearts + 1 } };
      } else if (item === "hourglass") {
        next = { ...next, run: { ...run, lifelines: { ...run.lifelines, time: run.lifelines.time + 1 } } };
      } else if (item === "seal") {
        next = {
          ...next,
          run: { ...run, lifelines: { ...run.lifelines, senior: run.lifelines.senior + 1 } },
        };
      } else if (item === "shield" && run.duel) {
        next = { ...next, run: { ...run, duel: { ...run.duel, shield: true } } };
      }
    }
  } else {
    next = { ...next, satchel: { ...next.satchel, [item]: next.satchel[item] + 1 } };
  }
  return { save: next, result: "bought" };
}

export type UseResult = "used" | "none" | "full-hearts" | "no-climb";

export function consumeItem(save: Save, item: ConsumableId): { save: Save; result: UseResult } {
  const run = save.run;
  if (save.satchel[item] <= 0) return { save, result: "none" };
  if (!run) return { save, result: "no-climb" };
  if (item === "potion" && run.hearts >= run.maxHearts) return { save, result: "full-hearts" };
  const lifelines = { ...run.lifelines };
  let hearts = run.hearts;
  if (item === "potion") hearts += 1;
  if (item === "scroll") lifelines.hint += 1;
  if (item === "sand") lifelines.time += 1;
  if (item === "note") lifelines.senior += 1;
  return {
    save: {
      ...save,
      satchel: { ...save.satchel, [item]: save.satchel[item] - 1 },
      run: { ...run, hearts, lifelines },
    },
    result: "used",
  };
}

export function awardEgg(save: Save, egg: EggId): { save: Save; fresh: boolean } {
  if (save.secrets.includes(egg)) return { save, fresh: false };
  let next: Save = { ...save, secrets: [...save.secrets, egg] };
  next = credit(next, EGGS[egg].gold);
  const run = next.run;
  if (run && egg === "sudo") {
    const refill = startingLifelines(next.gear, run.bloodline, hasDuck(next)).hint;
    next = {
      ...next,
      run: { ...run, lifelines: { ...run.lifelines, hint: Math.max(run.lifelines.hint, refill) } },
    };
  }
  if (run && egg === "rubber-duck") {
    next = { ...next, run: { ...run, lifelines: { ...run.lifelines, hint: run.lifelines.hint + 1 } } };
  }
  return { save: next, fresh: true };
}

export function openChest(save: Save, chestId: string, seed: number): { save: Save; gold: number } {
  const run = save.run;
  if (!run || run.chests.includes(chestId)) return { save, gold: 0 };
  const gold = chestGold(run.bloodline, seed);
  const next = { ...save, run: { ...run, chests: [...run.chests, chestId] } };
  return { save: credit(next, gold), gold };
}

/** Returns the index of the line to speak: one per visit, the last one repeats. */
export function visitNpc(save: Save, npc: NpcId, lineCount: number): { save: Save; line: number } {
  const visits = save.npcVisits[npc] ?? 0;
  return {
    save: { ...save, npcVisits: { ...save.npcVisits, [npc]: visits + 1 } },
    line: Math.max(0, Math.min(visits, lineCount - 1)),
  };
}

export function placePlayer(save: Save, pos: { x: number; y: number; facing: Facing }): Save {
  const run = save.run;
  if (!run) return save;
  const old = run.pos;
  if (old && old.x === pos.x && old.y === pos.y && old.facing === pos.facing) return save;
  return { ...save, run: { ...run, pos } };
}
