import { describe, expect, it } from "vitest";
import { enemyHeartCount } from "../balance";
import { NODES } from "../route";
import { mulberry32 } from "../rng";
import { LEVEL_COUNT, PATH_IDS, type Challenge, type Level, type PathId } from "../types";
import { PATHS } from "./index";
import { levelOrder, nextPathChallenge, presentQuestion, seatsFor, type PathInput } from "./select";

const LEVELS = Array.from({ length: LEVEL_COUNT }, (_, index) => (index + 1) as Level);

function ask(input: Partial<PathInput> & Pick<PathInput, "path">): Challenge {
  return nextPathChallenge({ level: 1, node: "foothills", asked: 0, usedIds: [], avoid: [], salt: 7, ...input });
}

/** Plays a whole climb's worth of questions: every guardian's hearts, plus a miss each. */
function climb(path: PathId, level: number, seed: number, avoid: string[] = []): Challenge[] {
  const rng = mulberry32(seed);
  const used: string[] = [];
  const asked: Challenge[] = [];
  for (const node of NODES) {
    const count = enemyHeartCount(level, node.role, true) + 1;
    for (let index = 0; index < count; index++) {
      const salt = Math.floor(rng() * 2147483646) + 1;
      const next = nextPathChallenge({ path, level, node: node.id, asked: index, usedIds: used, avoid, salt });
      used.push(next.id);
      asked.push(next);
    }
  }
  return asked;
}

function authoredIds(path: PathId): Map<string, number> {
  const def = PATHS[path];
  return new Map([...def.questions, ...def.puzzles].map((item) => [item.id, item.level]));
}

describe("level fallback order", () => {
  it("tries the level, then the one below, then above, then outward", () => {
    expect(levelOrder(1, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(levelOrder(3, 5)).toEqual([3, 2, 4, 1, 5]);
    expect(levelOrder(5, 5)).toEqual([5, 4, 3, 2, 1]);
  });
});

describe.each(PATH_IDS)("climbing the %s path", (path) => {
  const def = PATHS[path];
  const authored = authoredIds(path);

  it.each(LEVELS)("never repeats a question within a level %i climb", (level) => {
    for (const seed of [1, 2, 3]) {
      const ids = climb(path, level, seed)
        .map((item) => item.id)
        .filter((id) => authored.has(id));
      expect(new Set(ids).size, `seed ${seed}`).toBe(ids.length);
    }
  });

  it.each(LEVELS)("asks from its own topic, mostly at level %i", (level) => {
    const asked = climb(path, level, 11);
    const questions = asked.filter((item) => item.kind === "mcq");
    expect(questions.length).toBeGreaterThan(0);
    for (const item of questions) {
      expect(authored.has(item.id), `${item.id} belongs to ${path}`).toBe(true);
      expect(item.topic).toBe(path);
    }
    const atLevel = questions.filter((item) => authored.get(item.id) === level).length;
    expect(atLevel / questions.length).toBeGreaterThanOrEqual(0.7);
    for (const item of asked) {
      if (item.kind === "mcq" || authored.has(item.id)) continue;
      const kinds = NODES.flatMap((node) => def.rooms[node.id].puzzles);
      expect(kinds, `${item.kind} is a generated puzzle this path allows`).toContain(item.kind);
    }
  });

  it("mixes puzzles in with questions", () => {
    const asked = LEVELS.flatMap((level) => climb(path, level, 5));
    expect(asked.some((item) => item.kind !== "mcq")).toBe(true);
  });

  it("avoids last climb's questions while fresh ones remain", () => {
    const first = climb(path, 2, 21).map((item) => item.id);
    const second = climb(path, 2, 22, first).map((item) => item.id);
    const repeats = second.filter((id) => authored.has(id) && first.includes(id));
    const authoredSecond = second.filter((id) => authored.has(id));
    expect(repeats.length / authoredSecond.length).toBeLessThanOrEqual(0.25);
  });

  it("opens level 1 with a question, from the first room's seat", () => {
    for (const salt of [1, 2, 3, 4, 5]) {
      const first = ask({ path, salt });
      expect(first.kind).toBe("mcq");
      const seat = def.questions.find((item) => item.id === first.id)?.seat;
      expect(def.rooms.foothills.seats).toContain(seat);
    }
  });

  it("walks the throne through every seat in turn", () => {
    const seats = Object.keys(def.seats);
    const walked = seats.map((_, asked) => seatsFor(def, "throne", asked)[0]);
    expect(walked).toEqual(def.rooms.throne.seats);
    expect([...walked].sort()).toEqual([...seats].sort());
  });

  if (def.pickTracks) {
    const firstSeat = Object.keys(def.seats)[0];

    it(`stays on a chosen subtopic (${firstSeat}) when one is picked`, () => {
      const used: string[] = [];
      const focused = Array.from({ length: 3 }, (_, askedAt) => {
        const next = nextPathChallenge({
          path,
          level: 1,
          node: "foothills",
          track: firstSeat,
          asked: askedAt,
          usedIds: used,
          avoid: [],
          salt: askedAt + 3,
        });
        used.push(next.id);
        return next;
      });
      const authored = focused.filter((item) => def.questions.some((q) => q.id === item.id));
      expect(authored.length).toBeGreaterThan(0);
      for (const item of authored) {
        expect(def.questions.find((q) => q.id === item.id)?.seat, item.id).toBe(firstSeat);
      }
    });
  }
});

describe("puzzle rooms", () => {
  it("only sets puzzles in a puzzle-only room", () => {
    for (const path of PATH_IDS) {
      for (const node of NODES) {
        const room = PATHS[path].rooms[node.id];
        if (!room.puzzleOnly) continue;
        for (let asked = 0; asked < 8; asked++) {
          const item = ask({ path, node: node.id, asked, level: 3, salt: asked + 1 });
          expect(item.kind, `${path} ${node.id}`).not.toBe("mcq");
        }
      }
    }
  });
});

describe("presenting a question", () => {
  it("shuffles the options and keeps the right answer pointed at the first authored option", () => {
    const question = PATHS.sql.questions[0];
    const orders = new Set<string>();
    for (let seed = 1; seed <= 40; seed++) {
      const mcq = presentQuestion(question, "sql", question.level, mulberry32(seed));
      expect(mcq.options[mcq.answer]).toBe(question.options[0]);
      expect([...mcq.options].sort()).toEqual([...question.options].sort());
      orders.add(mcq.options.join("|"));
    }
    expect(orders.size).toBeGreaterThan(1);
  });
});
