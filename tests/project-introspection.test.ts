import { describe, expect, it } from "vitest";

import { classifyTheme, summarizePreview, titleCaseTheme } from "../src/project-introspection.js";
import type { Note } from "../src/storage.js";

function makeNote(title: string, tags: string[]): Note {
  return {
    id: "note-1",
    title,
    content: "content",
    tags,
    createdAt: "2026-03-07T00:00:00.000Z",
    updatedAt: "2026-03-07T00:00:00.000Z",
  };
}

describe("project introspection helpers", () => {
  it("classifies overview notes", () => {
    expect(classifyTheme(makeNote("mnemonic overview", ["architecture"]))).toBe("overview");
  });

  it("classifies policy notes as decisions", () => {
    expect(classifyTheme(makeNote("storage policy", ["policy", "ux"]))).toBe("decisions");
  });

  it("summarizes previews to a single trimmed line", () => {
    expect(summarizePreview("line one\n\nline two", 40)).toBe("line one line two");
  });

  it("title-cases theme labels", () => {
    expect(titleCaseTheme("tooling")).toBe("Tooling");
  });
});
