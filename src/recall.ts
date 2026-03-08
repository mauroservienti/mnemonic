import type { Vault } from "./vault.js";

export interface ScoredRecallCandidate {
  id: string;
  score: number;
  boosted: number;
  vault: Vault;
  isCurrentProject: boolean;
}

export function selectRecallResults(
  scored: ScoredRecallCandidate[],
  limit: number,
  scope: "project" | "global" | "all"
): ScoredRecallCandidate[] {
  const sorted = [...scored].sort((a, b) => b.boosted - a.boosted);

  if (scope !== "all") {
    return sorted.slice(0, limit);
  }

  const projectMatches = sorted.filter((candidate) => candidate.isCurrentProject);
  if (projectMatches.length === 0) {
    return sorted.slice(0, limit);
  }

  const topProject = projectMatches.slice(0, limit);
  if (topProject.length >= limit) {
    return topProject;
  }

  const selectedIds = new Set(topProject.map((candidate) => candidate.id));
  const fallback = sorted.filter((candidate) => !selectedIds.has(candidate.id));
  return [...topProject, ...fallback].slice(0, limit);
}
