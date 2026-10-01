"use client";

import { useEffect, useRef, useState } from "react";
import {
  BLOODLINE_COPY,
  enemyHeartCount,
  killGold,
  playerHeartMax,
  PRICES,
  secondsFor,
  startingLifelines,
} from "@/game/balance";
import { nextChallenge } from "@/game/content/challenges";
import { NODES, presentNode } from "@/game/route";
import { loadSave, rememberMiss, writeSave } from "@/game/save";
import type { Bloodline, Challenge, CodexEntry, Gear, Run, Save, Topic } from "@/game/types";
import { CastleMap } from "./CastleMap";
import { ChallengeView } from "./ChallengeView";

type Screen = "select" | "map" | "duel" | "feedback" | "rebirth" | "armory" | "codex";

type Banner = {
  title: string;
  tone: "hit" | "wound" | "block" | "slain" | "fall" | "throne";
  slain: boolean;
  dead: boolean;
  victory: boolean;
};

const GEAR_COPY: { key: keyof Gear; name: string; line: string }[] = [
  { key: "armor", name: "Armor", line: "One more heart at the start of every climb." },
  { key: "shield", name: "Shield", line: "The first miss in each duel is blocked." },
  { key: "codexLens", name: "Codex lens", line: "A hint also names the principle." },
  { key: "hourglass", name: "Hourglass", line: "One extra charge of Extra time." },
  { key: "mentorSeal", name: "Mentor's seal", line: "One extra charge of Ask a senior." },
];

