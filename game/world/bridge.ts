import type { EggId, NpcId, SignId } from "../contracts";
import type { Facing, PathId } from "../types";

export type Dir = Facing;

/** Held directions, newest last, plus queued confirm presses. */
export class InputHub {
  private held: Dir[] = [];
  private confirms = 0;

  press(dir: Dir) {
    this.held = [...this.held.filter((d) => d !== dir), dir];
  }

  release(dir: Dir) {
    this.held = this.held.filter((d) => d !== dir);
  }

  confirm() {
    this.confirms = Math.min(2, this.confirms + 1);
  }

  direction(): Dir | null {
    return this.held[this.held.length - 1] ?? null;
  }

  takeConfirm(): boolean {
    if (this.confirms <= 0) return false;
    this.confirms -= 1;
    return true;
  }

  clear() {
    this.held = [];
    this.confirms = 0;
  }
}

export type WorldSnapshot = {
  /** Changes when a new climb starts, which resets the map. */
  climbId: string | null;
  /** The topic path, which decides who guards each room. */
  path: PathId | null;
  bloodline: number;
  nodeIndex: number;
  chests: string[];
  start: { x: number; y: number; facing: Facing } | null;
  /** The map is on screen and nothing covers it. */
  active: boolean;
  /** The map is on screen, possibly under a dialog or menu. */
  visible: boolean;
};

export type WorldEvent =
  | { type: "encounter"; node: number }
  | { type: "talk"; npc: NpcId; spot: string; shop: boolean }
  | { type: "sign"; sign: SignId }
  | { type: "chest"; chest: string }
  | { type: "secret"; egg: EggId }
  | { type: "asleep"; node: number }
  | { type: "step"; x: number; y: number; facing: Facing }
  | { type: "water" }
  | { type: "ready" };

export class WorldBridge {
  snapshot: WorldSnapshot = {
    climbId: null,
    path: null,
    bloodline: 1,
    nodeIndex: 0,
    chests: [],
    start: null,
    active: false,
    visible: false,
  };
  readonly input = new InputHub();
  private listeners = new Set<() => void>();
  private handler: (event: WorldEvent) => void = () => {};

  set(next: Partial<WorldSnapshot>) {
    const merged = { ...this.snapshot, ...next };
    const changed = (Object.keys(next) as (keyof WorldSnapshot)[]).some(
      (key) => JSON.stringify(this.snapshot[key]) !== JSON.stringify(merged[key]),
    );
    if (!changed) return;
    if (!merged.active) this.input.clear();
    this.snapshot = merged;
    for (const listener of this.listeners) listener();
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  onEvent(handler: (event: WorldEvent) => void) {
    this.handler = handler;
  }

  emit(event: WorldEvent) {
    this.handler(event);
  }
}
