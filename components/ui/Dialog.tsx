"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { Sprite } from "@/game/contracts";
import { SpriteCanvas } from "@/components/art/SpriteCanvas";
import { isBack, isConfirm, LAYER, useKeyLayer } from "@/components/keys";

const CHAR_MS = 22;

export type DialogTone = "npc" | "sign" | "egg" | "info" | "enemy" | "clear";

/** Reveal a line character by character. `token` restarts the reveal even when the text repeats. */
export function useTypewriter(text: string, token: string | number = "") {
  const id = `${token}\u0000${text}`;
  const [state, setState] = useState({ id, count: 0 });
  const count = state.id === id ? state.count : 0;
  useEffect(() => {
    let typed = 0;
    const timer = window.setInterval(() => {
      typed += 1;
      setState((previous) =>
        previous.id === id && previous.count >= typed ? previous : { id, count: Math.min(text.length, typed) },
      );
      if (typed >= text.length) window.clearInterval(timer);
    }, CHAR_MS);
    return () => window.clearInterval(timer);
  }, [id, text]);
  return {
    shown: text.slice(0, count),
    done: count >= text.length,
    count,
    finish: () => setState({ id, count: text.length }),
  };
}

export function Dialog({
  lines,
  speaker,
  portrait,
  tone = "npc",
  title,
  priority = LAYER.MODAL,
  onDone,
  footer,
  className,
}: {
  lines: string[];
  speaker?: string;
  portrait?: Sprite;
  tone?: DialogTone;
  title?: string;
  priority?: number;
  onDone: () => void;
  footer?: ReactNode;
  className?: string;
}) {
  const [index, setIndex] = useState(0);
  const text = lines[index] ?? "";
  const typer = useTypewriter(text, index);
  const last = index >= lines.length - 1;

  function advance() {
    if (!typer.done) {
      typer.finish();
      return;
    }
    if (last) onDone();
    else setIndex(index + 1);
  }

  useKeyLayer(
    priority,
    (event) => {
      if ((isConfirm(event) || isBack(event)) && !event.repeat) {
        advance();
        return true;
      }
      return false;
    },
    { modal: true },
  );

  const talking = !typer.done && Math.floor(typer.count / 3) % 2 === 1;

  return (
    <div className={`dialog tone-${tone} ${className ?? ""}`} role="dialog" aria-live="polite" onClick={advance}>
      {tone === "egg" && <Sparkles />}
      {portrait && (
        <div className="dialog-portrait">
          <SpriteCanvas
            sprite={portrait}
            frame={talking && portrait.frames.includes("talk") ? "talk" : portrait.frames[0]}
            scale={2}
            label={speaker}
          />
        </div>
      )}
      <div className="dialog-body">
        {title && <p className="dialog-title">{title}</p>}
        {speaker && <p className="dialog-speaker">{speaker}</p>}
        <p className="dialog-text">
          {typer.shown}
          <span className="dialog-ghost" aria-hidden>
            {text.slice(typer.shown.length)}
          </span>
        </p>
        {footer}
      </div>
      <span className={`dialog-next ${typer.done ? "ready" : ""}`} aria-hidden>
        {last ? "■" : "▼"}
      </span>
    </div>
  );
}

const SPARKS = Array.from({ length: 14 }, (_, index) => ({
  left: (index * 37) % 100,
  top: (index * 53) % 100,
  delay: (index % 7) * 0.18,
}));

export function Sparkles() {
  return (
    <span className="sparkles" aria-hidden>
      {SPARKS.map((spark, index) => (
        <i
          key={index}
          style={{ left: `${spark.left}%`, top: `${spark.top}%`, animationDelay: `${spark.delay}s` }}
        />
      ))}
    </span>
  );
}