export function GameApp() {
  const [save, setSave] = useState<Save | null>(null);
  const [screen, setScreen] = useState<Screen>("select");
  const [back, setBack] = useState<Screen>("select");
  const [run, setRun] = useState<Run | null>(null);
  const [banner, setBanner] = useState<Banner | null>(null);
  const [victory, setVictory] = useState(false);
  const [eliminated, setEliminated] = useState<number[]>([]);
  const [hintOn, setHintOn] = useState(false);
  const [seniorOn, setSeniorOn] = useState(false);
  const [remain, setRemain] = useState(0);
  const [seats, setSeats] = useState<Topic[]>([]);
  const endsRef = useRef(0);
  const pausedRef = useRef(0);
  const screenRef = useRef<Screen>("select");
  const lockRef = useRef(false);
  const continuedRef = useRef(false);
  const timeoutRef = useRef<() => void>(() => {});

  useEffect(() => {
    // localStorage is read after mount so the server and the first paint match.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSave(loadSave());
  }, []);

  useEffect(() => {
    if (save) writeSave(save);
  }, [save]);

  useEffect(() => {
    screenRef.current = screen;
  }, [screen]);

  useEffect(() => {
    const id = window.setInterval(() => {
      const left = Math.max(0, Math.ceil((endsRef.current - Date.now()) / 1000));
      setRemain(left);
      if (screenRef.current === "duel" && Date.now() >= endsRef.current) {
        timeoutRef.current();
      }
    }, 200);
    return () => window.clearInterval(id);
  }, []);

  function open(next: Screen, from: Screen) {
    if (from === "duel") pausedRef.current = Math.max(1000, endsRef.current - Date.now());
    setBack(from);
    setScreen(next);
  }

  function closeOverlay() {
    if (back === "duel") endsRef.current = Date.now() + pausedRef.current;
    setScreen(back);
  }

  function freshQuestion(current: Run, heartIndex: number, seatList: Topic[]): Challenge {
    const node = NODES[current.nodeIndex];
    const challenge = nextChallenge({
      bloodline: current.bloodline,
      role: node.role,
      heartIndex,
      avoid: save?.lastSeen ?? [],
      usedIds: current.usedIds,
      salt: Math.floor(Math.random() * 100000) + heartIndex * 17,
      bossSeatsUsed: seatList,
    });
    if (challenge.kind === "mcq" && challenge.seat) {
      setSeats([...seatList, challenge.seat]);
    }
    return challenge;
  }

  function armQuestion(challenge: Challenge) {
    const seconds = secondsFor(run?.bloodline ?? 1);
    endsRef.current = Date.now() + seconds * 1000;
    lockRef.current = false;
    setEliminated([]);
    setHintOn(false);
    setSeniorOn(false);
    setRemain(seconds);
    continuedRef.current = false;
    return challenge;
  }

  function startClimb(bloodline: Bloodline) {
    if (!save || bloodline > save.unlocked) return;
    const max = playerHeartMax(save.gear);
    const enemyMax = enemyHeartCount(bloodline, NODES[0].role);
    setSeats([]);
    setRun({
      bloodline,
      nodeIndex: 0,
      playerHearts: max,
      playerMax: max,
      enemyHearts: enemyMax,
      enemyMax,
      gold: 0,
      lifelines: startingLifelines(save.gear),
      shieldLeft: save.gear.shield,
      usedIds: [],
      challenge: null,
    });
    setScreen("map");
  }

  function engage() {
    if (!run || !save) return;
    const seatList = NODES[run.nodeIndex].role === "boss" ? [] : seats;
    if (NODES[run.nodeIndex].role === "boss") setSeats([]);
    const challenge = freshQuestion({ ...run, usedIds: run.usedIds }, 0, seatList);
    const next = {
      ...run,
      challenge,
      usedIds: [...run.usedIds, challenge.id],
      shieldLeft: save.gear.shield,
    };
    setRun(next);
    armQuestion(challenge);
    setScreen("duel");
  }

  function resolve(correct: boolean) {
    if (!run || !run.challenge || !save || lockRef.current) return;
    lockRef.current = true;
    const challenge = run.challenge;
    let playerHearts = run.playerHearts;
    let enemyHearts = run.enemyHearts;
    let shieldLeft = run.shieldLeft;
    let tone: Banner["tone"] = correct ? "hit" : "wound";
    if (!correct && shieldLeft) {
      shieldLeft = false;
      tone = "block";
    } else if (!correct) {
      playerHearts -= 1;
    } else {
      enemyHearts -= 1;
    }

    if (!correct) {
      const entry: CodexEntry = {
        id: challenge.id,
        prompt: challenge.prompt,
        reveal: challenge.reveal,
        why: challenge.why,
        principle: challenge.principle,
        topic: challenge.topic,
        bloodline: challenge.bloodline,
        at: Date.now(),
      };
      setSave((prev) => (prev ? rememberMiss(prev, entry) : prev));
    }

    const dead = playerHearts <= 0;
    const slain = enemyHearts <= 0;
    const boss = NODES[run.nodeIndex].role === "boss";
    let gold = run.gold;
    let title = correct ? "The blow lands." : "You take the hit.";
    if (tone === "block") title = "The shield takes it.";
    if (slain && boss) title = "The throne is empty.";
    else if (slain) title = `${presentNode(NODES[run.nodeIndex], run.bloodline).name} falls.`;
    if (dead) title = "Your hearts are gone.";
    if (slain) gold += killGold(run.bloodline, boss);

    const nextRun: Run = {
      ...run,
      playerHearts,
      enemyHearts,
      shieldLeft,
      gold,
    };
    setRun(nextRun);
    setBanner({
      title,
      tone: dead ? "fall" : slain && boss ? "throne" : slain ? "slain" : tone,
      slain,
      dead,
      victory: slain && boss,
    });
    setScreen("feedback");
  }

  useEffect(() => {
    timeoutRef.current = () => resolve(false);
  });

  function continueFromFeedback() {
    if (!run || !banner || !save || continuedRef.current) return;
    continuedRef.current = true;
    if (banner.dead || banner.victory) {
      const bloodline = run.bloodline;
      const earned = run.gold;
      const seen = run.usedIds.slice(-80);
      setSave((prev) => {
        if (!prev) return prev;
        const nextUnlocked = Math.max(prev.unlocked, Math.min(3, bloodline + 1)) as Bloodline;
        return { ...prev, gold: prev.gold + earned, unlocked: nextUnlocked, lastSeen: seen };
      });
      setVictory(banner.victory);
      setScreen("rebirth");
      return;
    }
    if (banner.slain) {
      const nodeIndex = run.nodeIndex + 1;
      const enemyMax = enemyHeartCount(run.bloodline, NODES[nodeIndex].role);
      setRun({
        ...run,
        nodeIndex,
        enemyHearts: enemyMax,
        enemyMax,
        challenge: null,
        shieldLeft: save.gear.shield,
      });
      setScreen("map");
      return;
    }
    const heartIndex = run.enemyMax - run.enemyHearts;
    const challenge = freshQuestion(run, heartIndex, seats);
    const next = { ...run, challenge, usedIds: [...run.usedIds, challenge.id] };
    setRun(next);
    armQuestion(challenge);
    setScreen("duel");
  }

  function useHint() {
    if (!run || hintOn || run.lifelines.hint <= 0) return;
    setHintOn(true);
    setRun({ ...run, lifelines: { ...run.lifelines, hint: run.lifelines.hint - 1 } });
  }

  function useTime() {
    if (!run || run.lifelines.time <= 0) return;
    endsRef.current += 20000;
    setRemain(Math.max(0, Math.ceil((endsRef.current - Date.now()) / 1000)));
    setRun({ ...run, lifelines: { ...run.lifelines, time: run.lifelines.time - 1 } });
  }

  function useSenior() {
    if (!run || !run.challenge || seniorOn || run.lifelines.senior <= 0) return;
    const challenge = run.challenge;
    if (challenge.kind === "mcq" || challenge.kind === "model") {
      setEliminated((prev) => {
        const wrong = challenge.options
          .map((_, index) => index)
          .filter((index) => index !== challenge.answer && !prev.includes(index));
        if (!wrong.length) return prev;
        return [...prev, wrong[wrong.length - 1]];
      });
    }
    setSeniorOn(true);
    setRun({ ...run, lifelines: { ...run.lifelines, senior: run.lifelines.senior - 1 } });
  }

  function buy(key: keyof Gear) {
    setSave((prev) => {
      if (!prev || prev.gear[key] || prev.gold < PRICES[key]) return prev;
      return {
        ...prev,
        gold: prev.gold - PRICES[key],
        gear: { ...prev.gear, [key]: true },
      };
    });
  }

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Enter" && screen === "map" && !(event.target instanceof HTMLButtonElement)) {
        engage();
      }
      if (screen === "duel" && run?.challenge && (run.challenge.kind === "mcq" || run.challenge.kind === "model")) {
        const index = Number(event.key) - 1;
        if (index >= 0 && index < run.challenge.options.length && !eliminated.includes(index)) {
          resolve(index === run.challenge.answer);
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!save) {
    return (
      <main className="shell">
        <p className="kicker">The gate is opening</p>
      </main>
    );
  }

  const node = run ? presentNode(NODES[run.nodeIndex], run.bloodline) : null;

  return (
    <main className="shell">
      <header className="top">
        <div>
          <p className="kicker">Bloodline</p>
          <strong>The interview castle</strong>
        </div>
        <div className="top-meta">
          <span>{save.gold} gold</span>
          {run && screen !== "select" && screen !== "rebirth" && (
            <span>
              {BLOODLINE_COPY[run.bloodline].title}
              {screen === "map" || screen === "duel" || screen === "feedback"
                ? ` · ${run.gold} this climb`
                : ""}
            </span>
          )}
          {screen !== "codex" && (
            <button className="text-btn" onClick={() => open("codex", screen)}>
              Codex
            </button>
          )}
        </div>
      </header>

      {screen === "select" && (
        <section className="panel wide">
          <h1>Climb until the throne, then climb again.</h1>
          <p className="lede">
            Seven duels stand between the shore and the crown. A correct answer takes one of their
            hearts. A miss gives them one of yours. Fall or take the throne, and you are reborn into
            a harder Bloodline with the same route and the gear you kept. You can always walk an
            earlier Bloodline again.
          </p>
          <div className="blood-grid">
            {([1, 2, 3] as Bloodline[]).map((bloodline) => {
              const locked = bloodline > save.unlocked;
              const copy = BLOODLINE_COPY[bloodline];
              return (
                <article key={bloodline} className={locked ? "blood locked" : "blood"}>
                  <h2>{copy.title}</h2>
                  <p>{copy.blurb}</p>
                  <p>{copy.east}</p>
                  <button className="btn gold" disabled={locked} onClick={() => startClimb(bloodline)}>
                    {locked ? "Locked" : "Enter the map"}
                  </button>
                </article>
              );
            })}
          </div>
          <div className="row spread">
            <button className="btn stone" onClick={() => open("armory", "select")}>
              Armory
            </button>
            <button className="btn stone" onClick={() => open("codex", "select")}>
              Review the codex
            </button>
          </div>
        </section>
      )}

      {screen === "map" && run && node && (
        <section className="panel wide">
          <div className="map-copy">
            <div>
              <p className="kicker">{node.place}</p>
              <h1>{node.name}</h1>
              <p>{node.line}</p>
            </div>
            <Hearts label="You" value={run.playerHearts} max={run.playerMax} />
          </div>
          <CastleMap nodeIndex={run.nodeIndex} bloodline={run.bloodline} onEngage={engage} />
          <ol className="route">
            {NODES.map((item, index) => {
              const view = presentNode(item, run.bloodline);
              const state = index < run.nodeIndex ? "Down" : index === run.nodeIndex ? "Now" : "Ahead";
              return (
                <li key={item.id} className={state === "Now" ? "now" : ""}>
                  <span>{state}</span>
                  {view.place} — {view.name}
                </li>
              );
            })}
          </ol>
          <button className="btn gold" onClick={engage}>
            Face {node.name}
          </button>
          <p className="fine">Enter works too. Only the next enemy on the path will meet you.</p>
        </section>
      )}

      {screen === "duel" && run && node && run.challenge && (
        <section className="panel duel">
          <div className="duel-head">
            <div>
              <p className="kicker">{node.place}</p>
              <h1>{node.name}</h1>
              <Hearts label="You" value={run.playerHearts} max={run.playerMax} />
            </div>
            <Figure role={NODES[run.nodeIndex].role} />
            <div className="enemy-side">
              <Hearts label="Enemy" value={run.enemyHearts} max={run.enemyMax} />
              <p className={`timer ${remain <= 5 ? "hot" : ""}`}>{remain}s</p>
              {run.shieldLeft && <p className="fine">Shield ready</p>}
            </div>
          </div>
          <article className="parchment">
            <p className="prompt">{run.challenge.prompt}</p>
            {hintOn && <p className="hint">Hint: {run.challenge.hint}</p>}
            {hintOn && save.gear.codexLens && (
              <p className="hint">Principle: {run.challenge.principle}</p>
            )}
            {seniorOn && <p className="hint">Senior: {run.challenge.senior}</p>}
            <ChallengeView
              key={run.challenge.id}
              challenge={run.challenge}
              eliminated={eliminated}
              onAnswer={resolve}
            />
          </article>
          <div className="row">
            <button className="btn stone" disabled={hintOn || run.lifelines.hint <= 0} onClick={useHint}>
              Hint ({run.lifelines.hint})
            </button>
            <button className="btn stone" disabled={run.lifelines.time <= 0} onClick={useTime}>
              Extra time ({run.lifelines.time})
            </button>
            <button className="btn stone" disabled={run.lifelines.senior <= 0} onClick={useSenior}>
              Ask a senior ({run.lifelines.senior})
            </button>
          </div>
        </section>
      )}

      {screen === "feedback" && run?.challenge && banner && (
        <section className="panel">
          <p className={`kicker tone-${banner.tone}`}>{banner.title}</p>
          <h1>{run.challenge.principle}</h1>
          <p className="lede">{run.challenge.reveal}</p>
          <p>{run.challenge.why}</p>
          <Hearts label="You" value={Math.max(0, run.playerHearts)} max={run.playerMax} />
          <button className="btn gold" onClick={continueFromFeedback}>
            {banner.dead || banner.victory ? "Be reborn" : banner.slain ? "Back to the map" : "Next question"}
          </button>
        </section>
      )}

      {screen === "rebirth" && run && (
        <section className="panel">
          <p className="kicker">{victory ? "The crown is yours" : "Reborn"}</p>
          <h1>
            {victory
              ? `Bloodline ${run.bloodline} ends on the throne.`
              : `Bloodline ${run.bloodline} ends in the dust.`}
          </h1>
          <p className="lede">
            {victory && run.bloodline === 3
              ? "The Crown Examiner falls. Any Bloodline you have earned stays open, and the gear still fits."
              : "The route does not change. The questions do. Gold from this climb is in the armory, and the next Bloodline is open if you have not walked it yet."}
          </p>
          <p>You banked {run.gold} gold. The codex kept what you missed.</p>
          <div className="row">
            <button className="btn gold" onClick={() => setScreen("select")}>
              Choose a Bloodline
            </button>
            <button className="btn stone" onClick={() => open("armory", "rebirth")}>
              Armory
            </button>
          </div>
        </section>
      )}

      {screen === "armory" && (
        <section className="panel wide">
          <p className="kicker">Armory</p>
          <h1>{save.gold} gold</h1>
          <p className="lede">
            Gear is worn at the start of the next climb. Higher Bloodlines are where a shield and a
            spare heart change the fight.
          </p>
          {save.gold === 0 && !Object.values(save.gear).some(Boolean) && (
            <p>Slay an enemy to earn gold. The rack is empty until then.</p>
          )}
          <ul className="shop">
            {GEAR_COPY.map((item) => {
              const owned = save.gear[item.key];
              const price = PRICES[item.key];
              return (
                <li key={item.key}>
                  <div>
                    <strong>{item.name}</strong>
                    <p>{item.line}</p>
                  </div>
                  <button className="btn gold" disabled={owned || save.gold < price} onClick={() => buy(item.key)}>
                    {owned ? "Worn" : `${price} gold`}
                  </button>
                </li>
              );
            })}
          </ul>
          <button className="btn stone" onClick={closeOverlay}>
            Return
          </button>
        </section>
      )}

      {screen === "codex" && (
        <section className="panel wide">
          <p className="kicker">Codex</p>
          <h1>What the castle already taught you</h1>
          {save.codex.length === 0 ? (
            <p className="lede">
              Nothing is written here yet. Misses from a duel are kept, with the principle and the
              reason an interviewer cares.
            </p>
          ) : (
            <ul className="codex">
              {save.codex.map((entry) => (
                <li key={entry.id}>
                  <p className="kicker">
                    Bloodline {entry.bloodline} · {entry.principle}
                  </p>
                  <p>{entry.prompt}</p>
                  <p>
                    <strong>{entry.reveal}</strong>
                  </p>
                  <p>{entry.why}</p>
                </li>
              ))}
            </ul>
          )}
          <button className="btn stone" onClick={closeOverlay}>
            Return
          </button>
        </section>
      )}
    </main>
  );
}

function Hearts({ label, value, max }: { label: string; value: number; max: number }) {
  return (
    <p className="hearts" aria-label={`${label}: ${value} of ${max} hearts`}>
      <span>{label}</span>
      {Array.from({ length: max }, (_, index) => (
        <i key={index} className={index < value ? "full" : "empty"}>
          {index < value ? "♥" : "♡"}
        </i>
      ))}
    </p>
  );
}

function Figure({ role }: { role: string }) {
  return <div className={`figure role-${role}`} aria-hidden="true" />;
}
