/** Shared castle colors. Character bases stay literal; later Bloodlines remap a material. */

export type Quad = readonly [string, string, string, string];

export const SKIN_HI = "#f2c8a6";
export const SKIN = "#e2ae84";
export const SKIN_MID = "#c88858";
export const SKIN_LO = "#a06840";
export const LIP = "#c46a6a";
export const LIP_DEEP = "#8d4040";
export const BLUSH = "#e09888";

export const HAIR_BROWN_HI = "#8a5a38";
export const HAIR_BROWN = "#5c3a24";
export const HAIR_BROWN_LO = "#3a2418";
export const HAIR_GREY_HI = "#d8d2c6";
export const HAIR_GREY = "#a8a090";
export const HAIR_GREY_LO = "#6e685c";
export const HAIR_DARK_HI = "#4a4038";
export const HAIR_DARK = "#2c241c";
export const HAIR_DARK_LO = "#1a1410";

export const WOOD_HI = "#c49464";
export const WOOD = "#8b5a32";
export const WOOD_LO = "#5c3a22";
export const WOOD_DEEP = "#3a2416";

export const PARCH_HI = "#f4e7cf";
export const PARCH = "#e7d3ae";
export const PARCH_LO = "#c4ae82";
export const PARCH_DEEP = "#8d7048";

export const ROSE_HI = "#e07070";
export const ROSE = "#c44949";
export const ROSE_LO = "#8a3030";
export const ROSE_DEEP = "#4e1c1c";

export const GOLD_HI = "#f0d9a0";
export const GOLD = "#e2c07a";
export const GOLD_LO = "#a67c3d";
export const GOLD_DEEP = "#6e4e24";

export const STEEL_HI = "#e4e8ee";
export const STEEL = "#b4bcc6";
export const STEEL_LO = "#6e7884";
export const STEEL_DEEP = "#3a424c";

export const WHITE = "#f7f3ea";
export const INK = "#241c16";

export const SEA = "#142033";
export const SEA_MID = "#1c3050";
export const SEA_HI = "#2a4a72";

/** Bloodlines I–III are age 0. Each later trio advances one age, cycling four looks. */
export function paletteAge(bloodline: number): number {
  const n = Math.max(1, Math.floor(bloodline));
  return Math.floor((n - 1) / 3) % 4;
}

type Variant = { cloth: Quad; metal: Quad; accent: Quad; gem: Quad };

const ROSE_KIT: Variant = {
  cloth: ["#e08888", "#c44949", "#8a3030", "#4e1c1c"],
  metal: ["#f0c8a0", "#d09058", "#a06830", "#6a4018"],
  accent: [PARCH_HI, PARCH, "#a08060", "#6a5040"],
  gem: ["#ffc0c0", "#e05858", "#a03030", "#601818"],
};

const VIOLET_KIT: Variant = {
  cloth: ["#c8b8e8", "#7a68b0", "#4c3e78", "#2a2044"],
  metal: ["#f4f6f8", "#c8d0d8", "#889098", "#505860"],
  accent: ["#e8d8ff", "#b090e0", "#7050a0", "#402868"],
  gem: ["#ffd0ff", "#d060d8", "#882888", "#501850"],
};

const MOSS_KIT: Variant = {
  cloth: ["#d0e0b8", "#6e9460", "#3e5c34", "#24381e"],
  metal: ["#f0c8a0", "#d09060", "#a06038", "#6a3c20"],
  accent: ["#e8f0d0", "#8ea58a", "#4e6848", "#2c4028"],
  gem: ["#e0ffc0", "#60c060", "#207030", "#103818"],
};

const VARIANTS: readonly Variant[] = [
  ROSE_KIT,
  ROSE_KIT,
  VIOLET_KIT,
  MOSS_KIT,
];

export function look(age: number, base: Quad, slot: keyof Variant): Quad {
  if (age <= 0) return base;
  return VARIANTS[age % 4][slot];
}
