"use client";

import { isBack, isConfirm, isMenu, LAYER, useKeyLayer } from "@/components/keys";
import { Panel } from "./Panel";

export const CONTROLS: [string, string][] = [
  ["Arrows or WASD", "Walk the map, move a cursor"],
  ["Z, Enter, Space", "Talk, read, open, confirm"],
  ["X, Backspace", "Back. Undo inside a puzzle"],
  ["Esc or P", "Menu"],
  ["1–4", "Pick an answer"],
  ["H", "Hint (duels)"],
  ["T", "Extra time (duels)"],
  ["S", "Ask a senior (duels)"],
  ["I", "Satchel"],
];

export function Controls({ first, onClose }: { first: boolean; onClose: () => void }) {
  useKeyLayer(
    LAYER.PANEL,
    (event) => {
      if (isConfirm(event) || isBack(event) || isMenu(event)) {
        if (!event.repeat) onClose();
        return true;
      }
      return false;
    },
    { modal: true },
  );

  return (
    <Panel
      title={first ? "Before you climb" : "Controls"}
      className="controls"
      footer={
        <button type="button" tabIndex={-1} className="btn gold" onClick={onClose}>
          {first ? "Z: begin the climb" : "Z: close"}
        </button>
      }
    >
      {first && (
        <p className="muted">
          Walk up the shore to the first guardian. Break its hearts with right answers, and gold drops into your purse at
          once. Talk to everyone. Read the signs. Open the chests.
        </p>
      )}
      <table className="keys-table">
        <tbody>
          {CONTROLS.map(([key, action]) => (
            <tr key={key}>
              <th>
                <kbd>{key}</kbd>
              </th>
              <td>{action}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  );
}
