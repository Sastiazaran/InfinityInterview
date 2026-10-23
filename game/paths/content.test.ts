import { describe, expect, it } from "vitest";
import { ENEMY_IDS, NODE_IDS } from "../contracts";
import { MCQS } from "../content/mcq";
import { splitPrompt } from "../prompt";
import { LEVEL_COUNT, PATH_IDS, type Level } from "../types";
import { PATHS, PATH_LIST } from "./index";
import type { PathDef, PathPuzzle } from "./types";

const LEVELS = Array.from({ length: LEVEL_COUNT }, (_, index) => (index + 1) as Level);
/** A dialog box holds two lines. */
const LINE_MAX = 110;
const QUESTIONS_PER_LEVEL = 20;
const PER_SEAT_PER_LEVEL = 2;
const PUZZLES_PER_LEVEL = 2;

function dialogLines(path: PathDef): string[] {
  const lines = [...path.prologue, ...path.mentor];
  for (const node of NODE_IDS) {
    const room = path.rooms[node];
    const g = room.guardian;
    lines.push(...room.sign, room.clear, ...g.intro, ...g.struck, ...g.taunt, ...g.defeat, ...g.triumph);
  }
  return lines;
}

function puzzleProblems(puzzle: PathPuzzle): string[] {
  const problems: string[] = [];
  const unique = (ids: string[]) => new Set(ids).size === ids.length;
  switch (puzzle.kind) {
    case "pipeline":
      if (puzzle.stages.length < 3 || puzzle.stages.length > 6) problems.push("needs 3 to 6 stages");
      if (!unique(puzzle.stages)) problems.push("stages repeat");
      break;
    case "context":
      if (puzzle.groups.length !== 2) problems.push("needs exactly two groups");
      if (puzzle.items.length < 4 || puzzle.items.length > 8) problems.push("needs 4 to 8 items");
      if (!unique(puzzle.items.map((item) => item.id))) problems.push("item ids repeat");
      for (const group of puzzle.groups) {
        if (!puzzle.items.some((item) => item.group === group)) problems.push(`group ${group} is empty`);
      }
      if (puzzle.items.some((item) => !puzzle.groups.includes(item.group))) problems.push("item in unknown group");
      break;
    case "latency":
      if (puzzle.items.length < 4 || puzzle.items.length > 8) problems.push("needs 4 to 8 items");
      if (!unique(puzzle.items.map((item) => item.id))) problems.push("item ids repeat");
      if (!puzzle.items.some((item) => item.onPath)) problems.push("nothing to mark");
      if (!puzzle.items.some((item) => !item.onPath)) problems.push("everything is marked");
      if (!puzzle.marks || puzzle.marks.length !== 2) problems.push("needs marks for on and off");
      break;
    case "box":
      if (puzzle.cards.length < 3 || puzzle.cards.length > 4) problems.push("needs 3 or 4 cards");
      if (!unique(puzzle.cards.map((card) => card.id))) problems.push("card ids repeat");
      if (!puzzle.cards.some((card) => card.id === puzzle.answer)) problems.push("answer is not a card");
      break;
  }
  return problems;
}

describe("topic path registry", () => {
  it("defines every path id once, under its own key", () => {
    expect(Object.keys(PATHS).sort()).toEqual([...PATH_IDS].sort());
    for (const id of PATH_IDS) expect(PATHS[id].id).toBe(id);
  });

  it("keeps question and puzzle ids unique across every path", () => {
    const owner = new Map<string, string>();
    for (const path of PATH_LIST) {
      for (const item of [...path.questions, ...path.puzzles]) {
        const seen = owner.get(item.id);
        expect(seen, `${item.id} appears in ${seen} and ${path.id}`).toBeUndefined();
        owner.set(item.id, path.id);
      }
    }
  });
});

