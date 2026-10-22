import { MCQS } from "../content/mcq";
import type { Level } from "../types";
import type { PathQuestion } from "./types";

/** Files a question from the classic bank under a path's level and seat, keeping its id and text. */
export function fromClassic(id: string, level: Level, seat: string): PathQuestion {
  const mcq = MCQS.find((item) => item.id === id);
  if (!mcq) throw new Error(`No classic question has the id ${id}`);
  const right = mcq.options[mcq.answer];
  return {
    id,
    level,
    seat,
    prompt: mcq.prompt,
    options: [right, ...mcq.options.filter((_, index) => index !== mcq.answer)],
    reveal: mcq.reveal,
    hint: mcq.hint,
    senior: mcq.senior,
    principle: mcq.principle,
    why: mcq.why,
  };
}
