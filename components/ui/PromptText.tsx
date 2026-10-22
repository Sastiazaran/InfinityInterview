import type { ReactNode } from "react";
import { splitPrompt } from "@/game/prompt";

/** Text in backticks is inline code. */
export function inlineCode(text: string): ReactNode[] {
  return text.split(/(`[^`]+`)/g).map((part, index) =>
    part.length > 2 && part.startsWith("`") && part.endsWith("`") ? (
      <code key={index}>{part.slice(1, -1)}</code>
    ) : (
      part
    ),
  );
}

export function PromptText({ text, className }: { text: string; className?: string }) {
  const { intro, code, ask } = splitPrompt(text);
  return (
    <div className={className}>
      {intro && <p>{inlineCode(intro)}</p>}
      {code && <pre className="prompt-code">{code}</pre>}
      <p>{inlineCode(ask)}</p>
    </div>
  );
}
