"use client";

import { useEffect, useEffectEvent, useState } from "react";
import { fillLine, type EggId } from "@/game/contracts";
import { STORY } from "@/game/story";
import { comboGold, comboLength, EXTRA_SECONDS, secondsFor } from "@/game/balance";
import { nextChallenge } from "@/game/content/challenges";
import { answer, bonusGold, recordChallenge, spendLifeline } from "@/game/engine";
import { lineFrom } from "@/game/rng";
import { enemyOf, nodeAt } from "@/game/route";
import type { Challenge, Facing, Save } from "@/game/types";
import { arrowOf, isBack, isConfirm, isMenu, LAYER, useKeyLayer } from "@/components/keys";
import { useStore, type Store } from "@/components/store";
import { ChallengeView, KIND_LABEL, PUZZLE_KINDS } from "@/components/challenges/ChallengeView";
import { useTypewriter } from "@/components/ui/Dialog";
import { Icon } from "@/components/ui/Sprites";
import { Stage, type DuelFx } from "./Stage";

type Phase = "intro" | "ask" | "result" | "slain" | "fallen";

type Outcome = {
  correct: boolean;
  blocked: boolean;
  timeout: boolean;
  slain: boolean;
  fallen: boolean;
  gold: number;
  line: string;
};

type Combo = { seq: Facing[]; at: number; state: "live" | "won" | "broken"; gold: number };

type Assist = { kind: "hint" | "senior" | "time" | "empty"; flavor: string; text?: string; id: number };

const TICK = 100;
const ARROWS: Facing[] = ["up", "right", "down", "left"];
const GLYPH: Record<Facing, string> = { up: "↑", down: "↓", left: "←", right: "→" };

function randomLine(pool: readonly string[]): string {
  return pool.length ? pool[Math.floor(Math.random() * pool.length)] : "";
}

function shuffled<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** A senior crosses out wrong options but always leaves at least one wrong choice standing. */
function crossOut(challenge: Challenge): number[] {
  let wrong: number[] = [];
  if (challenge.kind === "mcq" || challenge.kind === "model") {
    wrong = challenge.options.map((_, index) => index).filter((index) => index !== challenge.answer);
  } else if (challenge.kind === "box") {
    wrong = challenge.cards.flatMap((card, index) => (card.id === challenge.answer ? [] : [index]));
  }
  return shuffled(wrong).slice(0, Math.max(0, Math.min(2, wrong.length - 1)));
}

