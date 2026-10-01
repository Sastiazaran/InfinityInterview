export const SEQUENCES = {
  konami: ["up", "up", "down", "down", "left", "right", "left", "right", "b", "a"],
  sudo: ["s", "u", "d", "o"],
  ls: ["l", "s"],
} as const;

export type SequenceId = keyof typeof SEQUENCES;

const ARROWS: Record<string, string> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
};

/** Arrow keys become directions; single printable keys become lowercase letters. */
export function sequenceToken(event: Pick<KeyboardEvent, "key" | "ctrlKey" | "metaKey" | "altKey">) {
  if (event.ctrlKey || event.metaKey || event.altKey) return null;
  if (ARROWS[event.key]) return ARROWS[event.key];
  if (event.key.length === 1) return event.key.toLowerCase();
  return null;
}

export class SequenceWatch {
  private buffer: string[] = [];

  push(token: string): SequenceId[] {
    this.buffer.push(token);
    if (this.buffer.length > 16) this.buffer.shift();
    const hits: SequenceId[] = [];
    for (const id of Object.keys(SEQUENCES) as SequenceId[]) {
      const seq = SEQUENCES[id];
      if (this.buffer.length < seq.length) continue;
      const tail = this.buffer.slice(-seq.length);
      if (tail.every((value, index) => value === seq[index])) hits.push(id);
    }
    if (hits.length) this.buffer = [];
    return hits;
  }

  reset() {
    this.buffer = [];
  }
}
