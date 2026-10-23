export type PromptParts = { intro: string | null; code: string | null; ask: string };

/**
 * A multi-line prompt is an optional intro line ending in ":", then code, then the question
 * on the last line. Code keeps its indentation.
 */
export function splitPrompt(text: string): PromptParts {
  const lines = text.split("\n");
  if (lines.length === 1) return { intro: null, code: null, ask: text };
  const ask = lines.pop() as string;
  const intro = lines[0].trimEnd().endsWith(":") ? (lines.shift() as string) : null;
  const code = lines.join("\n");
  return { intro, code: code.trim() ? code : null, ask };
}
