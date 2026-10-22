"use client";

import { useState } from "react";
import { ART } from "@/game/art";
import { EGG_IDS, fillLine, toRoman } from "@/game/contracts";
import { STORY } from "@/game/story";
import { bloodlineFacts, levelFacts } from "@/game/balance";
import { climbName, guardianAt, placeAt, trackName } from "@/game/climb";
import { PATH_LIST, PATHS } from "@/game/paths";
import { LEVELS, MIX_TRACK, levelState, openLevel, trackOf } from "@/game/paths/progress";
import { LEVEL_COUNT, PATH_IDS, type Level, type PathId, type Save } from "@/game/types";
import { SpriteCanvas } from "@/components/art/SpriteCanvas";
import { arrowOf, isBack, isConfirm, LAYER, useKeyLayer } from "@/components/keys";
import { Menu, type MenuItem } from "@/components/ui/Menu";
import { Coin } from "@/components/ui/Sprites";
import { KeyHint } from "./Panel";

export type TitleMode = "menu" | "paths" | "tracks" | "levels" | "bloodline";

function bestCleared(save: Save, path: PathId): number {
  const progress = save.paths[path];
  return Math.max(progress.cleared, ...Object.values(progress.tracks).map((item) => item.cleared), 0);
}

export function Title({
  save,
  enabled,
  initialMode = "menu",
  onContinue,
  onStart,
  onCodex,
  onSecrets,
  onControls,
  onStartOver,
}: {
  save: Save;
  enabled: boolean;
  initialMode?: TitleMode;
  onContinue: () => void;
  /** Starts a climb: a level on a path (optional subtopic), or a Bloodline when the path is null. */
  onStart: (step: number, path: PathId | null, track?: string | null) => void;
  onCodex: () => void;
  onSecrets: () => void;
  onControls: () => void;
  onStartOver: () => void;
}) {
  const [mode, setMode] = useState<TitleMode>(initialMode);
  const [path, setPath] = useState<PathId>(save.lastPath ?? PATH_IDS[0]);
  const [track, setTrack] = useState<string | null>(save.paths[path].lastTrack);
  const [pick, setPick] = useState(Math.min(save.unlocked, Math.max(1, save.lastBloodline)));
  const [level, setLevel] = useState<number>(trackOf(save, path, track).last);
  const chosen = Math.min(pick, save.unlocked);
  const chapter = STORY.chapter(chosen);
  const open = openLevel(save, path, track);
  const chosenLevel = Math.min(level, open) as Level;
  const run = save.run;
  const def = PATHS[path];

  function choosePath(id: PathId) {
    const next = PATHS[id];
    const nextTrack = next.pickTracks ? save.paths[id].lastTrack : null;
    setPath(id);
    setTrack(nextTrack);
    setLevel(trackOf(save, id, nextTrack).last);
    setMode(next.pickTracks ? "tracks" : "levels");
  }

  function chooseTrack(seat: string | null) {
    setTrack(seat);
    setLevel(trackOf(save, path, seat).last);
    setMode("levels");
  }

  useKeyLayer(
    LAYER.SCREEN,
    (event) => {
      const arrow = arrowOf(event);
      const levels = mode === "levels";
      const top = levels ? open : save.unlocked;
      const at = levels ? chosenLevel : chosen;
      const set = levels ? setLevel : setPick;
      if (arrow === "left" || arrow === "down") {
        set(Math.max(1, at - 1));
        return true;
      }
      if (arrow === "right" || arrow === "up") {
        set(Math.min(top, at + 1));
        return true;
      }
      if (isConfirm(event)) {
        if (!event.repeat) onStart(at, levels ? path : null, levels ? track : null);
        return true;
      }
      if (isBack(event) || event.key === "Escape") {
        setMode(levels && def.pickTracks ? "tracks" : "paths");
        return true;
      }
      return false;
    },
    { enabled: enabled && (mode === "levels" || mode === "bloodline"), modal: true },
  );

  const items: MenuItem[] = [];
  if (run) {
    items.push({
      id: "continue",
      label: "Continue",
      detail: `${climbName(run)} · ${placeAt(run, run.nodeIndex)} · ${guardianAt(run, run.nodeIndex).story.name}${
        run.duel ? " (mid-duel)" : ""
      }`,
      onSelect: onContinue,
    });
  }
  items.push(
    {
      id: "new",
      label: "New climb",
      detail: `Pick a topic: ${PATH_LIST.map((item) => item.name).join(", ")}, or the mixed Bloodline`,
      onSelect: () => setMode("paths"),
    },
    {
      id: "codex",
      label: "Codex",
      detail: `${save.codex.length} ${save.codex.length === 1 ? "lesson" : "lessons"} from past misses`,
      onSelect: onCodex,
    },
    { id: "secrets", label: "Secrets", detail: `${save.secrets.length}/${EGG_IDS.length} found`, onSelect: onSecrets },
    { id: "controls", label: "Controls", onSelect: onControls },
    { id: "wipe", label: "Start over", detail: "Erase this save", onSelect: onStartOver },
  );

  const pathItems: MenuItem[] = [
    ...PATH_LIST.map((item) => {
      const cleared = bestCleared(save, item.id);
      const guardian = guardianAt({ path: item.id, bloodline: 1 }, 0);
      return {
        id: item.id,
        label: item.name,
        detail: item.blurb,
        icon: (
          <SpriteCanvas
            sprite={ART.enemyOverworldAt(guardian.look, guardian.age)}
            className="path-icon"
            label=""
          />
        ),
        aside: (
          <span className="path-progress" aria-label={`${cleared} of ${LEVEL_COUNT} levels cleared`}>
            {cleared}/{LEVEL_COUNT}
          </span>
        ),
        onSelect: () => choosePath(item.id),
      };
    }),
    {
      id: "bloodline",
      label: "Bloodline",
      detail: "Every topic mixed, Bloodline after Bloodline, with no last one",
      aside: <span className="path-progress">{toRoman(save.unlocked)}</span>,
      onSelect: () => {
        setPick(Math.min(save.unlocked, Math.max(1, save.lastBloodline)));
        setMode("bloodline");
      },
    },
  ];
  const lastIndex = save.lastPath ? PATH_IDS.indexOf(save.lastPath) : save.stats.climbs > 0 ? PATH_IDS.length : 0;

  const trackItems: MenuItem[] = def.pickTracks
    ? [
        {
          id: MIX_TRACK,
          label: "Mix of everything",
          detail: "A climb that walks every DSA topic, room by room",
          aside: (
            <span className="path-progress">
              {save.paths[path].cleared}/{LEVEL_COUNT}
            </span>
          ),
          onSelect: () => chooseTrack(null),
        },
        ...Object.entries(def.seats).map(([seat, label]) => {
          const cleared = trackOf(save, path, seat).cleared;
          return {
            id: seat,
            label,
            detail: `Five levels of ${label.toLowerCase()}`,
            aside: (
              <span className="path-progress">
                {cleared}/{LEVEL_COUNT}
              </span>
            ),
            onSelect: () => chooseTrack(seat),
          };
        }),
      ]
    : [];
  const lastTrackIndex = (() => {
    if (!def.pickTracks) return 0;
    const last = save.paths[path].lastTrack;
    if (!last) return 0;
    const seats = Object.keys(def.seats);
    const at = seats.indexOf(last);
    return at < 0 ? 0 : at + 1;
  })();

  const info = def.levels[chosenLevel];
  const state = levelState(save, path, chosenLevel, track);
  const topic = trackName(path, track);
  const backFromLevels = def.pickTracks ? "topics" : "paths";

  return (
    <section className="title-screen">
      <SpriteCanvas sprite={ART.backdrops.throne} className="title-bg" label="" />
      <div className="title-veil" />
      <div className="title-card">
        <p className="title-kicker">An interview castle</p>
        <h1 className="title-name">{STORY.title}</h1>
        <p className="title-tagline">{fillLine(STORY.tagline, { bloodline: chosen, gold: save.gold })}</p>
        <div className="title-purse">
          <Coin amount={save.gold} />
          <span>
            Highest Bloodline <b>{toRoman(save.unlocked)}</b>
          </span>
        </div>

        {mode === "menu" && (
          <Menu items={items} priority={LAYER.SCREEN} enabled={enabled} label="Title menu" className="title-menu" />
        )}

        {mode === "paths" && (
          <div className="path-picker">
            <p className="selector-title">Choose what to practice</p>
            <Menu
              items={pathItems}
              priority={LAYER.SCREEN}
              enabled={enabled}
              initial={lastIndex}
              onBack={() => setMode("menu")}
              label="Topics"
              className="title-menu"
            />
            <KeyHint
              keys={[
                ["↑↓", "choose"],
                ["Z", "pick"],
                ["X", "back"],
              ]}
            />
          </div>
        )}

        {mode === "tracks" && (
          <div className="path-picker">
            <p className="title-kicker">{def.castle}</p>
            <p className="selector-title">{def.name}: pick a topic, or a mix</p>
            <Menu
              items={trackItems}
              priority={LAYER.SCREEN}
              enabled={enabled}
              initial={lastTrackIndex}
              onBack={() => setMode("paths")}
              label="DSA topics"
              className="title-menu"
            />
            <KeyHint
              keys={[
                ["↑↓", "choose"],
                ["Z", "pick"],
                ["X", "paths"],
              ]}
            />
          </div>
        )}

        {mode === "levels" && (
          <div className="selector" aria-live="polite">
            <p className="title-kicker">{def.castle}</p>
            <div className="selector-row">
              <button
                type="button"
                tabIndex={-1}
                className="chip ghost"
                disabled={chosenLevel <= 1}
                onClick={() => setLevel(Math.max(1, chosenLevel - 1))}
                aria-label="Previous level"
              >
                ◀
              </button>
              <div className="selector-numeral">
                <span>
                  {def.name}
                  {topic ? ` · ${topic}` : ""} · Level
                </span>
                <b>{chosenLevel}</b>
              </div>
              <button
                type="button"
                tabIndex={-1}
                className="chip ghost"
                disabled={chosenLevel >= open}
                onClick={() => setLevel(Math.min(open, chosenLevel + 1))}
                aria-label="Next level"
              >
                ▶
              </button>
            </div>
            <ol className="level-track" aria-label="Levels">
              {LEVELS.map((n) => {
                const at = levelState(save, path, n, track);
                return (
                  <li key={n}>
                    <button
                      type="button"
                      tabIndex={-1}
                      className={`level-pip ${at} ${n === chosenLevel ? "on" : ""}`}
                      disabled={at === "locked"}
                      onClick={() => setLevel(n)}
                      aria-label={`Level ${n}, ${at}`}
                    >
                      {at === "cleared" ? "✓" : n}
                    </button>
                  </li>
                );
              })}
            </ol>
            <p className="selector-title">{info.title}</p>
            <p className="selector-focus">{info.focus}</p>
            <p className="selector-epigraph">{info.epigraph}</p>
            <ul className="selector-facts">
              {levelFacts(chosenLevel).map((fact) => (
                <li key={fact}>{fact}</li>
              ))}
            </ul>
            <p className="muted small">
              {state === "cleared"
                ? "Cleared. Climb it again to practice."
                : chosenLevel < LEVEL_COUNT
                  ? `Defeat the throne of Level ${chosenLevel} to unlock Level ${chosenLevel + 1}.`
                  : "The last level. Its throne asks like a senior interview."}
            </p>
            <button
              type="button"
              tabIndex={-1}
              className="btn gold"
              onClick={() => onStart(chosenLevel, path, track)}
            >
              Climb Level {chosenLevel}
            </button>
            <KeyHint
              keys={[
                ["← →", "level"],
                ["Z", "climb"],
                ["X", backFromLevels],
              ]}
            />
          </div>
        )}

        {mode === "bloodline" && (
          <div className="selector" aria-live="polite">
            <div className="selector-row">
              <button
                type="button"
                tabIndex={-1}
                className="chip ghost"
                disabled={chosen <= 1}
                onClick={() => setPick(Math.max(1, chosen - 1))}
                aria-label="Previous Bloodline"
              >
                ◀
              </button>
              <div className="selector-numeral">
                <span>Bloodline</span>
                <b>{chapter.numeral}</b>
              </div>
              <button
                type="button"
                tabIndex={-1}
                className="chip ghost"
                disabled={chosen >= save.unlocked}
                onClick={() => setPick(Math.min(save.unlocked, chosen + 1))}
                aria-label="Next Bloodline"
              >
                ▶
              </button>
            </div>
            <p className="selector-title">{chapter.title}</p>
            <p className="selector-epigraph">{fillLine(chapter.epigraph, { bloodline: chosen, gold: save.gold })}</p>
            <ul className="selector-facts">
              {bloodlineFacts(chosen).map((fact) => (
                <li key={fact}>{fact}</li>
              ))}
            </ul>
            <p className="muted small">
              Finish a climb of Bloodline {toRoman(save.unlocked)}, win or lose, to unlock Bloodline{" "}
              {toRoman(save.unlocked + 1)}.
            </p>
            <button type="button" tabIndex={-1} className="btn gold" onClick={() => onStart(chosen, null)}>
              Climb Bloodline {chapter.numeral}
            </button>
            <KeyHint
              keys={[
                ["← →", "choose"],
                ["Z", "climb"],
                ["X", "topics"],
              ]}
            />
          </div>
        )}
      </div>
    </section>
  );
}
