"use client";

import { LAYER } from "@/components/keys";
import { Menu } from "@/components/ui/Menu";
import { Panel } from "./Panel";

export function Confirm({
  title,
  body,
  yes,
  onYes,
  onNo,
}: {
  title: string;
  body: string;
  yes: string;
  onYes: () => void;
  onNo: () => void;
}) {
  return (
    <Panel title={title} className="confirm">
      <p>{body}</p>
      <Menu
        priority={LAYER.CONFIRM}
        label={title}
        onBack={onNo}
        items={[
          { id: "no", label: "Keep going", onSelect: onNo },
          { id: "yes", label: yes, onSelect: onYes },
        ]}
      />
    </Panel>
  );
}