describe.each(PATH_LIST.map((path) => [path.id, path] as const))("path %s", (_, path) => {
  const seats = Object.keys(path.seats);

  it("has a name, a castle, a blurb, and a prologue", () => {
    expect(path.name.trim()).not.toBe("");
    expect(path.castle.trim()).not.toBe("");
    expect(path.blurb.trim()).not.toBe("");
    expect(path.prologue.length).toBeGreaterThanOrEqual(2);
    expect(path.mentor.length).toBeGreaterThanOrEqual(3);
    expect(seats.length).toBeGreaterThanOrEqual(4);
  });

  it("describes every level", () => {
    for (const level of LEVELS) {
      const info = path.levels[level];
      expect(info.title.trim(), `level ${level}`).not.toBe("");
      expect(info.focus.trim(), `level ${level}`).not.toBe("");
      expect(info.epigraph.trim(), `level ${level}`).not.toBe("");
    }
  });

  it("themes every room on the route with a guardian of its own", () => {
    const looks = new Set<string>();
    const names = new Set<string>();
    for (const node of NODE_IDS) {
      const room = path.rooms[node];
      const g = room.guardian;
      expect(room.place.trim(), node).not.toBe("");
      expect(room.sign.length, node).toBeGreaterThanOrEqual(2);
      expect(ENEMY_IDS).toContain(g.look);
      expect(g.intro.length, node).toBeGreaterThanOrEqual(3);
      expect(g.struck.length, node).toBeGreaterThanOrEqual(3);
      expect(g.taunt.length, node).toBeGreaterThanOrEqual(3);
      expect(g.defeat.length, node).toBeGreaterThanOrEqual(2);
      expect(g.triumph.length, node).toBeGreaterThanOrEqual(2);
      for (const seat of room.seats) expect(seats, `${node} seat ${seat}`).toContain(seat);
      looks.add(g.look);
      names.add(g.name);
    }
    expect(looks.size).toBe(NODE_IDS.length);
    expect(names.size).toBe(NODE_IDS.length);
    expect([...path.rooms.throne.seats].sort()).toEqual([...seats].sort());
    for (const seat of seats) {
      const home = NODE_IDS.filter((node) => node !== "throne" && path.rooms[node].seats.includes(seat));
      expect(home.length, `seat ${seat} needs a room`).toBeGreaterThan(0);
    }
  });

  it("writes dialog that fits a dialog box and needs no Bloodline numeral", () => {
    for (const line of dialogLines(path)) {
      expect(line.trim(), "empty line").not.toBe("");
      expect(line.length, line).toBeLessThanOrEqual(LINE_MAX);
      expect(line, "path dialog has no placeholders").not.toMatch(/[{}]/);
    }
  });

  it("asks well-formed questions", () => {
    for (const q of path.questions) {
      expect(seats, `${q.id} seat`).toContain(q.seat);
      expect(LEVELS, `${q.id} level`).toContain(q.level);
      expect(q.options.length, q.id).toBeGreaterThanOrEqual(3);
      expect(q.options.length, q.id).toBeLessThanOrEqual(4);
      expect(new Set(q.options.map((o) => o.trim().toLowerCase())).size, `${q.id} options repeat`).toBe(
        q.options.length,
      );
      for (const text of [q.prompt, q.hint, q.senior, q.principle, q.why, ...q.options]) {
        expect(text.trim(), q.id).not.toBe("");
      }
      expect(q.prompt.length, `${q.id} prompt`).toBeLessThanOrEqual(420);
      const parts = splitPrompt(q.prompt);
      if (parts.code) {
        expect(parts.ask, `${q.id} ends with the question, not code`).toMatch(/^\S.*[?:.]$/);
        expect(parts.code.split("\n")[0], `${q.id} code starts unindented`).toMatch(/^\S/);
      }
      for (const option of q.options) expect(option.length, `${q.id} option`).toBeLessThanOrEqual(110);
      const classic = MCQS.find((item) => item.id === q.id);
      if (!classic) expect(q.id.startsWith(`${shortCode(path)}-`), `${q.id} prefix`).toBe(true);
    }
  });

  it("does not give the answer away by always being the longest option", () => {
    const longest = path.questions.filter((q) => {
      const right = q.options[0].length;
      return q.options.slice(1).every((option) => option.length < right);
    });
    expect(longest.length / path.questions.length).toBeLessThanOrEqual(0.45);
  });

  it("builds well-formed puzzles", () => {
    for (const puzzle of path.puzzles) {
      expect(seats, `${puzzle.id} seat`).toContain(puzzle.seat);
      expect(LEVELS, `${puzzle.id} level`).toContain(puzzle.level);
      expect(puzzle.id.startsWith(`${shortCode(path)}-`), `${puzzle.id} prefix`).toBe(true);
      expect(puzzleProblems(puzzle), puzzle.id).toEqual([]);
      for (const text of [puzzle.prompt, puzzle.hint, puzzle.senior, puzzle.principle, puzzle.why, puzzle.reveal]) {
        expect(text.trim(), puzzle.id).not.toBe("");
      }
    }
  });

  it.each(LEVELS)("has enough content at level %i that a climb rarely repeats", (level) => {
    const questions = path.questions.filter((q) => q.level === level);
    expect(questions.length).toBeGreaterThanOrEqual(QUESTIONS_PER_LEVEL);
    for (const seat of seats) {
      const count = questions.filter((q) => q.seat === seat).length;
      expect(count, `seat ${seat}`).toBeGreaterThanOrEqual(PER_SEAT_PER_LEVEL);
    }
    const puzzles = path.puzzles.filter((p) => p.level === level).length;
    expect(puzzles).toBeGreaterThanOrEqual(PUZZLES_PER_LEVEL);
  });
});

function shortCode(path: PathDef): string {
  return SHORT[path.id];
}

const SHORT: Record<PathDef["id"], string> = {
  algorithms: "alg",
  "system-design": "sd",
  sql: "sql",
  practices: "gp",
};
