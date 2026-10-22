# Bloodline

A pixel-art interview RPG you play with the keyboard. Walk a castle map tile by tile, talk to the people in it, open chests, and duel seven guardians with interview questions and hands-on puzzles. Each right answer breaks one of the guardian's hearts and drops gold into your purse at once. Spend that gold with the merchants you meet on the map.

Choose how to climb from the title screen:

- **DSA.** The main path. After you pick it, choose a subtopic — arrays and strings, hashing, stacks and queues, linked lists, trees and BSTs, heaps, graphs, binary search, sorting, recursion, dynamic programming, greedy, or Big-O — or a mix of all of them. Each subtopic has five levels of its own. Beat that climb's throne to unlock the next level. Progress is kept per subtopic.
- **Other topic paths.** System Design, SQL, and Good Practices. The castle, its guardians, and every question come from that topic. Each path has five levels. Beat the throne to unlock the next. Progress is kept per topic.
- **Bloodline.** The original endless climb with mixed topics. Every climb you finish, won or lost, opens the next Bloodline, and there is no last one. Each Bloodline brings tougher guardians, shorter clocks, and larger puzzles.

Your gold, gear, and satchel carry over between both modes.

## Run it

```bash
npm install
npm run dev -- -p 43123
```

Open [http://127.0.0.1:43123](http://127.0.0.1:43123). For a production build, run `npm run build && npm start`.

## Controls

| Key | What it does |
| --- | --- |
| Arrows or WASD | Walk the map. Move the cursor in menus and puzzles |
| Z, Enter, Space | Talk, read a sign, open a chest, confirm |
| X, Backspace | Back. Undo a move inside a puzzle |
| Esc or P | Open the menu |
| 1–4 | Pick an answer in a duel |
| 1–9 | Pick a numbered menu item |
| H, T, S | Use a lifeline in a duel: Hint, Extra time, Ask a senior |
| I | Open the satchel |

After a right answer, a short row of arrows appears. Type it before you continue for bonus gold.

On a phone or tablet, an on-screen pad appears with a D-pad, A (confirm), B (back), Menu, and Satchel. In a duel you can also tap an answer.

## How a climb works

- **The route.** The Shore, The Gate, The Yard, The Stair, the West Tower, the East Tower, and The Throne. Each guardian holds the path shut until it falls. Step onto the ground it watches and the duel begins.
- **Duels.** Some challenges are questions. Others are puzzles you solve with the keys: walk two pointers inward to a target sum, hunt a number by binary search, close brackets in order, run a maze in the fewest steps, sort a row with neighbor swaps, keep an LRU cache, run a stack or a queue, flood a grid breadth-first, or rank code by its complexity. The West Tower is all puzzles. The East Tower brings a specialist topic that rotates by Bloodline.
- **Hearts.** A miss costs you one heart and writes the lesson into the Codex. Lose every heart and the climb ends.
- **Gold.** You earn gold for every heart you break, for combos, for each stage you clear, for a stage cleared without a miss, for the throne, and from chests. The HUD purse updates as you earn it.
- **Shopping.** Two merchants stand on the map, one on the shore and one in the yard. Outside a duel, you can also open the shop from the menu. Gear is permanent and comes in tiers: armor, a shield, a lens, an hourglass, and a seal. Consumables wait in the satchel until you use them, even in the middle of a duel.
- **Levels.** On a topic path, a level opens only when you win the level before it. On DSA, that unlock is per subtopic (or for the mix). Any open level can be replayed. Higher levels give guardians more hearts and shorter clocks.
- **Bloodlines.** In Bloodline mode, when a climb ends, the next Bloodline opens. Any Bloodline you have reached can be chosen again from the title.

## The menu

Esc opens the menu, where you can resume, use the satchel, shop, read the Codex, check your secrets, and review the controls. From the menu you can also restart this Bloodline, return to the title, or start over. The title screen has Continue, so a climb can be left and picked up later. Start over erases the save, and the game asks before anything is lost.

## Secrets

The castle hides a few secrets. The Secrets page counts them but does not say where they are.

## Saves

Progress lives in this browser's `localStorage`. There is no account. A save from the first version of the game is carried over on first load.

## Project layout

- `game/`: pure TypeScript. It holds the rules, balance, save format, challenge content, and map data.
- `game/contracts.ts`: the shared ids and types that the engine, art, and story all build on.
- `game/art/` and `components/art/`: pixel art drawn in code.
- `game/story/`: all narrative text.
- `game/paths/`: the topic paths. Each file is one topic: its castle rooms, guardians, levels, questions, and puzzles. `select.ts` picks the next challenge and `progress.ts` tracks which levels are open.
- `components/`: the React screens, plus the Phaser overworld in `components/overworld/`.

## Adding a topic

1. Add the id to `PATH_IDS` in `game/types.ts`.
2. Write its `PathDef` in a new file in `game/paths/`, using an existing topic as the model.
3. Register it in `PATHS` in `game/paths/index.ts`, and give it an id prefix in `game/paths/content.test.ts`.
4. Run `npm test`. The content tests check that every room is themed, every level has enough questions for each seat, and every answer is well formed.

## Tests

```bash
npm test
```

The tests cover level selection and unlocking, save repair, challenge selection, and the shape and volume of each topic's content.

Questions are original. The topics come from interview frequency and from the ideas in a working library: algorithms, system design, clean code, pragmatic practice, delivery, domain boundaries, and models. The game does not reproduce text from those books.
