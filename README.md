# Bloodline

A 2D interview game. You walk a route up a castle and duel seven enemies. A correct challenge takes one of their hearts. A miss takes one of yours. Clear the throne or fall, and you are reborn into the next Bloodline: the same route, harder questions, and the gear you kept. Earlier Bloodlines stay open.

The wings follow what interviews actually ask. Two duels are algorithms, then a system-design tradeoff, a craft question, a hands-on puzzle, a specialist room that changes with the Bloodline, and a mixed fight at the throne.

## Run it

```bash
npm install
npm run dev -- -p 43123
```

Open [http://127.0.0.1:43123](http://127.0.0.1:43123).

Progress, gold, gear, and missed questions live in `localStorage` in this browser. There is no account.

## How a climb works

- **Hint**, **Extra time**, and **Ask a senior** are limited each climb. Armor, a shield, a codex lens, an hourglass, and a mentor's seal are bought between climbs.
- The west tower is a simulator: a stack or queue, a breadth-first flood, a complexity sort, or a systems box.
- The east tower rotates: first paint and design systems, then delivery and Kubernetes, then bounded contexts and models.
- Misses are written into the Codex.

Questions are original. The topics come from interview frequency and from the ideas in a working library (algorithms, system design, clean code, pragmatic practice, delivery, domain boundaries, and models). The game does not reproduce text from those books.
