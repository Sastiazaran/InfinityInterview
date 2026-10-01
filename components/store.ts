"use client";

import { useSyncExternalStore } from "react";

/** A tiny observable value. Event handlers read the latest state with get() instead of a render snapshot. */
export class Store<T> {
  private state: T;
  private listeners = new Set<() => void>();

  constructor(initial: T) {
    this.state = initial;
  }

  get = (): T => this.state;

  set = (next: T | ((previous: T) => T)) => {
    const value = typeof next === "function" ? (next as (previous: T) => T)(this.state) : next;
    if (Object.is(value, this.state)) return;
    this.state = value;
    for (const listener of this.listeners) listener();
  };

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
}

export function useStore<T>(store: Store<T>): T {
  return useSyncExternalStore(store.subscribe, store.get, store.get);
}
