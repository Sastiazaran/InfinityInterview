import { describe, expect, it } from "vitest";
import { splitPrompt } from "./prompt";

describe("splitPrompt", () => {
  it("keeps a one-line prompt as the question", () => {
    expect(splitPrompt("Which is O(1)?")).toEqual({ intro: null, code: null, ask: "Which is O(1)?" });
  });

  it("treats every line before the question as code, keeping indentation", () => {
    const parts = splitPrompt("while (n > 1) {\n  n = n / 2\n}\nHow often does it loop?");
    expect(parts).toEqual({ intro: null, code: "while (n > 1) {\n  n = n / 2\n}", ask: "How often does it loop?" });
  });

  it("splits off an intro line that ends with a colon", () => {
    const parts = splitPrompt("Given this query:\nSELECT * FROM t\nWhat does it return?");
    expect(parts).toEqual({ intro: "Given this query:", code: "SELECT * FROM t", ask: "What does it return?" });
  });

  it("keeps a two-line prompt with an intro and a question free of code", () => {
    expect(splitPrompt("A note:\nWhat now?")).toEqual({ intro: "A note:", code: null, ask: "What now?" });
  });
});
