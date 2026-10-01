import type { Bloodline, Gear, Lifelines, Role } from "./types";

export const PRICES = {
  armor: 50,
  shield: 40,
  codexLens: 35,
  hourglass: 30,
  mentorSeal: 55,
} as const;

export function secondsFor(bloodline: Bloodline): number {
  if (bloodline === 1) return 45;
  if (bloodline === 2) return 30;
  return 20;
}

export function enemyHeartCount(bloodline: Bloodline, role: Role): number {
  const base = bloodline === 1 ? 2 : bloodline === 2 ? 3 : 4;
  return role === "boss" ? base + 1 : base;
}

export function playerHeartMax(gear: Gear): number {
  return 3 + (gear.armor ? 1 : 0);
}

export function startingLifelines(gear: Gear): Lifelines {
  return {
    hint: 2,
    time: 1 + (gear.hourglass ? 1 : 0),
    senior: 1 + (gear.mentorSeal ? 1 : 0),
  };
}

export function killGold(bloodline: Bloodline, boss: boolean): number {
  const base = 12 + (bloodline - 1) * 4;
  return boss ? base * 3 : base;
}

export const BLOODLINE_COPY: Record<
  Bloodline,
  { title: string; blurb: string; east: string }
> = {
  1: {
    title: "Bloodline I",
    blurb: "Recognition. Forty-five seconds. Enemies hold two hearts.",
    east: "The east tower asks about first paint and design systems.",
  },
  2: {
    title: "Bloodline II",
    blurb: "Application. Thirty seconds. Enemies hold three hearts.",
    east: "The east tower asks about shipping, probes, and who gets to deploy.",
  },
  3: {
    title: "Bloodline III",
    blurb: "Tradeoffs. Twenty seconds. Enemies hold four hearts. Gear is the difference.",
    east: "The east tower asks about domain boundaries and what a model can claim.",
  },
};
