import {
  EGG_IDS,
  EGGS,
  ENEMY_IDS,
  ITEM_EFFECTS,
  ITEM_IDS,
  NODE_IDS,
  NPC_IDS,
  SIGN_IDS,
  toRoman,
  type Chapter,
  type EnemyId,
  type EnemyStory,
  type Story,
} from "../contracts";

const line = (name: string): EnemyStory => ({
  name,
  title: "Guardian of the Climb",
  domain: "Tests what you know and how clearly you can explain it.",
  intro: ["State your reasoning."],
  struck: ["Correct."],
  taunt: ["Record the miss."],
  defeat: ["The path opens."],
  triumph: ["The Codex passes on."],
});

const names: Record<EnemyId, string> = {
  sentinel: "Foothill Sentinel",
  warden: "Gate Warden",
  architect: "The Architect",
  refactorer: "The Refactorer",
  puzzlewright: "The Puzzlewright",
  latency: "Lady Latency",
  shipwright: "The Shipwright",
  cartographer: "The Cartographer",
  examiner: "The Crown Examiner",
};

function chapter(bloodline: number): Chapter {
  const n = Math.max(1, Math.floor(bloodline));
  return { numeral: toRoman(n), title: `The Climb ${toRoman(n)}`, epigraph: "Failure is data. Climb wiser." };
}

export const STORY: Story = {
  title: "Bloodline: The Interview Castle",
  tagline: "Every answer opens a door. Every mistake outlives you.",
  prologue: ["A castle rises from the sea.", "Climb, answer, and leave a wiser Codex behind."],
  chapter,
  enemies: Object.fromEntries(ENEMY_IDS.map((id) => [id, line(names[id])])) as Record<EnemyId, EnemyStory>,
  npcs: Object.fromEntries(NPC_IDS.map((id) => [id, { name: id, lines: ["Keep climbing."] }])) as Story["npcs"],
  merchant: {
    greet: ["Welcome."],
    bought: ["A sound purchase."],
    broke: ["Return with gold."],
    owned: ["You own that already."],
    farewell: ["Climb well."],
  },
  items: Object.fromEntries(ITEM_IDS.map((id) => [id, { name: id, flavor: ITEM_EFFECTS[id] }])) as Story["items"],
  signs: Object.fromEntries(SIGN_IDS.map((id) => [id, [id === "hello-world" ? "Hello, World." : id]])) as Story["signs"],
  eggs: Object.fromEntries(EGG_IDS.map((id) => [
    id,
    { title: id, lines: [`${EGGS[id].gold > 0 ? `+${EGGS[id].gold} gold` : EGGS[id].perk}`] },
  ])) as Story["eggs"],
  stageClear: Object.fromEntries(NODE_IDS.map((id) => [id, "The path opens."])) as Story["stageClear"],
  rebirth: { victory: ["An heir takes up the Codex."], defeat: ["An heir takes up the blade."] },
  lifelines: {
    hint: ["A margin note glows."],
    time: ["The hourglass turns."],
    senior: ["A senior voice answers."],
  },
};
