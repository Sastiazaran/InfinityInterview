"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import { ART } from "@/game/art";
import { EGGS, fillLine, NODE_IDS, type EggId, type IconId, type NpcId } from "@/game/contracts";
import { STORY } from "@/game/story";
import { awardEgg, beginDuel, clearStage, fallClimb, newRun, openChest, placePlayer, visitNpc } from "@/game/engine";
import { SequenceWatch, sequenceToken, type SequenceId } from "@/game/eggs";
import { hash } from "@/game/rng";
import { enemyOf, nodeAt } from "@/game/route";
import { emptySave, loadSave, wipeSave, writeSave } from "@/game/save";
import type { Save } from "@/game/types";
import { WorldBridge, type WorldEvent } from "@/game/world/bridge";
import { START } from "@/game/world/map";
import { Duel } from "./duel/Duel";
import { isConfirm, isMenu, LAYER, useKeyLayer, useKeyUp, walkOf } from "./keys";
import { Overworld } from "./Overworld";
import { Codex } from "./screens/Codex";
import { Confirm } from "./screens/Confirm";
import { Controls } from "./screens/Controls";
import { Hud, type GoldPop } from "./screens/Hud";
import { Pause } from "./screens/Pause";
import { Rebirth, type Ending } from "./screens/Rebirth";
import { Satchel } from "./screens/Satchel";
import { Secrets } from "./screens/Secrets";
import { Shop } from "./screens/Shop";
import { Title } from "./screens/Title";
import { TouchPad } from "./screens/TouchPad";
import { Store, useStore } from "./store";
import { Dialog, type DialogTone } from "./ui/Dialog";
import { Icon } from "./ui/Sprites";

type Screen = "title" | "map" | "duel" | "rebirth";

type ConfirmAction = "restart" | "abandon" | "wipe";

type PanelState =
  | { kind: "pause" }
  | { kind: "shop" }
  | { kind: "satchel" }
  | { kind: "codex" }
  | { kind: "secrets" }
  | { kind: "controls"; first: boolean }
  | { kind: "confirm"; action: ConfirmAction; bloodline: number };

type Talk = {
  id: number;
  lines: string[];
  tone: DialogTone;
  speaker?: string;
  portrait?: NpcId;
  title?: string;
  /** Darkens the whole screen, for the prologue. */
  veil?: boolean;
  /** Opens once the last line is dismissed. */
  then?: "shop" | "controls";
  /** Granted once the last line is dismissed. */
  egg?: EggId;
};

type Toast = { id: number; text: string; icon?: IconId; tone?: "chapter" };

let serial = 0;
const nextId = () => ++serial;

function randomLine(pool: readonly string[]): string {
  return pool.length ? pool[Math.floor(Math.random() * pool.length)] : "";
}

function climbId(): string {
  return `${Date.now().toString(36)}${Math.floor(Math.random() * 1e8).toString(36)}`;
}

const CONFIRM_YES: Record<ConfirmAction, string> = {
  restart: "Restart the climb",
  abandon: "Begin the new climb",
  wipe: "Erase everything",
};

