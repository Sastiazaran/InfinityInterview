"use client";

import type { PointerEvent } from "react";

function send(type: "keydown" | "keyup", key: string) {
  window.dispatchEvent(new KeyboardEvent(type, { key, bubbles: true, cancelable: true }));
}

function Pad({ keyName, label, className }: { keyName: string; label: string; className: string }) {
  const down = (event: PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    send("keydown", keyName);
  };
  const up = () => send("keyup", keyName);
  return (
    <button
      type="button"
      tabIndex={-1}
      className={`pad ${className}`}
      aria-label={label}
      onPointerDown={down}
      onPointerUp={up}
      onPointerCancel={up}
      onLostPointerCapture={up}
      onContextMenu={(event) => event.preventDefault()}
    >
      <span aria-hidden>{label.length <= 2 ? label : ""}</span>
    </button>
  );
}

/** On small screens: a D-pad and A/B buttons that press the same keys as a keyboard. */
export function TouchPad() {
  return (
    <div className="touchpad" aria-label="Touch controls">
      <div className="dpad">
        <Pad keyName="ArrowUp" label="Up" className="up" />
        <Pad keyName="ArrowLeft" label="Left" className="left" />
        <Pad keyName="ArrowRight" label="Right" className="right" />
        <Pad keyName="ArrowDown" label="Down" className="down" />
      </div>
      <div className="pad-mid">
        <Pad keyName="Escape" label="Menu" className="menu-btn" />
        <Pad keyName="i" label="Satchel" className="item-btn" />
      </div>
      <div className="ab">
        <Pad keyName="x" label="B" className="b" />
        <Pad keyName="z" label="A" className="a" />
      </div>
    </div>
  );
}