export function Duel({
  store,
  paused,
  onWin,
  onLose,
  onMenu,
  onSatchel,
  onEggs,
}: {
  store: Store<Save>;
  paused: boolean;
  onWin: () => void;
  onLose: () => void;
  onMenu: () => void;
  onSatchel: () => void;
  onEggs: (eggs: EggId[]) => void;
}) {
  const save = useStore(store);
  const run = save.run;
  const duel = run?.duel ?? null;
  const bloodline = run?.bloodline ?? 1;
  const nodeIndex = run?.nodeIndex ?? 0;
  const node = nodeAt(nodeIndex);
  const enemyId = enemyOf(nodeIndex, bloodline);
  const story = STORY.enemies[enemyId];
  const vars = { bloodline, gold: save.gold };

  const [phase, setPhase] = useState<Phase>("intro");
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [left, setLeft] = useState(0);
  const [total, setTotal] = useState(1);
  const [eliminated, setEliminated] = useState<number[]>([]);
  const [senior, setSenior] = useState(false);
  const [hinted, setHinted] = useState(false);
  const [assists, setAssists] = useState<Assist[]>([]);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [combo, setCombo] = useState<Combo | null>(null);
  const [fx, setFx] = useState<DuelFx | null>(null);
  const [settled, setSettled] = useState(0);
  const [pop, setPop] = useState<{ amount: number; id: number } | null>(null);
  const [blink, setBlink] = useState(false);
  const [finale, setFinale] = useState("");

  const introLine = fillLine(lineFrom(story.intro, `${run?.id}:${nodeIndex}`) ?? "", vars);
  const line =
    phase === "intro" ? introLine : phase === "result" ? (outcome?.line ?? "") : phase === "ask" ? "" : finale;
  const typer = useTypewriter(line, `${phase}:${fx?.id ?? 0}`);
  const live = fx !== null && settled !== fx.id;

  useEffect(() => {
    if (!fx) return;
    const timer = window.setTimeout(() => setSettled(fx.id), fx.kind === "slain" || fx.kind === "fallen" ? 1400 : 650);
    return () => window.clearTimeout(timer);
  }, [fx]);

  useEffect(() => {
    let reopen = 0;
    const timer = window.setInterval(() => {
      setBlink(true);
      reopen = window.setTimeout(() => setBlink(false), 150);
    }, 3100);
    return () => {
      window.clearInterval(timer);
      window.clearTimeout(reopen);
    };
  }, []);

  const tick = useEffectEvent(() => {
    const next = left - TICK;
    if (next <= 0) {
      setLeft(0);
      resolve(false, true);
    } else setLeft(next);
  });

  useEffect(() => {
    if (phase !== "ask" || paused || !challenge) return;
    const timer = window.setInterval(() => tick(), TICK);
    return () => window.clearInterval(timer);
  }, [phase, paused, challenge]);

  function ask() {
    const current = store.get();
    const climb = current.run;
    if (!climb?.duel) return;
    const salt = Math.floor(Math.random() * 2147483646) + 1;
    const next = nextChallenge({
      bloodline: climb.bloodline,
      node: node.id,
      role: node.role,
      asked: climb.duel.hits + climb.duel.misses,
      usedIds: climb.usedIds,
      avoid: current.lastSeen,
      salt,
      seats: climb.duel.seats,
    });
    store.set(recordChallenge(current, next));
    const ms = secondsFor(next.kind, climb.bloodline, next.par) * 1000;
    setChallenge(next);
    setLeft(ms);
    setTotal(ms);
    setEliminated([]);
    setSenior(false);
    setHinted(false);
    setAssists([]);
    setOutcome(null);
    setCombo(null);
    setPhase("ask");
  }

  function resolve(correct: boolean, timeout = false) {
    if (phase !== "ask" || !challenge) return;
    const result = answer(store.get(), challenge, correct, Date.now());
    store.set(result.save);
    const id = Date.now();
    const pool = correct ? story.struck : story.taunt;
    setOutcome({
      correct,
      blocked: result.outcome.blocked,
      timeout,
      slain: result.outcome.slain,
      fallen: result.outcome.fallen,
      gold: result.outcome.gold,
      line: fillLine(randomLine(pool), { bloodline, gold: result.save.gold }),
    });
    setFx({ kind: correct ? "hit" : result.outcome.blocked ? "block" : "miss", id });
    if (result.outcome.gold > 0) setPop({ amount: result.outcome.gold, id });
    if (correct) {
      const length = comboLength(bloodline);
      setCombo({
        seq: Array.from({ length }, () => ARROWS[Math.floor(Math.random() * ARROWS.length)]),
        at: 0,
        state: "live",
        gold: comboGold(bloodline),
      });
    } else setCombo(null);
    setPhase("result");
    if (result.outcome.eggs.length) onEggs(result.outcome.eggs);
  }

  function proceed() {
    if (!typer.done && phase !== "ask") {
      typer.finish();
      return;
    }
    if (phase === "intro") ask();
    else if (phase === "result" && outcome) {
      const id = Date.now();
      if (outcome.slain) {
        setFinale(fillLine(randomLine(story.defeat), vars));
        setFx({ kind: "slain", id });
        setPhase("slain");
      } else if (outcome.fallen) {
        setFinale(fillLine(randomLine(story.triumph), vars));
        setFx({ kind: "fallen", id });
        setPhase("fallen");
      } else ask();
    } else if (phase === "slain") onWin();
    else if (phase === "fallen") onLose();
  }

  function note(kind: Assist["kind"], flavor: string, text?: string) {
    setAssists((previous) => [...previous.filter((item) => item.kind !== kind && item.kind !== "empty"), { kind, flavor, text, id: Date.now() }]);
  }

  function takeHint() {
    if (phase !== "ask" || !challenge || hinted) return;
    const next = spendLifeline(store.get(), "hint");
    if (!next) {
      note("empty", `No Hint charges left. A ${STORY.items.scroll.name} from the satchel adds one.`);
      return;
    }
    store.set(next);
    setHinted(true);
    const lens = next.gear.lens > 0 ? ` Principle: ${challenge.principle}.` : "";
    note("hint", fillLine(randomLine(STORY.lifelines.hint), vars), `${challenge.hint}${lens}`);
  }

  function takeTime() {
    if (phase !== "ask" || !challenge) return;
    const next = spendLifeline(store.get(), "time");
    if (!next) {
      note("empty", `No Extra time left. A ${STORY.items.sand.name} from the satchel adds one.`);
      return;
    }
    store.set(next);
    setLeft((value) => value + EXTRA_SECONDS * 1000);
    setTotal((value) => value + EXTRA_SECONDS * 1000);
    note("time", fillLine(randomLine(STORY.lifelines.time), vars), `+${EXTRA_SECONDS} seconds.`);
  }

  function askSenior() {
    if (phase !== "ask" || !challenge || senior) return;
    const next = spendLifeline(store.get(), "senior");
    if (!next) {
      note("empty", `No senior is free. A ${STORY.items.note.name} from the satchel buys their time.`);
      return;
    }
    store.set(next);
    setSenior(true);
    setEliminated(crossOut(challenge));
    note("senior", fillLine(randomLine(STORY.lifelines.senior), vars), challenge.senior);
  }

  function comboKey(arrow: Facing) {
    if (!combo || combo.state !== "live") return;
    if (combo.seq[combo.at] !== arrow) {
      setCombo({ ...combo, state: "broken" });
      return;
    }
    const at = combo.at + 1;
    if (at < combo.seq.length) {
      setCombo({ ...combo, at });
      return;
    }
    setCombo({ ...combo, at, state: "won" });
    store.set(bonusGold(store.get(), combo.gold));
    setPop({ amount: combo.gold, id: Date.now() });
  }

  useKeyLayer(
    LAYER.SCREEN,
    (event) => {
      if (isMenu(event)) {
        if (!event.repeat) onMenu();
        return true;
      }
      if (event.key === "i" || event.key === "I") {
        if (!event.repeat) onSatchel();
        return true;
      }
      if (phase === "ask") {
        const key = event.key.toLowerCase();
        if (event.repeat && (key === "h" || key === "t" || key === "s")) return true;
        if (key === "h") takeHint();
        else if (key === "t") takeTime();
        else if (key === "s") askSenior();
        else return false;
        return true;
      }
      if (phase === "result") {
        const arrow = arrowOf(event);
        if (arrow) {
          if (!event.repeat) comboKey(arrow);
          return true;
        }
      }
      if (isConfirm(event) || isBack(event)) {
        if (!event.repeat) proceed();
        return true;
      }
      return false;
    },
    { enabled: !paused },
  );

  if (!run || !duel) return null;

  const seconds = Math.ceil(left / 1000);
  const urgent = left / total < 0.25;
  const puzzle = challenge ? PUZZLE_KINDS.has(challenge.kind) : false;
  const lifelines = run.lifelines;

  return (
    <section className={`duel ${puzzle && phase === "ask" ? "has-puzzle" : ""}`} aria-label={`Duel with ${story.name}`}>
      <div className="duel-left">
        <Stage
          node={node.id}
          enemyId={enemyId}
          bloodline={bloodline}
          name={story.name}
          title={story.title}
          enemyHearts={duel.enemyHearts}
          enemyMax={duel.enemyMax}
          hearts={run.hearts}
          maxHearts={run.maxHearts}
          shield={duel.shield}
          gold={save.gold}
          fx={fx}
          live={live}
          blink={blink}
          pop={pop}
        />
        <div className="duel-box" onClick={phase === "ask" ? undefined : proceed}>
          {phase === "ask" && challenge ? (
            <>
              <p className="duel-kind">
                {KIND_LABEL[challenge.kind]} · {node.place}
              </p>
              <p className="duel-prompt">{challenge.prompt}</p>
            </>
          ) : (
            <>
              <p className="dialog-speaker">{story.name}</p>
              <p className="dialog-text">
                {typer.shown}
                <span className="dialog-ghost" aria-hidden>
                  {line.slice(typer.shown.length)}
                </span>
              </p>
              <span className={`dialog-next ${typer.done ? "ready" : ""}`} aria-hidden>
                ▼
              </span>
            </>
          )}
        </div>
      </div>

      <div className="duel-right">
        {phase === "intro" && (
          <div className="duel-card intro-card">
            <p className="duel-kind">{node.place}</p>
            <h2>{story.name}</h2>
            <p className="muted">{story.title}</p>
            <p>{fillLine(story.domain, vars)}</p>
            <ul className="intro-facts">
              <li>
                <Icon id="heart" scale={1} /> {duel.enemyMax} hearts to break
              </li>
              <li>
                <Icon id="coin" scale={1} /> Every heart you break pays gold at once
              </li>
            </ul>
            <p className="continue">
              <kbd>Z</kbd> begin
            </p>
          </div>
        )}

        {phase === "ask" && challenge && (
          <div className="duel-card">
            <div className={`timer ${urgent ? "urgent" : ""}`} aria-label={`${seconds} seconds left`}>
              <span style={{ width: `${Math.max(0, Math.min(100, (left / total) * 100))}%` }} />
              <b>{seconds}s</b>
            </div>
            <ChallengeView
              key={challenge.id + challenge.prompt}
              challenge={challenge}
              active={!paused}
              senior={senior}
              eliminated={eliminated}
              onAnswer={(correct) => resolve(correct)}
            />
            {assists.map((item) => (
              <div key={item.id} className={`assist ${item.kind}`}>
                <em>{item.flavor}</em>
                {item.text && <p>{item.text}</p>}
              </div>
            ))}
            <div className="lifelines">
              <button
                type="button"
                tabIndex={-1}
                className={`chip ${lifelines.hint <= 0 ? "spent" : ""}`}
                disabled={hinted}
                onClick={takeHint}
              >
                <kbd>H</kbd> Hint <b>{lifelines.hint}</b>
              </button>
              <button
                type="button"
                tabIndex={-1}
                className={`chip ${lifelines.time <= 0 ? "spent" : ""}`}
                onClick={takeTime}
              >
                <kbd>T</kbd> Extra time <b>{lifelines.time}</b>
              </button>
              <button
                type="button"
                tabIndex={-1}
                className={`chip ${lifelines.senior <= 0 ? "spent" : ""}`}
                disabled={senior}
                onClick={askSenior}
              >
                <kbd>S</kbd> Ask a senior <b>{lifelines.senior}</b>
              </button>
              <button type="button" tabIndex={-1} className="chip ghost" onClick={onSatchel}>
                <kbd>I</kbd> Satchel
              </button>
            </div>
          </div>
        )}

        {phase === "result" && challenge && outcome && (
          <div className="duel-card lesson-card">
            <p className={`verdict-banner ${outcome.correct ? "good" : outcome.blocked ? "held" : "bad"}`}>
              {outcome.correct
                ? `Struck true · +${outcome.gold} gold`
                : outcome.blocked
                  ? "Your shield took the blow"
                  : outcome.timeout
                    ? "Out of time · a heart lost"
                    : "Missed · a heart lost"}
            </p>
            <dl className="lesson">
              <dt>Principle</dt>
              <dd>{challenge.principle}</dd>
              <dt>Answer</dt>
              <dd>{challenge.reveal}</dd>
              <dt>Why it matters</dt>
              <dd>{challenge.why}</dd>
            </dl>
            {!outcome.correct && <p className="muted small">Written into your Codex.</p>}
            {combo && (
              <div className={`combo ${combo.state}`}>
                <span className="combo-label">
                  {combo.state === "won"
                    ? `Combo! +${combo.gold} gold`
                    : combo.state === "broken"
                      ? "Combo broken. No harm done."
                      : `Bonus combo, +${combo.gold} gold:`}
                </span>
                <span className="combo-keys">
                  {combo.seq.map((arrow, index) => (
                    <kbd key={index} className={index < combo.at ? "hit" : ""}>
                      {GLYPH[arrow]}
                    </kbd>
                  ))}
                </span>
              </div>
            )}
            <p className="continue">
              <kbd>Z</kbd> continue
            </p>
          </div>
        )}

        {(phase === "slain" || phase === "fallen") && (
          <div className="duel-card">
            <p className={`verdict-banner ${phase === "slain" ? "good" : "bad"}`}>
              {phase === "slain" ? `${story.name} falls` : "You fall"}
            </p>
            <p className="muted">
              {phase === "slain"
                ? node.id === "throne"
                  ? "The crown is yours. The castle will pay what it owes."
                  : "The ward behind this guardian is breaking."
                : "Your gold is safe. Your heir inherits it, and the Codex."}
            </p>
            <p className="continue">
              <kbd>Z</kbd> continue
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
