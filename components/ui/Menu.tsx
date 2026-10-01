"use client";

import { useState, type ReactNode } from "react";
import { arrowOf, digitOf, isBack, isConfirm, LAYER, useKeyLayer, wrapIndex } from "@/components/keys";

export type MenuItem = {
  id: string;
  label: ReactNode;
  detail?: ReactNode;
  icon?: ReactNode;
  aside?: ReactNode;
  disabled?: boolean;
  onSelect?: () => void;
};

/** A vertical list driven by the arrows, number keys, and confirm. */
export function Menu({
  items,
  priority = LAYER.PANEL,
  modal = true,
  enabled = true,
  numbered = true,
  initial = 0,
  onBack,
  onCursor,
  className,
  label,
}: {
  items: MenuItem[];
  priority?: number;
  modal?: boolean;
  enabled?: boolean;
  numbered?: boolean;
  initial?: number;
  onBack?: () => void;
  onCursor?: (item: MenuItem, index: number) => void;
  className?: string;
  label?: string;
}) {
  const [cursor, setCursor] = useState(initial);
  const index = Math.min(Math.max(0, cursor), Math.max(0, items.length - 1));

  function move(next: number) {
    const wrapped = wrapIndex(next, items.length);
    setCursor(wrapped);
    onCursor?.(items[wrapped], wrapped);
  }

  function choose(at: number) {
    const item = items[at];
    if (!item || item.disabled) return;
    item.onSelect?.();
  }

  useKeyLayer(
    priority,
    (event) => {
      const arrow = arrowOf(event);
      if (arrow === "up") {
        move(index - 1);
        return true;
      }
      if (arrow === "down") {
        move(index + 1);
        return true;
      }
      if (isConfirm(event)) {
        if (!event.repeat) choose(index);
        return true;
      }
      if (isBack(event) && onBack) {
        if (!event.repeat) onBack();
        return true;
      }
      const digit = digitOf(event);
      if (numbered && digit !== null && digit >= 1 && digit <= items.length) {
        move(digit - 1);
        choose(digit - 1);
        return true;
      }
      return false;
    },
    { enabled, modal },
  );

  return (
    <ul className={`menu ${className ?? ""}`} role="menu" aria-label={label}>
      {items.map((item, at) => (
        <li key={item.id} role="none">
          <button
            type="button"
            role="menuitem"
            tabIndex={-1}
            className={`menu-item ${at === index ? "on" : ""} ${item.disabled ? "off" : ""}`}
            aria-disabled={item.disabled || undefined}
            onMouseEnter={() => move(at)}
            onClick={() => {
              move(at);
              choose(at);
            }}
          >
            <span className="menu-cursor" aria-hidden>
              ▶
            </span>
            {item.icon && <span className="menu-icon">{item.icon}</span>}
            <span className="menu-text">
              <span className="menu-label">{item.label}</span>
              {item.detail && <span className="menu-detail">{item.detail}</span>}
            </span>
            {item.aside && <span className="menu-aside">{item.aside}</span>}
            {numbered && at < 9 && (
              <kbd className="menu-num" aria-hidden>
                {at + 1}
              </kbd>
            )}
          </button>
        </li>
      ))}
    </ul>
  );
}
