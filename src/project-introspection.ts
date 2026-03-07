import type { Note } from "./storage.js";

export function summarizePreview(content: string, maxLength = 120): string {
  const singleLine = content.replace(/\s+/g, " ").trim();
  if (singleLine.length <= maxLength) {
    return singleLine;
  }
  return `${singleLine.slice(0, maxLength - 3)}...`;
}

export function classifyTheme(note: Note): string {
  const title = note.title.toLowerCase();
  const tags = new Set(note.tags.map((tag) => tag.toLowerCase()));

  if (tags.has("overview") || title.includes("overview")) return "overview";
  if (tags.has("decisions") || tags.has("design") || tags.has("policy") || tags.has("ux")) return "decisions";
  if (tags.has("tools") || tags.has("mcp") || tags.has("docker") || tags.has("deployment")) return "tooling";
  if (tags.has("bugs") || tags.has("setup")) return "bugs";
  if (tags.has("relationships") || tags.has("graph") || tags.has("architecture") || tags.has("structure")) return "architecture";
  if (tags.has("linting") || tags.has("tests") || tags.has("quality")) return "quality";
  return "other";
}

export function titleCaseTheme(theme: string): string {
  return `${theme[0]?.toUpperCase() ?? ""}${theme.slice(1)}`;
}