export function GameApp() {
  const [store] = useState(() => new Store<Save>(loadSave()));
  const [bridge] = useState(() => new WorldBridge());
  const save = useStore(store);
  const [screen, setScreen] = useState<Screen>("title");
  const [panels, setPanels] = useState<PanelState[]>([]);
  const [talks, setTalks] = useState<Talk[]>([]);
  const [toast, setToast] = useState<Toast | null>(null);
  const [pops, setPops] = useState<GoldPop[]>([]);
  const [ending, setEnding] = useState<Ending | null>(null);
  const [duelKey, setDuelKey] = useState(0);
  const [ready, setReady] = useState(false);
  const [pauseAt, setPauseAt] = useState(0);
  const jokes = useRef(new Set<string>());

  const run = save.run;
  const panel = panels.at(-1) ?? null;
  const talk = talks[0] ?? null;
  const overlay = panel !== null || talk !== null;
  const onMap = screen === "map";

  useEffect(() => store.subscribe(() => writeSave(store.get())), [store]);

  useEffect(() => {
    bridge.set({
      climbId: run?.id ?? null,
      bloodline: run?.bloodline ?? 1,
      nodeIndex: run?.nodeIndex ?? 0,
      chests: run?.chests ?? [],
      start: run?.pos ?? START,
      visible: onMap,
      active: onMap && !overlay,
    });
  }, [bridge, run, onMap, overlay]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), toast.tone === "chapter" ? 3400 : 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  // ——— Small helpers, called from handlers only ———

  function fill(line: string): string {
    const current = store.get();
    return fillLine(line, { bloodline: current.run?.bloodline ?? current.lastBloodline, gold: current.gold });
  }

  function say(next: Omit<Talk, "id">) {
    setTalks((list) => [...list, { ...next, id: nextId() }]);
  }

  function pop(amount: number) {
    if (amount > 0) setPops((list) => [...list, { id: nextId(), amount }]);
  }

  function note(text: string, icon?: IconId) {
    setToast({ id: nextId(), text, icon });
  }

  function open(next: PanelState) {
    setPanels((list) => [...list, next]);
  }

  function openPause() {
    setPauseAt(0);
    open({ kind: "pause" });
  }

  function close() {
    setPanels((list) => list.slice(0, -1));
  }

  function clearOverlays() {
    setPanels([]);
    setTalks([]);
  }

  function eggTalk(egg: EggId): Omit<Talk, "id"> {
    const story = STORY.eggs[egg];
    return { tone: "egg", title: story.title, speaker: "Secret found", lines: story.lines.map(fill) };
  }

  /** Awards a secret once per save and celebrates it. Returns false when it was already found. */
  function grant(egg: EggId): boolean {
    const result = awardEgg(store.get(), egg);
    if (!result.fresh) return false;
    store.set(result.save);
    if (screen === "map") pop(EGGS[egg].gold);
    say(eggTalk(egg));
    return true;
  }

  function finishTalk(done: Talk) {
    setTalks((list) => list.filter((item) => item.id !== done.id));
    if (done.then === "shop") open({ kind: "shop" });
    if (done.then === "controls") open({ kind: "controls", first: true });
    if (done.egg) grant(done.egg);
  }

  // ——— The climb ———

  function beginClimb(bloodline: number) {
    const before = store.get();
    const started = newRun(before, bloodline, climbId());
    const climb = started.run;
    if (!climb) return;
    const prologue = !started.seen.prologue;
    const controls = !started.seen.controls;
    store.set({ ...started, seen: { prologue: true, controls: true } });
    jokes.current.clear();
    setEnding(null);
    setPops([]);
    setTalks(
      prologue
        ? [
            {
              id: nextId(),
              tone: "info",
              title: STORY.title,
              lines: STORY.prologue.map(fill),
              veil: true,
              then: controls ? "controls" : undefined,
            },
          ]
        : [],
    );
    setPanels(!prologue && controls ? [{ kind: "controls", first: true }] : []);
    setScreen("map");
    const chapter = STORY.chapter(climb.bloodline);
    setToast({ id: nextId(), text: `Bloodline ${chapter.numeral} · ${chapter.title}`, tone: "chapter" });
  }

  function resume() {
    const current = store.get();
    if (!current.run) return;
    clearOverlays();
    setEnding(null);
    if (current.run.duel) {
      setDuelKey((key) => key + 1);
      setScreen("duel");
    } else setScreen("map");
  }

  function toTitle() {
    clearOverlays();
    setEnding(null);
    setScreen("title");
  }

  function startOver() {
    wipeSave();
    store.set(emptySave());
    clearOverlays();
    setEnding(null);
    setPops([]);
    setToast(null);
    setScreen("title");
  }

  function winDuel() {
    const before = store.get();
    const climb = before.run;
    if (!climb) return;
    const node = nodeAt(climb.nodeIndex);
    const { save: after, reward, finished } = clearStage(before);
    store.set(after);
    setPanels([]);
    const parts = [`Stage +${reward.stage}`];
    if (reward.flawless) parts.push(`Flawless +${reward.flawless}`);
    if (reward.throne) parts.push(`Crown +${reward.throne}`);
    const gold = `${parts.join(" · ")} gold. Your purse holds ${after.gold}.`;
    const cleared = fillLine(STORY.stageClear[node.id], { bloodline: climb.bloodline, gold: after.gold });

    if (finished) {
      setEnding({
        finished,
        victory: true,
        line: randomLine(STORY.rebirth.victory),
        unlockedBefore: before.unlocked,
        unlockedAfter: after.unlocked,
      });
      setScreen("rebirth");
      say({ tone: "clear", title: `${node.place} falls`, lines: [cleared, gold] });
      return;
    }

    setScreen("map");
    pop(reward.total);
    const ahead = nodeAt(climb.nodeIndex + 1);
    const foe = STORY.enemies[enemyOf(climb.nodeIndex + 1, climb.bloodline)];
    say({
      tone: "clear",
      title: `${node.place} cleared`,
      lines: [cleared, gold, `Next: ${foe.name} waits at ${ahead.place}.`],
    });
  }

  function loseDuel() {
    const before = store.get();
    const { save: after, finished } = fallClimb(before);
    store.set(after);
    setPanels([]);
    if (!finished) {
      setScreen("title");
      return;
    }
    setEnding({
      finished,
      victory: false,
      line: randomLine(STORY.rebirth.defeat),
      unlockedBefore: before.unlocked,
      unlockedAfter: after.unlocked,
    });
    setScreen("rebirth");
  }

  // ——— The map talks to us through the bridge ———

  const onWorld = useEffectEvent((event: WorldEvent) => {
    const current = store.get();
    const climb = current.run;
    switch (event.type) {
      case "ready":
        setReady(true);
        return;
      case "step":
        store.set(placePlayer(current, { x: event.x, y: event.y, facing: event.facing }));
        return;
      case "encounter": {
        if (!climb || climb.nodeIndex !== event.node || screen !== "map" || overlay) return;
        store.set(beginDuel(current));
        setToast(null);
        setDuelKey((key) => key + 1);
        setScreen("duel");
        return;
      }
      case "talk": {
        const story = STORY.npcs[event.npc];
        const visit = visitNpc(current, event.npc, story.lines.length);
        store.set(visit.save);
        const egg: EggId | undefined =
          event.npc === "duck" ? "rubber-duck" : event.npc === "ghost" ? "git-blame" : undefined;
        say({
          tone: "npc",
          speaker: story.name,
          portrait: event.npc,
          lines: [fill(story.lines[visit.line] ?? "…")],
          then: event.shop ? "shop" : undefined,
          egg: egg && !current.secrets.includes(egg) ? egg : undefined,
        });
        return;
      }
      case "sign": {
        const [heading = "", ...rest] = STORY.signs[event.sign] ?? [];
        say({
          tone: "sign",
          title: heading,
          lines: (rest.length ? rest : [heading]).map(fill),
          egg: event.sign === "hello-world" && !current.secrets.includes("hello-world") ? "hello-world" : undefined,
        });
        return;
      }
      case "chest": {
        if (!climb) return;
        const result = openChest(current, event.chest, hash(`${climb.id}:${event.chest}`));
        if (result.gold <= 0) return;
        store.set(result.save);
        pop(result.gold);
        note(`Chest opened: +${result.gold} gold`, "coin");
        return;
      }
      case "secret":
        grant(event.egg);
        return;
      case "asleep": {
        if (!climb) return;
        const sleeper = STORY.enemies[enemyOf(event.node, climb.bloodline)].name;
        const awake = STORY.enemies[enemyOf(climb.nodeIndex, climb.bloodline)].name;
        note(`${sleeper} sleeps until ${awake} falls.`);
        return;
      }
      case "water":
        if (jokes.current.has("water")) return;
        jokes.current.add("water");
        note("The sea is out of scope for this release.");
        return;
    }
  });

  useEffect(() => {
    bridge.onEvent((event) => onWorld(event));
    return () => bridge.onEvent(() => {});
  }, [bridge]);

  // ——— Typed secrets ———

  const onSequence = useEffectEvent((id: SequenceId) => {
    const walking = screen === "map" && !overlay;
    if (id === "konami") {
      if (screen !== "duel") grant("konami");
    } else if (id === "sudo") {
      if (walking && !grant("sudo")) note("You are already in the sudoers file. This incident will not be reported.");
    } else if (id === "ls" && walking) {
      note(NODE_IDS.map((node) => `${node}/`).join("  "));
    }
  });

  useEffect(() => {
    const watch = new SequenceWatch();
    const listener = (event: KeyboardEvent) => {
      if (event.repeat) return;
      const token = sequenceToken(event);
      if (!token) return;
      // X and Z are this game's B and A buttons, so the touch pad can enter the old code too.
      const pressed = token === "x" ? "b" : token === "z" ? "a" : token;
      for (const id of watch.push(pressed)) onSequence(id);
    };
    window.addEventListener("keydown", listener, { capture: true });
    return () => window.removeEventListener("keydown", listener, { capture: true });
  }, []);

  // ——— Walking ———

  useKeyLayer(
    LAYER.SCREEN,
    (event) => {
      const dir = walkOf(event);
      if (dir) {
        bridge.input.press(dir);
        return true;
      }
      if (isConfirm(event)) {
        if (!event.repeat) bridge.input.confirm();
        return true;
      }
      if (isMenu(event)) {
        if (!event.repeat) openPause();
        return true;
      }
      if (event.key === "i" || event.key === "I") {
        if (!event.repeat) open({ kind: "satchel" });
        return true;
      }
      return false;
    },
    { enabled: onMap && !overlay },
  );

  useKeyUp((event) => {
    if (event.key === "*") {
      bridge.input.clear();
      return;
    }
    const dir = walkOf(event);
    if (dir) bridge.input.release(dir);
  });

  // ——— Panels ———

  function confirmCopy(action: ConfirmAction, bloodline: number): { title: string; body: string } {
    const numeral = STORY.chapter(bloodline).numeral;
    if (action === "wipe") {
      return {
        title: "Start over?",
        body: "This erases the whole save: gold, gear, unlocked Bloodlines, the Codex, and every secret. There is no undo.",
      };
    }
    if (action === "restart") {
      return {
        title: `Restart Bloodline ${numeral}?`,
        body: "This climb ends here and a fresh one begins on the shore. Your gold, gear, Codex, and secrets stay.",
      };
    }
    return {
      title: "Abandon the climb in progress?",
      body: `A new climb of Bloodline ${numeral} begins on the shore. Your gold, gear, Codex, and secrets stay.`,
    };
  }

  function renderPanel(state: PanelState) {
    switch (state.kind) {
      case "pause":
        return (
          <Pause
            save={save}
            inDuel={screen === "duel"}
            cursor={pauseAt}
            onCursor={setPauseAt}
            onResume={close}
            onSatchel={() => open({ kind: "satchel" })}
            onShop={() => open({ kind: "shop" })}
            onCodex={() => open({ kind: "codex" })}
            onSecrets={() => open({ kind: "secrets" })}
            onControls={() => open({ kind: "controls", first: false })}
            onRestart={() => {
              const climb = store.get().run;
              if (climb) open({ kind: "confirm", action: "restart", bloodline: climb.bloodline });
            }}
            onTitle={toTitle}
            onStartOver={() => open({ kind: "confirm", action: "wipe", bloodline: 1 })}
          />
        );
      case "shop":
        return (
          <Shop
            store={store}
            onClose={(farewell) => {
              close();
              if (farewell) note(`${STORY.npcs.merchant.name}: “${farewell}”`);
            }}
          />
        );
      case "satchel":
        return <Satchel store={store} onClose={close} />;
      case "codex":
        return <Codex save={save} onClose={close} />;
      case "secrets":
        return <Secrets save={save} onClose={close} />;
      case "controls":
        return <Controls first={state.first} onClose={close} />;
      case "confirm": {
        const copy = confirmCopy(state.action, state.bloodline);
        return (
          <Confirm
            title={copy.title}
            body={copy.body}
            yes={CONFIRM_YES[state.action]}
            onNo={close}
            onYes={() => (state.action === "wipe" ? startOver() : beginClimb(state.bloodline))}
          />
        );
      }
    }
  }

  return (
    <main className={`game screen-${screen}`}>
      <Overworld bridge={bridge} hidden={!onMap} />

      {screen === "title" && (
        <Title
          save={save}
          enabled={!overlay}
          onContinue={resume}
          onStart={(bloodline) =>
            store.get().run ? open({ kind: "confirm", action: "abandon", bloodline }) : beginClimb(bloodline)
          }
          onCodex={() => open({ kind: "codex" })}
          onSecrets={() => open({ kind: "secrets" })}
          onControls={() => open({ kind: "controls", first: false })}
          onStartOver={() => open({ kind: "confirm", action: "wipe", bloodline: 1 })}
        />
      )}

      {onMap && (
        <>
          <Hud
            save={save}
            pops={pops}
            onPopDone={(id) => setPops((list) => list.filter((item) => item.id !== id))}
            onMenu={openPause}
          />
          {!ready && (
            <div className="world-loading" role="status">
              <p>Raising the castle…</p>
            </div>
          )}
          {toast && (
            <p key={toast.id} className={`toast ${toast.tone ?? ""}`} role="status">
              {toast.icon && <Icon id={toast.icon} scale={1} />}
              <span>{toast.text}</span>
            </p>
          )}
        </>
      )}

      {screen === "duel" && run?.duel && (
        <Duel
          key={duelKey}
          store={store}
          paused={overlay}
          onWin={winDuel}
          onLose={loseDuel}
          onMenu={openPause}
          onSatchel={() => open({ kind: "satchel" })}
          onEggs={(eggs) => eggs.forEach((egg) => say(eggTalk(egg)))}
        />
      )}

      {screen === "rebirth" && ending && (
        <Rebirth save={save} ending={ending} enabled={!overlay} onClimb={beginClimb} onTitle={toTitle} />
      )}

      {panel && <div key={`${panels.length}:${panel.kind}`}>{renderPanel(panel)}</div>}

      {talk && (
        <div className={`talk-layer ${talk.veil ? "veiled" : ""}`}>
          <Dialog
            key={talk.id}
            lines={talk.lines}
            tone={talk.tone}
            title={talk.title}
            speaker={talk.speaker}
            portrait={talk.portrait ? ART.npcPortrait[talk.portrait] : undefined}
            onDone={() => finishTalk(talk)}
            footer={
              talk.then === "shop" ? <p className="dialog-hint">Z to see the wares</p> : undefined
            }
          />
        </div>
      )}

      {(onMap || screen === "duel") && <TouchPad />}
    </main>
  );
}
